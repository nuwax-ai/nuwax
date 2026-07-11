import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

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

/**
 * 判断消息 id 是否为「乐观（未落库）」消息。
 *
 * 乐观消息由前端 uuidv4() 生成，id 为非空、非数字字面量的 string；后端落库消息
 * id 为 number（或被序列化成数字串，如 "123"）。故用 `Number.isNaN(Number(id))`
 * 排除数字串后端 id，避免它们被误判为乐观尾巴导致合并永不稳定。
 * 空字符串 id（开场白占位等）不算乐观消息。
 * 与代码库既定约定一致：chatUtils.ts、MessageQueue/queueStorage.ts 均用
 * `typeof id === 'string'` 判本地态。
 */
export const isOptimisticMessageId = (id: unknown): boolean =>
  typeof id === 'string' && id.trim() !== '' && Number.isNaN(Number(id));

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
        lastIncoming.status !== MessageStatusEnum.Loading;
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
  const lastIncoming = incoming[incoming.length - 1];
  if (
    lastIncoming &&
    lastIncoming.role === AssistantRoleEnum.ASSISTANT &&
    lastIncoming.status !== MessageStatusEnum.Loading
  ) {
    return incoming;
  }

  return [...incoming, ...tail];
}
