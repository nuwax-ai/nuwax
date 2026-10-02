/** 主页新建全栈应用后，这一次进入先不打 readiness */
const storageKey = (appId: number, conversationId: number): string =>
  `nuwax:appDevPro:skipReadiness:${appId}:${conversationId}`;

/** 本次文档里已经消费过的标记。刷新会清空模块，刷新仍会先打 readiness */
const consumedScopes = new Set<string>();

const canUseSessionStorage = (): boolean =>
  typeof sessionStorage !== 'undefined';

/**
 * 这份文档第一次加载时的路径。
 * 主页刷新后再跳进开发页，导航类型仍是 reload，不能拿它判断这次进入。
 */
const loadedPathname =
  typeof window !== 'undefined' ? window.location.pathname : '';

/**
 * 当前文档是不是刷新进来的。
 * 只说明浏览器怎么打开的这一页，不区分后来的站内跳转。
 */
export const isDocumentReload = (): boolean => {
  if (typeof performance === 'undefined') {
    return false;
  }
  const entry = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  return entry?.type === 'reload';
};

/**
 * 当前地址就是被刷新打开的那一页时，才忽略创建标记并先打 readiness。
 * 主页刷新后创建再跳转，路径已经变了，仍按新建处理。
 */
export const isCurrentDocumentReload = (): boolean => {
  if (!isDocumentReload() || typeof window === 'undefined') {
    return false;
  }
  return window.location.pathname === loadedPathname;
};

/**
 * 主页创建全栈应用并跳转前写入。只写这一次，进页后会读掉。
 *
 * @param appId 新建应用 ID
 * @param conversationId 新建会话 ID
 */
export const markAppDevProSkipReadiness = (
  appId: number,
  conversationId: number,
): void => {
  if (!appId || !conversationId || !canUseSessionStorage()) {
    return;
  }
  try {
    sessionStorage.setItem(storageKey(appId, conversationId), '1');
  } catch {
    // 隐私模式写不进去时，进页会走 readiness，和刷新一致
  }
};

/**
 * 读到创建标记后立刻删掉，避免刷新时提示词还在又被当成新建。
 *
 * @param appId 当前应用 ID
 * @param conversationId 当前会话 ID
 * @returns 这一次进入是否跳过 readiness
 */
export const consumeAppDevProSkipReadiness = (
  appId: number,
  conversationId: number,
): boolean => {
  if (!appId || !conversationId) {
    return false;
  }
  const key = storageKey(appId, conversationId);
  if (consumedScopes.has(key)) {
    return true;
  }
  if (!canUseSessionStorage()) {
    return false;
  }
  try {
    const hit = sessionStorage.getItem(key) === '1';
    if (hit) {
      sessionStorage.removeItem(key);
      consumedScopes.add(key);
    }
    return hit;
  } catch {
    return false;
  }
};

/**
 * 真正离开页面后再忘掉这次跳过。
 * 开发环境会先卸载再立刻挂上，调用方应延后判断，避免把同一次进入清掉。
 *
 * @param appId 要忘掉的应用 ID
 * @param conversationId 要忘掉的会话 ID
 */
export const releaseAppDevProSkipReadiness = (
  appId: number,
  conversationId: number,
): void => {
  if (!appId || !conversationId) {
    return;
  }
  consumedScopes.delete(storageKey(appId, conversationId));
  if (!canUseSessionStorage()) {
    return;
  }
  try {
    sessionStorage.removeItem(storageKey(appId, conversationId));
  } catch {
    // 清不掉时，下一次进入最多多跳过一次 readiness
  }
};

/**
 * 离开页面，或应用 / 会话切换时清掉，避免带到下一次进入。
 *
 * @param appId 要清掉的应用 ID
 * @param conversationId 要清掉的会话 ID
 */
export const clearAppDevProSkipReadiness = (
  appId: number,
  conversationId: number,
): void => {
  if (!appId || !conversationId || !canUseSessionStorage()) {
    return;
  }
  try {
    sessionStorage.removeItem(storageKey(appId, conversationId));
  } catch {
    // 清不掉时，下一次进入最多多跳过一次 readiness
  }
};
