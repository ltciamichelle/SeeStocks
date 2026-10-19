import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol");
  const rawRange = searchParams.get("range")?.trim().toUpperCase();

  if (!rawSymbol || !rawSymbol.trim()) {
    return NextResponse.json(
      {
        error: "MISSING_SYMBOL",
        message: "Query parameter 'symbol' is required. Example: /api/history?symbol=AAPL&range=1M",
      },
      { status: 400 }
    );
  }

  const cleanSymbol = rawSymbol.trim().toUpperCase();
  const range: "1W" | "1M" | "1Y" =
    rawRange === "1W" || rawRange === "1Y" ? rawRange : "1M";

  try {
    const history = await getHistory(cleanSymbol, range);
    return NextResponse.json(history, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : `Failed to retrieve history for ${cleanSymbol}`;
    return NextResponse.json(
      {
        error: "HISTORY_FETCH_ERROR",
        message,
        symbol: cleanSymbol,
      },
      { status: 500 }
    );
  }
}
