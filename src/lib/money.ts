import i18n from '../i18n';

export function formatEuros(amountInCents: number, currency: string): string {
  const formatted = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
  return formatted.replace(/[\u00A0\u202F]/g, ' ');
}
