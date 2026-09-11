/**
 * 会话标记（置顶/归档）本地覆盖：标记接口成功后的短窗口内以本地结果为准。
 *
 * 列表刷新是整体替换（setList(回包)），而标记接口与列表读接口存在读到滞后
 * （回包里刚归档的行 archived 仍为 false），会导致「归档后条目短暂复活回列表」。
 * 标记成功时记录覆盖，回包落地时重放覆盖；服务端追平或超出 TTL 后自动清除、
 * 回归服务端真相。
 */

export type ConversationFlagKind = 'pinned' | 'archived';

export interface ConversationFlagOverride {
  kind: ConversationFlagKind;
  enabled: boolean;
  /** 记录时间戳（ms），用于 TTL 判定 */
  at: number;
}

/** 覆盖存活窗口：窗口内本地写优先，过期回归服务端数据 */
export const CONVERSATION_FLAG_OVERRIDE_TTL_MS = 15_000;

const overrideKey = (kind: ConversationFlagKind, id: number | string) =>
  `${kind}:${Number(id)}`;

/** 标记接口成功后记录覆盖（同 id 同 kind 重复 toggle 覆盖旧值） */
export const recordConversationFlagOverride = (
  overrides: Map<string, ConversationFlagOverride>,
  id: number | string | null | undefined,
  kind: ConversationFlagKind,
  enabled: boolean,
  now = Date.now(),
): void => {
  if (id === null || id === undefined) return;
  overrides.set(overrideKey(kind, id), { kind, enabled, at: now });
};

interface FlagOverridableItem {
  id?: number | string | null;
  pinned?: boolean;
  archived?: boolean;
}

const FLAG_KINDS: ConversationFlagKind[] = ['pinned', 'archived'];

/**
 * 把活跃覆盖重放到列表回包上（原地清理过期/已追平的覆盖）。
 * 无任何变化时返回原数组引用，避免列表无谓重渲染。
 */
export const applyConversationFlagOverrides = <T extends FlagOverridableItem>(
  list: T[],
  overrides: Map<string, ConversationFlagOverride>,
  now = Date.now(),
): T[] => {
  if (overrides.size === 0) return list;

  let changed = false;
  const next = list.map((item) => {
    if (!item || item.id === null || item.id === undefined) return item;
    let patched: T | undefined;
    for (const kind of FLAG_KINDS) {
      const key = overrideKey(kind, item.id);
      const override = overrides.get(key);
      if (!override) continue;
      const expired = now - override.at > CONVERSATION_FLAG_OVERRIDE_TTL_MS;
      if (expired || item[kind] === override.enabled) {
        // 过期或服务端已追平：清除覆盖，回归服务端数据
        overrides.delete(key);
        continue;
      }
      changed = true;
      patched = { ...(patched ?? item), [kind]: override.enabled };
    }
    return patched ?? item;
  });
  return changed ? next : list;
};
