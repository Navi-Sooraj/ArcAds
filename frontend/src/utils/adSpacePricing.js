/** Digital screens and all other ad spaces use per-day pricing. */

/** 
 * DEPRECATED: Standardizing on per-day pricing for all vendor ad spaces.
 * Keeping function signature for compatibility but always returns false.
 */
export function isDigitalScreenPerSecond(space) {
  return false;
}

/** 
 * DEPRECATED: Standardizing on per-day pricing for all vendor ad spaces.
 * Keeping function signature for compatibility but always returns 0.
 */
export function digitalBookingTotalFromSeconds(space, totalSeconds) {
  return 0;
}

/** Booking date range → total amount (₹). Always use pricePerDay. */
export function bookingTotalForSpace(space, startDateStr, endDateStr) {
  if (!space || !startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const days = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  if (days <= 0) return 0;

  const dailyRate = Number(space.pricePerDay || 0);
  return days * dailyRate;
}

export function formatSpaceRateLabel(space) {
  if (!space) return '';
  const dailyRate = Number(space.pricePerDay || 0);
  return `₹${dailyRate.toLocaleString()} / day`;
}
