import type { SpaceInviteStatus } from '@/types/interfaces/spaceInvite';

export function getSpaceInviteQrPath(inviteUrl: string): string {
  const bytes = new TextEncoder().encode(inviteUrl);
  const base64 = btoa(
    Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''),
  );
  return `/api/qr/${encodeURIComponent(base64)}`;
}

export function getSpaceInviteStatus(invite: {
  status: SpaceInviteStatus;
  expire: string | null;
}): SpaceInviteStatus {
  if (
    invite.status === 'Active' &&
    invite.expire &&
    Date.parse(invite.expire) <= Date.now()
  ) {
    return 'Expired';
  }
  return invite.status;
}

/** 同时用于首屏分流脚本；保持函数自包含，手机浏览器使用 M 站登录。 */
export function getSpaceInviteEntryRedirect(
  href: string,
  mobile: boolean,
): string | null {
  try {
    const current = new URL(href);
    const mobileInvite = '/subpackages/pages/space-invite/space-invite';
    const mobileLogin = '/subpackages/pages/login/login';
    const toMobile = (url: URL): string | null => {
      if (url.origin !== current.origin) return null;
      const match = url.pathname.match(/^\/invite\/space\/([^/]+)\/?$/);
      if (match) {
        const query = new URLSearchParams(url.search);
        query.set('code', decodeURIComponent(match[1]));
        return mobileInvite + '?' + query.toString();
      }
      if (
        url.pathname === '/m/' &&
        url.hash.startsWith('#' + mobileInvite + '?')
      )
        return url.hash.substring(1);
      return null;
    };
    if (mobile) {
      const invite = toMobile(current);
      if (invite && current.pathname !== '/m/')
        return current.origin + '/m/#' + invite;
      if (/^\/(?:login|verify-code|set-password)\/?$/.test(current.pathname)) {
        const redirect = current.searchParams.get('redirect');
        const target = redirect
          ? toMobile(new URL(redirect, current.origin))
          : null;
        if (target) {
          const query = new URLSearchParams(current.search);
          query.set('redirect', target);
          return current.origin + '/m/#' + mobileLogin + '?' + query.toString();
        }
      }
    } else if (
      current.pathname === '/m/' &&
      current.hash.startsWith('#' + mobileInvite + '?')
    ) {
      const query = new URLSearchParams(
        current.hash.substring(current.hash.indexOf('?') + 1),
      );
      const code = query.get('code');
      if (code) {
        query.delete('code');
        return (
          current.origin +
          '/invite/space/' +
          encodeURIComponent(code) +
          (query.size ? '?' + query.toString() : '')
        );
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function openSpaceInviteConversation(spaceId: number | string): void {
  window.location.replace(
    `/instant-message?spaceId=${encodeURIComponent(String(spaceId))}`,
  );
}
