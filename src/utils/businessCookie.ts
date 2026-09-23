/** Send the browser's ticket only to the configured business API origin. */
export function businessCredentials(url: string): RequestCredentials {
  try {
    const base = window.location.origin;
    const business = new URL(process.env.BASE_URL || base, base);
    const target = new URL(url, base);
    return target.origin === business.origin ? 'include' : 'omit';
  } catch {
    return 'omit';
  }
}
