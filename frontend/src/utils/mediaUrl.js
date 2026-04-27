/**
 * Turn API-stored paths (e.g. /uploads/bookings/...) into a URL the browser can load.
 */
export function resolveUploadUrl(path) {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|blob:|data:)/i.test(trimmed)) return trimmed;

  const apiBase = import.meta.env.VITE_API_URL || '';

  if (typeof window !== 'undefined') {
    if (!apiBase || apiBase.startsWith('/')) {
      return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }
    if (apiBase.startsWith('http')) {
      try {
        const u = new URL(apiBase);
        return `${u.origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
      } catch {
        /* fall through */
      }
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * Detect if a URL string points to a video asset.
 */
export const checkIfVideo = (url) => {
  if (!url) return false;
  const s = String(url);
  // Matches typical video extensions anywhere in the path, or explicitly mentions video/blob
  return s.match(/\.(mp4|webm|ogg|mov)/i) || s.toLowerCase().includes('video') || s.startsWith('blob:');
};
