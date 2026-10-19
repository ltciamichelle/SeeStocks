import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Watchlist from "@/models/Watchlist";

export const dynamic = "force-dynamic";

/**
 * Safely extracts the userId from the Clerk session.
 * Never reads or trusts userId from the request body or parameters.
 */
async function getAuthUserId(): Promise<{ userId: string | null; authError?: string }> {
  try {
    const { userId } = await auth();
    return { userId };
  } catch (err: unknown) {
    return {
      userId: null,
      authError: err instanceof Error ? err.message : "Authentication session error",
    };
  }
}

/**
 * GET /api/watchlist
 * Fetches the authenticated user's saved symbols list from MongoDB.
 * userId is obtained strictly from the Clerk server session.
 */
export async function GET() {
  const { userId } = await getAuthUserId();

  if (!userId) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
        message: "You must be signed in to view your saved watchlist.",
      },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();

    const watchlist = await Watchlist.findOne({ userId }).lean();

    return NextResponse.json({
      symbols: watchlist?.symbols || [],
      updatedAt: watchlist?.updatedAt || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load watchlist from database";
    return NextResponse.json(
      {
        error: "WATCHLIST_FETCH_ERROR",
        message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist
 * Adds a symbol (or merges an array of symbols) into the authenticated user's watchlist.
 * Supports:
 * - Single symbol addition: { symbol: "AAPL" }
 * - Batch merge (used when logging in with localStorage): { symbols: ["AAPL", "NVDA"] }
 * userId is obtained strictly from the Clerk server session, NEVER from the request body.
 */
export async function POST(request: NextRequest) {
  const { userId } = await getAuthUserId();

  if (!userId) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
        message: "You must be signed in to edit your watchlist.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawSymbols: string[] = [];

    if (typeof body.symbol === "string" && body.symbol.trim()) {
      rawSymbols.push(body.symbol.trim());
    }

    if (Array.isArray(body.symbols)) {
      for (const s of body.symbols) {
        if (typeof s === "string" && s.trim()) {
          rawSymbols.push(s.trim());
        }
      }
    }

    const cleanSymbols = Array.from(
      new Set(
        rawSymbols
          .map((s) => s.toUpperCase())
          .filter((s) => /^[A-Z0-9.-]{1,10}$/.test(s))
      )
    );

    if (cleanSymbols.length === 0) {
      return NextResponse.json(
        {
          error: "INVALID_SYMBOL",
          message: "Please provide a valid stock symbol (e.g. { symbol: 'AAPL' }) or array of symbols.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updated = await Watchlist.findOneAndUpdate(
      { userId },
      {
        $addToSet: { symbols: { $each: cleanSymbols } },
        $set: { updatedAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      message: `Successfully updated watchlist with ${cleanSymbols.length} symbol(s).`,
      symbols: updated.symbols,
      updatedAt: updated.updatedAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update watchlist";
    return NextResponse.json(
      {
        error: "WATCHLIST_UPDATE_ERROR",
        message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlist
 * Removes a symbol from the authenticated user's watchlist.
 * Accepts symbol via query parameter: ?symbol=AAPL or request body { symbol: "AAPL" }
 * userId is obtained strictly from the Clerk server session, NEVER from the request body.
 */
export async function DELETE(request: NextRequest) {
  const { userId } = await getAuthUserId();

  if (!userId) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
        message: "You must be signed in to remove symbols from your watchlist.",
      },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    let symbol = searchParams.get("symbol");

    if (!symbol) {
      const body = await request.json().catch(() => ({}));
      if (typeof body.symbol === "string") {
        symbol = body.symbol;
      }
    }

    const cleanSymbol = symbol?.toUpperCase().trim();

    if (!cleanSymbol) {
      return NextResponse.json(
        {
          error: "MISSING_SYMBOL",
          message: "Please specify the symbol to delete (e.g. /api/watchlist?symbol=AAPL or { symbol: 'AAPL' }).",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updated = await Watchlist.findOneAndUpdate(
      { userId },
      {
        $pull: { symbols: cleanSymbol },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    return NextResponse.json({
      message: `Removed ${cleanSymbol} from your watchlist.`,
      symbols: updated?.symbols || [],
      updatedAt: updated?.updatedAt || new Date(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete symbol from watchlist";
    return NextResponse.json(
      {
        error: "WATCHLIST_DELETE_ERROR",
        message,
      },
      { status: 500 }
    );
  }
}
