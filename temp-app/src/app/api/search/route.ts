import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q");

    if (!rawQuery || !rawQuery.trim()) {
      return NextResponse.json(
        {
          error: "MISSING_QUERY",
          message: "Query parameter 'q' is required. Example: /api/search?q=AAPL",
        },
        { status: 400 }
      );
    }

    const data = await searchSymbols(rawQuery.trim());
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to search symbols";
    return NextResponse.json(
      {
        error: "SEARCH_FAILED",
        message,
      },
      { status: 500 }
    );
  }
}
