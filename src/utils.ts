type Milliseconds = string | number;

const millisecondsToNanoseconds = (milliseconds: Milliseconds): string => 
    (BigInt(milliseconds) * 1000000n).toString();


/**
 * Converts a millisecond timestamp string to nanosecond timestamp string
 * @param milliseconds Timestamp in milliseconds
 * @param defaultMilliseconds Value to return if milliseconds is undefined (defaults to empty string)
 * @returns Timestamp in nanoseconds as string, or defaultValue if input is undefined
 */
export function millisecondsToNanosecondsWithDefault(milliseconds: Milliseconds | undefined, defaultMilliseconds: Milliseconds | undefined= undefined): string | undefined {
  if (milliseconds) {
    return millisecondsToNanoseconds(milliseconds);
  }

  return defaultMilliseconds ? millisecondsToNanoseconds(defaultMilliseconds) : undefined;
}
