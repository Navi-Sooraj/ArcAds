/**
 * Client-side payment field validation for checkout forms.
 */

export const EXPIRY_MONTHS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
];

/** Month options for the selected year (past months hidden when year is the current year). */
export function getExpiryMonthsForYear(yearValue) {
  const y = parseInt(String(yearValue ?? '').trim(), 10);
  if (!Number.isFinite(y)) return EXPIRY_MONTHS;
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  if (y > cy) return EXPIRY_MONTHS;
  if (y < cy) return EXPIRY_MONTHS;
  return EXPIRY_MONTHS.filter((m) => parseInt(m, 10) >= cm);
}

export function validateCardNumber(v) {
  const digits = String(v).replace(/\s/g, '');
  if (digits.length === 0) return 'Card number is required';
  if (!/^\d{12}$/.test(digits)) return 'Card number must be exactly 12 digits';
  return null;
}

/** 
 * Restricts to digits only, max 12, and inserts spaces every 4 digits.
 * Returns { raw: '123456781234', formatted: '1234 5678 1234' }
 */
export function formatCardNumber(v) {
  const digits = String(v).replace(/\D/g, '').slice(0, 12);
  const formatted = digits.match(/.{1,4}/g)?.join(' ') || '';
  return { raw: digits, formatted };
}

export function validateExpiry(month, year) {
  const monthStr = month == null ? '' : String(month).trim();
  const yearStr = year == null ? '' : String(year).trim();

  if (!monthStr && !yearStr) return 'Expiry month and year are required';
  if (!monthStr) return 'Expiry month is required';
  if (!yearStr) return 'Expiry year is required';

  const m = parseInt(monthStr, 10);
  const y = parseInt(yearStr, 10);

  if (!Number.isFinite(m) || m < 1 || m > 12) {
    return 'Select a valid expiry month (01–12)';
  }
  if (!Number.isFinite(y)) return 'Select a valid expiry year';

  const fullYear = y < 100 ? 2000 + y : y;
  if (fullYear < 2000 || fullYear > 2100) return 'Expiry year is not valid';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (fullYear < currentYear) return 'This card has expired';
  if (fullYear === currentYear && m < currentMonth) return 'This card has expired';

  return null;
}

export function validateCvv(v) {
  if (!/^\d{3,4}$/.test(String(v).trim())) return 'CVV must be 3 or 4 digits';
  return null;
}

export function validateCardHolderName(v) {
  if (String(v).trim().length < 2) return 'Card holder name required (min 2 characters)';
  return null;
}

export function validateUpiId(v) {
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  if (!String(v).trim()) return 'UPI ID is required';
  if (!upiRegex.test(String(v).trim())) return 'Invalid UPI ID format (e.g. name@upi)';
  return null;
}
