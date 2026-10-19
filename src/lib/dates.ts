const SOUTH_AFRICA_TIME_ZONE = 'Africa/Johannesburg';

export function formatSouthAfricanDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Cannot format an invalid date.');
  }

  return new Intl.DateTimeFormat('en-ZA', {
    ...options,
    timeZone: SOUTH_AFRICA_TIME_ZONE,
  }).format(date);
}

export function southAfricanDateKey(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SOUTH_AFRICA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  const year = part('year');
  const month = part('month');
  const day = part('day');
  if (!year || !month || !day) {
    throw new Error('Unable to determine the current South African date.');
  }
  return `${year}-${month}-${day}`;
}
