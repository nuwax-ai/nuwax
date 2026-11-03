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

/** 同时用于首屏分流脚本；保持函数自包含，便于构建时嵌入。 */
export function shouldKeepSpaceInviteOnWeb(
  pathname: string,
  search: string,
  origin: string,
): boolean {
  const isInvitePath = (path: string) =>
    /^\/invite\/space\/[^/]+\/?$/.test(path);
  if (isInvitePath(pathname)) return true;
  if (!/^\/(?:login|verify-code|set-password)\/?$/.test(pathname)) return false;
  const redirect = new URLSearchParams(search).get('redirect');
  if (!redirect) return false;
  try {
    const target = new URL(redirect, origin);
    return target.origin === origin && isInvitePath(target.pathname);
  } catch {
    return false;
  }
}
