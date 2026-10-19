import { NextRequest, NextResponse } from "next/server";
import { getQuote, getBatchQuotes } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol");

  if (!rawSymbol || !rawSymbol.trim()) {
    return NextResponse.json(
      {
        error: "MISSING_SYMBOL",
        message: "Query parameter 'symbol' is required. Example: /api/quote?symbol=AAPL",
      },
      { status: 400 }
    );
  }

  const cleanSymbol = rawSymbol.trim().toUpperCase();

  // Handle batch quotes if comma separated
  if (cleanSymbol.includes(",")) {
    try {
      const symbolsList = cleanSymbol.split(",").map((s) => s.trim()).filter(Boolean);
      const quotes = await getBatchQuotes(symbolsList);
      return NextResponse.json(quotes, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to retrieve batch quotes";
      return NextResponse.json(
        {
          error: "BATCH_QUOTE_ERROR",
          message,
        },
        { status: 500 }
      );
    }
  }

  try {
    const quote = await getQuote(cleanSymbol);
    return NextResponse.json(quote, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : `Failed to retrieve quote for ${cleanSymbol}`;
    return NextResponse.json(
      {
        error: "QUOTE_FETCH_ERROR",
        message,
        symbol: cleanSymbol,
      },
      { status: 500 }
    );
  }
}
