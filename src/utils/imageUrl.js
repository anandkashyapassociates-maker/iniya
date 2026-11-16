/**
 * Helper to get the backend base origin URL (e.g. "https://backend.apptesting.fun").
 * Derived dynamically from VITE_API_BASE_URL.
 */
function getBackendOrigin() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  if (typeof apiBase === 'string' && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
    try {
      const url = new URL(apiBase);
      return url.origin; // e.g. "https://backend.apptesting.fun"
    } catch {
      return apiBase.replace(/\/api\/?$/, '');
    }
  }
  return '';
}

/**
 * Safely resolves an image path or URL to an absolute or web-accessible URL.
 * Handles:
 * 1. Data URLs & Blob URLs (previews)
 * 2. Absolute URLs with localhost / 127.0.0.1 (rewrites to backend origin)
 * 3. Insecure http:// URLs on https:// pages (upgrades to https://)
 * 4. Relative storage paths ("appointments/...", "/storage/appointments/...")
 * 5. Windows backslashes normalization
 */
export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;

  // Handle possible object wrappers
  if (typeof pathOrUrl === 'object') {
    pathOrUrl = pathOrUrl.url || pathOrUrl.path || pathOrUrl.image || pathOrUrl.src;
  }
  if (!pathOrUrl) return null;

  let str = String(pathOrUrl).trim();
  if (!str) return null;

  // 1. Data URLs and Blob URLs (local file picker previews)
  if (str.startsWith('blob:') || str.startsWith('data:')) {
    return str;
  }

  const backendOrigin = getBackendOrigin();

  // 2. Full HTTP/HTTPS URLs
  if (str.startsWith('http://') || str.startsWith('https://')) {
    // If backend returned http:// URL while current frontend page is https://, upgrade to https
    if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && str.startsWith('http://')) {
      str = str.replace(/^http:\/\//i, 'https://');
    }

    // If backend returned localhost / 127.0.0.1 (because backend APP_URL is unconfigured or default in Laravel .env)
    // and we have an online backendOrigin, rewrite it to the actual backend origin!
    if (backendOrigin && (str.includes('localhost') || str.includes('127.0.0.1'))) {
      try {
        const parsed = new URL(str);
        return `${backendOrigin}${parsed.pathname}${parsed.search}`;
      } catch {
        return str.replace(/^https?:\/\/[^\/]+/i, backendOrigin);
      }
    }

    return str;
  }

  // 3. Relative storage paths (e.g. "appointments/...", "/storage/appointments/...")
  // Normalize Windows backslashes to forward slashes
  str = str.replace(/\\/g, '/');
  let cleanPath = str.startsWith('/') ? str.slice(1) : str;
  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.slice('storage/'.length);
  }

  const storagePath = `/storage/${cleanPath}`;
  return backendOrigin ? `${backendOrigin}${storagePath}` : storagePath;
}

export default getImageUrl;
