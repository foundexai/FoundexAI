import { NextResponse } from "next/server";
import { getFXRates, SUPPORTED_CURRENCIES, FALLBACK_FX_RATES } from "@/lib/currencyService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const base = (searchParams.get("base") || "USD").toUpperCase();

    const rates = await getFXRates();

    return NextResponse.json({
      success: true,
      base,
      rates,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in currency rates route:", error);
    return NextResponse.json({
      success: true,
      base: "USD",
      rates: FALLBACK_FX_RATES,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      isFallback: true,
    });
  }
}
