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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((parseIsoAsUtc(iso).getTime() - now.getTime()) / MS_PER_DAY));
}
