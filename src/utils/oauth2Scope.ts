/**
 * 项目 OAuth2 scope 的集合运算。
 * 后端约定：空数组 = 回落平台默认（profile），因此比较与展示前统一归一化。
 */

export const DEFAULT_OAUTH2_SCOPE = 'profile';

/** 空值 / 空数组 → [profile]；去重保序 */
export function normalizeScopes(scopes?: string[] | null): string[] {
  const list = scopes?.length ? scopes : [DEFAULT_OAUTH2_SCOPE];
  return Array.from(new Set(list));
}

/** 两组 scope 是否不同（忽略顺序与重复） */
export function scopesChanged(
  before?: string[] | null,
  after?: string[] | null,
): boolean {
  const a = new Set(normalizeScopes(before));
  const b = normalizeScopes(after);
  return a.size !== b.length || b.some((scope) => !a.has(scope));
}

/** 从 before 到 after 的新增与移除 */
export function diffScopes(
  before?: string[] | null,
  after?: string[] | null,
): { added: string[]; removed: string[] } {
  const a = normalizeScopes(before);
  const b = normalizeScopes(after);
  return {
    added: b.filter((scope) => !a.includes(scope)),
    removed: a.filter((scope) => !b.includes(scope)),
  };
}

/** 设置页勾选初值：审核中展示待审目标，否则展示生效值 */
export function draftScopesOf(setting?: {
  scopes?: string[] | null;
  pendingScopes?: string[] | null;
  scopeApplyStatus?: string | null;
}): string[] {
  return normalizeScopes(
    setting?.scopeApplyStatus === 'Pending'
      ? setting.pendingScopes
      : setting?.scopes,
  );
}
