/**
 * Real-Time Multi-Currency FX Service
 * Handles international currency conversions, cached rates, and multi-currency equity calculations.
 */

export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyMeta> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  EUR: { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", locale: "en-CA" },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", locale: "en-NG" },
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "KSh", locale: "en-KE" },
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "R", locale: "en-ZA" },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  AED: { code: "AED", name: "UAE Dirham", symbol: "AED", locale: "ar-AE" },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF", locale: "de-CH" },
};

// Institutional FX Rates (base: USD)
export const FALLBACK_FX_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
  AUD: 1.51,
  NGN: 1580.0,
  KES: 130.5,
  ZAR: 18.2,
  SGD: 1.34,
  AED: 3.67,
  INR: 83.5,
  JPY: 154.0,
  CHF: 0.9,
};

let cachedRates = { ...FALLBACK_FX_RATES };
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Retrieves latest FX rates against USD
 */
export async function getFXRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedRates;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        cachedRates = { ...FALLBACK_FX_RATES, ...data.rates };
        lastFetchTime = now;
      }
    }
  } catch (err) {
    console.warn("FX API unreachable, using cached/fallback rates:", err);
  }

  return cachedRates;
}

/**
 * Converts an amount from one currency to another
 */
export function convertCurrencySync(
  amount: number,
  fromCurrency: string = "USD",
  toCurrency: string = "USD",
  rates: Record<string, number> = cachedRates
): { convertedAmount: number; exchangeRate: number } {
  const fromUpper = (fromCurrency || "USD").toUpperCase();
  const toUpper = (toCurrency || "USD").toUpperCase();

  if (fromUpper === toUpper) {
    return { convertedAmount: amount, exchangeRate: 1 };
  }

  const fromRate = rates[fromUpper] || FALLBACK_FX_RATES[fromUpper] || 1;
  const toRate = rates[toUpper] || FALLBACK_FX_RATES[toUpper] || 1;

  // Convert from origin to USD, then from USD to target
  const inUSD = amount / fromRate;
  const convertedAmount = inUSD * toRate;
  const exchangeRate = toRate / fromRate;

  return {
    convertedAmount: Number(convertedAmount.toFixed(2)),
    exchangeRate: Number(exchangeRate.toFixed(6)),
  };
}

/**
 * Normalizes any foreign currency amount directly to USD
 */
export function convertToUSDSync(
  amount: number,
  fromCurrency: string = "USD",
  rates: Record<string, number> = cachedRates
): number {
  const fromUpper = (fromCurrency || "USD").toUpperCase();
  if (fromUpper === "USD") return amount;
  const fromRate = rates[fromUpper] || FALLBACK_FX_RATES[fromUpper] || 1;
  return Number((amount / fromRate).toFixed(2));
}

/**
 * Formats a currency amount with the native symbol and locale separators
 */
export function formatMoney(
  amount: number,
  currencyCode: string = "USD"
): string {
  const code = (currencyCode || "USD").toUpperCase();
  const meta = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;

  try {
    return new Intl.NumberFormat(meta.locale || "en-US", {
      style: "currency",
      currency: meta.code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${meta.symbol}${Number(amount || 0).toLocaleString()}`;
  }
}
