import type { CurrencyCode, PriceQuote } from '../types/competitor';

const CURRENCY_SYMBOLS: Readonly<Record<CurrencyCode, string>> = {
  USD: 'US$',
  CNY: '¥',
};

export function formatPrice(quote: PriceQuote): string {
  const symbol = CURRENCY_SYMBOLS[quote.currency];
  const amount = quote.amount.toLocaleString('zh-CN', {
    minimumFractionDigits: quote.amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${amount}`;
}

export function formatIsoDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (match === null) {
    return iso;
  }
  const [, year, month, day] = match;
  if (year === undefined || month === undefined || day === undefined) {
    return iso;
  }
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

export function formatScore(score: number): string {
  if (!Number.isFinite(score)) {
    return '—';
  }
  return score.toFixed(score % 1 === 0 ? 0 : 1);
}

export function formatWeight(grams: number): string {
  return `${grams} g`;
}
