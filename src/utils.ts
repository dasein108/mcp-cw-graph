import { DateTime } from 'luxon';

type Milliseconds = string | number;

const millisecondsToNanoseconds = (milliseconds: Milliseconds): string =>
  (BigInt(milliseconds) * 1000000n).toString();

/**
 * Converts a millisecond timestamp string to nanosecond timestamp string
 * @param milliseconds Timestamp in milliseconds
 * @param defaultMilliseconds Value to return if milliseconds is undefined (defaults to empty string)
 * @returns Timestamp in nanoseconds as string, or defaultValue if input is undefined
 */
export function millisecondsToNanosecondsWithDefault(
  milliseconds: Milliseconds | undefined,
  defaultMilliseconds: Milliseconds | undefined = undefined
): string | undefined {
  if (milliseconds) {
    return millisecondsToNanoseconds(milliseconds);
  }

  return defaultMilliseconds ? millisecondsToNanoseconds(defaultMilliseconds) : undefined;
}
export function nanosToISOString(nanos: string | undefined): string | undefined {
  if (!nanos) return undefined;
  try {
    // Convert string nanoseconds to milliseconds (as number)
    const ms = Number(BigInt(nanos) / 1000000n);
    return DateTime.fromMillis(ms, { zone: 'utc' }).toISO() || undefined;
  } catch {
    return undefined;
  }
}

export function parseToNanos(datetimeStr: string): string {
  // Parse with Luxon, default to UTC if no zone
  let dt = DateTime.fromISO(datetimeStr, { setZone: true });
  if (!dt.isValid) throw new Error(`Invalid datetime: ${datetimeStr}`);
  // If no timezone info, treat as UTC
  if (!dt.zoneName || dt.zoneName === 'local') {
    dt = dt.toUTC();
  }
  return (dt.toMillis() * 1_000_000).toString();
}
