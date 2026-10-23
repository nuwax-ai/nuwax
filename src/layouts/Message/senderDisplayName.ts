/**
 * 通知中心发送者取名（NW-094）：备注名优先，对齐 IM 会话列表/标题的取名规则。
 *
 * IM 通讯录接口（/api/instant-message/contacts）的 ContactItem.displayName 由
 * 服务端按「备注 > 昵称 > 账号名」算好——这里是唯一真源，前端不再拼一遍优先级
 * （规则漂移会造成同一用户在不同入口显示不同名字）。通知中心此前只回退
 * nickName || userName，用户改了备注后弹出的仍是 user 开头的账号名。
 *
 * 纯函数模块：不 import services/umi（vitest 不能引 umi 传递依赖），取数由
 * 调用方（layouts/Message）注入。
 */

/** IM 通讯录行的最小取名投影（真人 userId 与平台 userId 恒等） */
export interface ContactNameRow {
  userId?: number | string | null;
  displayName?: string | null;
}

export interface NotifySenderLike {
  userId?: number | string | null;
  userName?: string | null;
  nickName?: string | null;
}

/** 通讯录行 → userId → 备注优先显示名映射（空 displayName 跳过，保持 Map 稀疏） */
export function buildContactDisplayNameMap(
  rows: ContactNameRow[] | null | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows ?? []) {
    if (row?.userId === null || row?.userId === undefined) continue;
    const name = typeof row.displayName === 'string' ? row.displayName.trim() : '';
    if (name) map.set(String(row.userId), name);
  }
  return map;
}

/**
 * 通知中心发送者显示名：备注优先（通讯录 displayName）→ 昵称 → 账号名。
 * 通讯录取数失败/未加载（映射为空）时逐字回退旧行为，不产生额外提示。
 */
export function resolveNotifySenderName(
  sender: NotifySenderLike | null | undefined,
  contactNames: Map<string, string> | null | undefined,
): string {
  const remarkName =
    sender?.userId !== null && sender?.userId !== undefined
      ? contactNames?.get(String(sender.userId))
      : undefined;
  return remarkName || sender?.nickName || sender?.userName || '';
}
