export function formatShortDate(iso: string): string {
  const hasTimezone = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso);
  const date = new Date(hasTimezone ? iso : `${iso}Z`);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}
