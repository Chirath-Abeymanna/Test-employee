// Utility functions for timezone handling

/**
 * Formats a date/time to always show in Sri Lankan timezone (Asia/Colombo)
 * regardless of the user's local timezone
 */
export function formatSriLankaTime(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  };

  const finalOptions = { ...defaultOptions, ...options };

  return date.toLocaleTimeString("en-US", finalOptions);
}

/**
 * Formats a date to always show in Sri Lankan timezone
 */
export function formatSriLankaDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Colombo",
  };

  const finalOptions = { ...defaultOptions, ...options };

  return date.toLocaleDateString("en-US", finalOptions);
}

/**
 * Formats a date/time to show full date and time in Sri Lankan timezone
 */
export function formatSriLankaDateTime(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  };

  const finalOptions = { ...defaultOptions, ...options };

  return date.toLocaleString("en-US", finalOptions);
}

/**
 * Gets the current time in Sri Lankan timezone
 * This is for display purposes only
 */
export function getCurrentSriLankaTime(): Date {
  // Create a new date that represents "now" in Sri Lankan timezone
  const now = new Date();

  // Convert to Sri Lankan time for display
  const sriLankaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Colombo" })
  );

  return sriLankaTime;
}
