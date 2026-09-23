import { hasHostBridge, isDesktopHost, native } from './index';

// Dynamic tool/file links may also point at user-built apps or API resources on
// the same origin. Only known first-party UI routes may inherit the host session.
// Keep this subset in sync with the corresponding routes in src/routes/index.ts.
const KNOWN_BUSINESS_ROUTES = [
  /^\/home\/chat\/[^/]+\/[^/]+\/?$/,
  /^\/agent\/[^/]+\/?$/,
  /^\/space\/[^/]+\/(?:agent|workflow|app-dev|app-dev-design|app-project-detail|third-app-detail|normal-project-detail)\/[^/]+\/?$/,
  /^\/space\/[^/]+\/app-pro\/[^/]+\/[^/]+\/?$/,
  /^\/space\/[^/]+\/plugin\/[^/]+(?:\/cloud-tool)?\/?$/,
  /^\/space\/[^/]+\/(?:apply\/|published\/)?skill-details\/[^/]+\/?$/,
  /^\/(?:space|square)\/publish\/(?:plugin|workflow|skill)\/[^/]+\/?$/,
];

function currentOriginTarget(url: string): URL | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const target = new URL(url, window.location.href);
    if (
      (target.protocol === 'http:' || target.protocol === 'https:') &&
      !target.username &&
      !target.password &&
      target.origin === window.location.origin
    ) {
      return target;
    }
  } catch {
    // Invalid input remains on the ordinary isolated window opening path.
  }
  return undefined;
}

function knownBusinessTarget(url: string): URL | undefined {
  const target = currentOriginTarget(url);
  return target &&
    KNOWN_BUSINESS_ROUTES.some((route) => route.test(target.pathname))
    ? target
    : undefined;
}

/** Safe to intercept a dynamic URL or anchor in the commercial desktop host. */
export function canOpenKnownBusinessRouteInHost(url: string): boolean {
  if (!isDesktopHost() || !hasHostBridge()) return false;
  return !!knownBusinessTarget(url);
}

/**
 * Open a known business route in a new window. The commercial host needs an
 * absolute URL here: its relative-path bridge contract may navigate the main
 * webview instead of creating a window. browserUrl preserves a caller's
 * existing web fallback when its configured BASE_URL differs from the guest.
 */
export async function openBusinessRouteWindow(
  url: string,
  browserUrl = url,
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isDesktopHost() && hasHostBridge()) {
    const target = knownBusinessTarget(url);
    if (target) {
      const result = await native.openWindow(target.href);
      if (result.success) return;
    }
  }
  window.open(browserUrl, '_blank', 'noopener,noreferrer');
}

/** Dynamic links use the bridge only when their destination is a known UI page. */
export async function openKnownBusinessRouteWindow(url: string): Promise<void> {
  if (canOpenKnownBusinessRouteInHost(url)) {
    await openBusinessRouteWindow(url);
    return;
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
