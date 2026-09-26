/** 共用 noVNC 客户端参数；业务 sourceUrl 只改变文档代理，不改变会话身份。 */
export function buildVncClientUrl({
  serviceUrl = '',
  sourceUrl,
  cId,
  readOnly = false,
}: {
  serviceUrl?: string;
  sourceUrl?: string;
  cId: string;
  readOnly?: boolean;
}): string {
  const base =
    sourceUrl ||
    `${serviceUrl.replace(/\/+$/, '')}/computer/desktop/${encodeURIComponent(
      cId,
    )}/vnc.html`;
  const [withoutHash, fragment] = base.split('#', 2);
  const queryIndex = withoutHash.indexOf('?');
  const pathname =
    queryIndex < 0 ? withoutHash : withoutHash.slice(0, queryIndex);
  const params = new URLSearchParams(
    queryIndex < 0 ? '' : withoutHash.slice(queryIndex + 1),
  );
  params.set('resize', 'scale');
  params.set('autoconnect', 'true');
  params.set('reconnect', 'true');
  params.set('reconnect_delay', '500');
  if (readOnly) params.set('view_only', 'true');
  return `${pathname}?${params.toString()}${fragment ? `#${fragment}` : ''}`;
}
