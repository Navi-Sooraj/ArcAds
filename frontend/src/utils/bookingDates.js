import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from './dateConstants';

/** Local calendar date as YYYY-MM-DD for `<input type="date" min="…">`. 
 * Restricts to Day after Tomorrow (Current Date + 2 days).
 */
export function getTodayDateInputMin() {
  return dayjs().add(2, 'day').format('YYYY-MM-DD');
}

/** Minimum allowed end date: can be the same as start date. */
export function getEndDateMin(startDate) {
  const today = getTodayDateInputMin();
  const base = !startDate || startDate < today ? today : startDate;
  return dayjs(base).format('YYYY-MM-DD');
}

/** True if [startDate, endDate] overlaps any occupied range (inclusive YYYY-MM-DD). */
export function bookingRangeOverlapsOccupied(startDate, endDate, occupiedRanges) {
  if (!startDate || !endDate || !occupiedRanges?.length) return false;
  return occupiedRanges.some(
    (r) => r.startDate && r.endDate && startDate <= r.endDate && r.startDate <= endDate
  );
}

/** Map of YYYY-MM-DD -> status (pending, confirmed, etc.) */
export function datesSetFromOccupiedRanges(occupiedRanges) {
  const map = {};
  if (!occupiedRanges?.length) return map;
  for (const r of occupiedRanges) {
    const s = typeof r.startDate === 'string' ? r.startDate.slice(0, 10) : '';
    const e = typeof r.endDate === 'string' ? r.endDate.slice(0, 10) : '';
    if (!s || !e || s > e) continue;
    const status = r.status || 'confirmed';
    
    const d = new Date(`${s}T12:00:00`);
    const end = new Date(`${e}T12:00:00`);
    if (Number.isNaN(d.getTime()) || Number.isNaN(end.getTime())) continue;
    const cur = new Date(d);
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const dayStr = String(cur.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${dayStr}`;
      
      // If a day is both pending and confirmed (unlikely due to conflict checks),Confirmed wins.
      if (status === 'confirmed' || status === 'completed' || !map[key]) {
        map[key] = status;
      }
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

/**
 * Human-readable validation for booking range. Returns null if OK.
 * @param {{ startDate: string, endDate: string }[]} [occupiedRanges] from API
 */
/**
 * Human-readable validation for booking range. Returns null if OK.
 * @param {string} startDate
 * @param {string} endDate
 * @param {{ startDate: string, endDate: string }[]} [occupiedRanges] from API
 * @param {string} [availableFrom] space limit
 * @param {string} [availableTo] space limit
 */
export function validateBookingDateRange(startDate, endDate, occupiedRanges, availableFrom, availableTo) {
  const today = getTodayDateInputMin();
  if (!startDate) return 'Select a start date.';
  if (!endDate) return 'Select an end date.';
  if (startDate < today) return 'Start date must be at least Day after Tomorrow.';
  if (endDate < today) return 'End date must be at least Day after Tomorrow.';
  if (endDate < startDate) return 'End date must be on or after the start date.';
  
  if (availableFrom && startDate < availableFrom) {
    return `Space is not available before ${dayjs(availableFrom).format(DISPLAY_DATE_FORMAT)}.`;
  }
  if (availableTo && endDate > availableTo) {
    return `Space is not available after ${dayjs(availableTo).format(DISPLAY_DATE_FORMAT)}.`;
  }

  if (bookingRangeOverlapsOccupied(startDate, endDate, occupiedRanges)) {
    return 'Selected dates overlap an existing booking.';
  }
  return null;
}

export function bookingDatesAreValid(startDate, endDate, occupiedRanges) {
  return validateBookingDateRange(startDate, endDate, occupiedRanges) === null;
}
