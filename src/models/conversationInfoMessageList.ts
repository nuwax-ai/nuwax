import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { isEqual } from 'lodash';

export function appendOutgoingConversationMessages(
  messageList: MessageInfo[] | undefined,
  chatMessage: MessageInfo,
  currentMessage: MessageInfo,
): MessageInfo[] {
  const completeMessageList =
    messageList?.map((item: MessageInfo) => {
      if (item.status === MessageStatusEnum.Incomplete) {
        return {
          ...item,
          status: MessageStatusEnum.Complete,
        };
      }
      return item;
    }) || [];

  return [...completeMessageList, chatMessage, currentMessage];
}

const isFrontendUuidMessageId = (id: unknown): boolean =>
  typeof id === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );

/**
 * 判断消息 id 是否为「乐观（未落库）」消息。
 *
 * 前端乐观消息由 uuidv4() 生成。agent-dev 预览调试链路里，后端落库 id
 * 可能是 32 位 hex 字符串；这类 id 必须视为 persisted，不能当成本地尾巴迁移。
 */
export const isOptimisticMessageId = isFrontendUuidMessageId;

const isIncompleteStatus = (status: unknown): boolean =>
  status === MessageStatusEnum.Loading ||
  status === MessageStatusEnum.Incomplete;

const hasStableMessageId = (id: unknown): boolean =>
  id !== null && id !== undefined && String(id).trim() !== '';

const sameStableId = (left: unknown, right: unknown): boolean =>
  hasStableMessageId(left) &&
  hasStableMessageId(right) &&
  String(left) === String(right);

const completeAssistantPlaceholder = (message: MessageInfo): MessageInfo => {
  if (isIncompleteStatus(message.status)) {
    return {
      ...message,
      status: MessageStatusEnum.Complete,
    };
  }
  return message;
};

const isSameMessageSnapshot = (
  left: MessageInfo | undefined,
  right: MessageInfo | undefined,
): boolean => {
  if (!left || !right) {
    return false;
  }
  return (
    String(left.id ?? '') === String(right.id ?? '') &&
    left.role === right.role &&
    (left.text || '') === (right.text || '') &&
    (left.think || '') === (right.think || '') &&
    left.status === right.status
  );
};

export function areMessageListsEquivalent(
  left: MessageInfo[] | undefined | null,
  right: MessageInfo[] | undefined | null,
): boolean {
  const leftList = left || [];
  const rightList = right || [];
  if (leftList.length !== rightList.length) {
    return false;
  }
  return leftList.every((item, index) =>
    isSameMessageSnapshot(item, rightList[index]),
  );
}

export function needsTerminalHistoryReload(
  current: MessageInfo[] | undefined | null,
  incoming: MessageInfo[] | undefined | null,
): boolean {
  const currentList = current || [];
  const incomingList = incoming || [];
  if (!incomingList.length) {
    return false;
  }
  if (!currentList.length) {
    return true;
  }
  if (areMessageListsEquivalent(currentList, incomingList)) {
    return false;
  }

  const currentIds = new Set(
    currentList
      .filter((m) => hasStableMessageId(m.id))
      .map((m) => String(m.id)),
  );
  const hasMissingPersistedMessage = incomingList.some(
    (m) => hasStableMessageId(m.id) && !currentIds.has(String(m.id)),
  );
  if (hasMissingPersistedMessage) {
    return true;
  }

  const currentLast = currentList[currentList.length - 1];
  const incomingLast = incomingList[incomingList.length - 1];
  return !isSameMessageSnapshot(currentLast, incomingLast);
}

/**
 * reload / 切会话覆盖 messageList 时，保留本地末尾尚未落库的乐观消息
 * （user 消息 + assistant Loading 占位），避免 sub 续会话 / devConversationId
 * 轮询切会话触发的 reload 把刚发送的消息整体冲掉（用户消息丢失）。
 *
 * 去重（避免重复/错序）：
 * - 尾巴里的 user 文本全部已在 incoming（后端落库了这轮 user）：
 *   - 若 incoming 末条已是落库 assistant（非 Loading）→ 整轮（user+assistant）
 *     都已落库，丢弃整段尾巴；
 *   - 否则 assistant 仍在途（流式中）→ 丢弃 userOpt，但**保留 assistant 占位**，
 *     它是 SSE 流式分片回填的目标（按 uuid 定位），丢了会导致后续 chunk 无法拼接。
 * - user 尚未落库 → 保留整段尾巴。
 *
 * 前提：本函数假设「reload/切会话」即续同一调试会话（dev 页面 devConversationId
 * 不会切到无关会话）；故乐观尾巴随会话迁移是预期行为。
 *
 * @param prev 本地当前 messageList（可能含末尾乐观消息）
 * @param incoming 后端返回的 messageList（落库消息，id 为 number）
 */
