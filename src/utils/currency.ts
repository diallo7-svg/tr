import { Currency } from "../types";

export const EXCHANGE_RATES: Record<Currency, number> = {
  EUR: 1,
  FCFA: 655.957,
  USD: 1.08,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: "€",
  FCFA: "FCFA",
  USD: "$",
};

export function convertFromEUR(amountInEUR: number, targetCurrency: Currency): number {
  return amountInEUR * EXCHANGE_RATES[targetCurrency];
}

export function convertToEUR(amountInTargetCurrency: number, sourceCurrency: Currency): number {
  return amountInTargetCurrency / EXCHANGE_RATES[sourceCurrency];
}

export function formatCurrency(
  amountInEUR: number,
  currency: Currency,
  compact: boolean = false
): string {
  const converted = convertFromEUR(amountInEUR, currency);

  if (compact && Math.abs(converted) >= 1000000) {
    const inMillions = converted / 1000000;
    return `${inMillions.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M ${CURRENCY_SYMBOLS[currency]}`;
  }

  if (compact && Math.abs(converted) >= 100000) {
    const inThousands = converted / 1000;
    return `${inThousands.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} k ${CURRENCY_SYMBOLS[currency]}`;
  }

  if (currency === "FCFA") {
    // FCFA doesn't use decimals
    return `${Math.round(converted).toLocaleString("fr-FR")} FCFA`;
  }

  if (currency === "USD") {
    return `$${converted.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: converted % 1 !== 0 ? 2 : 0,
    })}`;
  }

  // Default EUR
  return `${converted.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: converted % 1 !== 0 ? 2 : 0,
  })} €`;
}
