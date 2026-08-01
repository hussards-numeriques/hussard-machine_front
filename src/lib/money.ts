export function formatEuros(amountInCents: number, currency: string): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
  return formatted.replace(new RegExp(String.fromCharCode(0xa0), 'g'), ' ');
}
