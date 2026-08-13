function parseIsoAsUtc(iso: string): Date {
  const hasTimezone = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasTimezone ? iso : `${iso}Z`);
}

export function formatShortDate(iso: string): string {
  return parseIsoAsUtc(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  });
}

export function formatLongDate(iso: string): string {
  return parseIsoAsUtc(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
