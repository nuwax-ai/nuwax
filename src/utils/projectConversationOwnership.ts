/**
 * 项目会话归属过滤纯函数（2026-09-20，bug 2465）。
 *
 * 后端 `/api/user-project/conversations/{projectId}` 按「项目」维度回该项目下
 * **所有用户**的会话（回包行带 `userId` / `userName`），而侧栏三处消费方
 * （项目面板 / 历史会话页「项目」tab / 侧栏全局搜索）语义上都只要当前用户自己的。
 * 后端暂不支持 onlyMine 过滤，契约缺口期由前端按 userId 收敛。
 *
 * 本模块刻意不 import services（engineering-conventions §4 规则 5：工具层只能依赖
 * Types/Constants），当前用户 id 由调用方传入——见
 * `@/services/userProjectApp` 的 `apiUserProjectConversations`。
 */

/** 带归属人的最小行结构（ConversationInfo / UserProjectConversationInfo 均满足） */
interface ConversationRow {
  userId?: number | string | null;
}

/**
 * 只保留当前用户自己的会话。
 *
 * - `currentUserId` 取不到（未登录 / 本地用户信息缺失）时**原样返回**：防御式降级，
 *   避免因取不到 id 把整个列表清空；
 * - 行本身没有 `userId` 时不过滤也不误杀；
 * - 没有任何行被过滤掉时返回**原数组引用**，避免下游 effect 因引用变化反复触发。
 */
export function pickMineConversations<T extends ConversationRow>(
  conversations: T[],
  currentUserId?: number | string | null,
): T[] {
  if (
    currentUserId === undefined ||
    currentUserId === null ||
    currentUserId === ''
  ) {
    return conversations;
  }
  const mine = conversations.filter(
    (row) => row.userId != null && String(row.userId) === String(currentUserId),
  );
  return mine.length === conversations.length ? conversations : mine;
}