export function preserveOptimisticMessageTail(
  prev: MessageInfo[] | undefined,
  incoming: MessageInfo[],
): MessageInfo[] {
  if (!prev?.length) {
    return incoming;
  }

  // 从末尾向前收集「连续」的乐观消息作为尾巴（通常是 [userOpt, asstOpt] 或仅 [asstOpt]）
  const tail: MessageInfo[] = [];
  for (let i = prev.length - 1; i >= 0; i -= 1) {
    if (isOptimisticMessageId(prev[i].id)) {
      tail.unshift(prev[i]);
    } else {
      break;
    }
  }

  if (!tail.length) {
    return incoming;
  }

  // 尾巴含 user 消息
  const tailUserTexts = tail
    .filter((m) => m.role === AssistantRoleEnum.USER)
    .map((m) => (m.text || '').trim())
    .filter(Boolean);

  if (tailUserTexts.length) {
    const allUserPersisted = tailUserTexts.every((text) =>
      incoming.some(
        (m) =>
          m.role === AssistantRoleEnum.USER && (m.text || '').trim() === text,
      ),
    );
    if (allUserPersisted) {
      // user 已落库：判断本轮 assistant 是否也落库（incoming 末条为落库 assistant）
      const lastIncoming = incoming[incoming.length - 1];
      const assistantPersisted =
        !!lastIncoming &&
        lastIncoming.role === AssistantRoleEnum.ASSISTANT &&
        !isOptimisticMessageId(lastIncoming.id) &&
        !isIncompleteStatus(lastIncoming.status);
      if (assistantPersisted) {
        // 整轮（user+assistant）都已落库 → 丢弃整段尾巴
        return incoming;
      }
      // user 已落库但 assistant 仍在途 → 丢弃 userOpt，保留 assistant 占位（SSE 流式目标）
      const assistantTail = tail.filter(
        (m) => m.role === AssistantRoleEnum.ASSISTANT,
      );
      return assistantTail.length ? [...incoming, ...assistantTail] : incoming;
    }
    // user 尚未落库 → 保留整段尾巴
    return [...incoming, ...tail];
  }

  // 尾巴仅 assistant 占位：incoming 末条已是落库 assistant（非 Loading）→ 丢弃占位避免重复
  const assistantTail = tail.filter(
    (m) => m.role === AssistantRoleEnum.ASSISTANT,
  );
  if (assistantTail.length === tail.length && assistantTail.length === 1) {
    const tailStartIndex = prev.length - tail.length;
    const anchorUser = [...prev]
      .slice(0, tailStartIndex)
      .reverse()
      .find(
        (m) =>
          m.role === AssistantRoleEnum.USER && !isOptimisticMessageId(m.id),
      );
    const anchorIndex = incoming.findIndex((m) =>
      sameStableId(m.id, anchorUser?.id),
    );

    if (anchorIndex >= 0) {
      const suffix = incoming.slice(anchorIndex + 1);
      const firstNextUserIndex = suffix.findIndex(
        (m) => m.role === AssistantRoleEnum.USER,
      );
      const persistedAssistantBeforeNextUser = suffix
        .slice(0, firstNextUserIndex >= 0 ? firstNextUserIndex : suffix.length)
        .some(
          (m) =>
            m.role === AssistantRoleEnum.ASSISTANT &&
            !isOptimisticMessageId(m.id) &&
            !isIncompleteStatus(m.status),
        );

      if (persistedAssistantBeforeNextUser) {
        return incoming;
      }

      if (firstNextUserIndex >= 0) {
        return [
          ...incoming.slice(0, anchorIndex + 1),
          completeAssistantPlaceholder(assistantTail[0]),
          ...suffix,
        ];
      }
    }
  }

  const lastIncoming = incoming[incoming.length - 1];
  if (
    lastIncoming &&
    lastIncoming.role === AssistantRoleEnum.ASSISTANT &&
    !isIncompleteStatus(lastIncoming.status)
  ) {
    return incoming;
  }

  return [...incoming, ...tail];
}

/**
 * 将轮询得到的服务端消息快照合并到本地，同时保留尚未落库的乐观消息。
 * 没有可见变化时返回原数组引用，避免每次轮询都触发消息区重渲染。
 */
export function reconcileConversationSnapshotMessages(
  current: MessageInfo[] | undefined | null,
  incoming: MessageInfo[] | undefined | null,
): MessageInfo[] {
  const currentList = current || [];
  const incomingList = incoming || [];
  if (!incomingList.length) {
    return currentList;
  }

  // 会话详情接口可能只返回最近一段消息，不能整体替换，否则用户上滑加载出的
  // 更早历史会被下一次轮询删除。以稳定消息 id 更新已有项，并把缺失项追加到尾部。
  const persisted = currentList.filter(
    (message) => !isOptimisticMessageId(message.id),
  );
  const indexById = new Map<string, number>(
    persisted
      .filter((message) => hasStableMessageId(message.id))
      .map((message, index) => [String(message.id), index]),
  );
  const serverMerged = [...persisted];
  incomingList.forEach((message) => {
    const id = hasStableMessageId(message.id) ? String(message.id) : '';
    const existingIndex = id ? indexById.get(id) : undefined;
    if (existingIndex !== undefined) {
      serverMerged[existingIndex] = message;
      return;
    }
    if (id) {
      indexById.set(id, serverMerged.length);
    }
    serverMerged.push(message);
  });

  const merged = preserveOptimisticMessageTail(currentList, serverMerged);
  return isEqual(currentList, merged) ? currentList : merged;
}
