/**
 * Safely resolves an image path or URL to an absolute or web-accessible URL.
 * Handles both full URLs (http://, https://, blob:, data:) and local storage paths.
 */
export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  const str = String(pathOrUrl).trim();
  if (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('blob:') ||
    str.startsWith('data:')
  ) {
    return str;
  }

  const cleanPath = str.startsWith('/') ? str.slice(1) : str;
  if (cleanPath.startsWith('storage/')) {
    return `/${cleanPath}`;
  }

  return `/storage/${cleanPath}`;
}

