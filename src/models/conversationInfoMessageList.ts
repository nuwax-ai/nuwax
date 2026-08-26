import { AssistantRoleEnum, MessageTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { conversationErrorTerminalLogger } from '@/utils/logger';
import { isEqual } from 'lodash';

/**
 * 终态守卫：本轮终态已处理（FINAL_RESULT 分支会重置 messageIdRef 为空）且消息已收敛
 * 为终态时，迟到的 MESSAGE 分片整条丢弃——投递链存在乱序/缓冲异常（实测整轮首分片
 * 迟至终态之后、连接关闭时刻才送达，会话 1678724）。若继续处理会把已定稿消息拉回
 * Incomplete（isSessionStreamBusy 复活、活跃态被重算顶回 true），会话框卡「会话中」
 * 且再无终态事件可纠正；内容拼接也会把迟到分片错位追加到已定稿文本尾部。
 *
 * messageIdRefCurrent 非空 = 多步输出的中间步边界（本步 finished 已置 Complete、
 * 下一步分片需继续走工作流插新消息逻辑），必须放行。
 *
 * 命中时打 always-on warn（生产取证标记）。调用方位于 setMessageList updater 内，
 * 命中后须 `return list` 返回未变更列表（绝不能裸 return）。
 */
/**
 * 找到当前轮次的起始索引：最后一条 USER 消息的**下一条**。
 * 当前轮 = 最后一条 user 之后的所有 assistant 消息（多步输出可产生多条）。
 * 没找到 USER（异常情况）时返回 0（全列表视为当前轮）。
 *
 * 用途：isSessionStreamBusy 的检查范围与 sweep 的清理范围共用此边界，
 * 替代此前的固定窗口（PROCESSING_RECENT_WINDOW=5），精确覆盖任意深度的多步轮次。
 */
export function findCurrentRoundStart(
  messageList: MessageInfo[] | undefined | null,
): number {
  if (!messageList?.length) {
    return 0;
  }
  for (let i = messageList.length - 1; i >= 0; i -= 1) {
    if (messageList[i].role === AssistantRoleEnum.USER) {
      return i + 1;
    }
  }
  return 0;
}

export function shouldDropLateMessageChunk(
  currentMessage: MessageInfo | undefined,
  currentMessageId: string,
  messageIdRefCurrent: string,
  chunk: { type?: string; text?: string },
): boolean {
  if (messageIdRefCurrent) {
    return false;
  }
  const status = currentMessage?.status;
  if (
    status !== MessageStatusEnum.Complete &&
    status !== MessageStatusEnum.Error &&
    status !== MessageStatusEnum.Stopped
  ) {
    return false;
  }
  conversationErrorTerminalLogger.warn(
    'drop late MESSAGE chunk: message already terminal',
    {
      messageId: currentMessage?.id ?? currentMessageId,
      chunkType: chunk.type,
      chunkText:
        typeof chunk.text === 'string' ? chunk.text.slice(0, 20) : chunk.text,
    },
  );
  return true;
}

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

  return [
    ...completeMessageList,
    {
      ...chatMessage,
      clientRenderKey: chatMessage.clientRenderKey || String(chatMessage.id),
    },
    {
      ...currentMessage,
      clientRenderKey:
        currentMessage.clientRenderKey || String(currentMessage.id),
    },
  ];
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

/**
 * 找到当前尚未落库轮次的起点。
 *
 * 用户消息由前端 UUID 乐观插入，但同轮 assistant 在 SSE 过程中可能提前换成
 * 服务端格式 ID。因此不能只把末尾连续 UUID 当作乐观尾巴，必须从最后一条
 * 已落库 user 之后的首条乐观 user 开始，整体保留这一轮。
 */
const findOptimisticRoundStart = (messages: MessageInfo[]): number => {
  let lastPersistedUserIndex = -1;
  messages.forEach((message, index) => {
    if (
      message.role === AssistantRoleEnum.USER &&
      !isOptimisticMessageId(message.id)
    ) {
      lastPersistedUserIndex = index;
    }
  });

  return messages.findIndex(
    (message, index) =>
      index > lastPersistedUserIndex &&
      message.role === AssistantRoleEnum.USER &&
      isOptimisticMessageId(message.id),
  );
};

const findClientRenderRoundStart = (messages: MessageInfo[]): number => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (
      messages[index].role === AssistantRoleEnum.USER &&
      messages[index].clientRenderKey
    ) {
      return index;
    }
  }
  return -1;
};

const getIdlessMessageSignature = (message: MessageInfo): string =>
  JSON.stringify([
    message.role || '',
    message.type || '',
    message.messageType || '',
    message.text || '',
    message.think || '',
    message.quotedText || '',
  ]);

const getIdlessMessageKey = (message: MessageInfo): string => {
  const isSyntheticOpeningMessage =
    !hasStableMessageId(message.id) &&
    (message.index === null || message.index === undefined) &&
    message.role === AssistantRoleEnum.ASSISTANT &&
    message.messageType === MessageTypeEnum.ASSISTANT;
  return isSyntheticOpeningMessage
    ? 'synthetic-opening-message'
    : `idless:${getIdlessMessageSignature(message)}`;
};

/**
 * 将最近一轮的客户端渲染标识迁移到对应的服务端消息，并返回
 * 「服务端消息下标 → 对应本地客户端消息」的映射。
 *
 * 该映射供终态快照合并时使用：乐观 uuid 消息在服务端快照中无法按 id 定位，
 * 需要借由轮次内的顺序对应关系，精确定位应保留本地呈现的消息。
 */
const preserveClientRenderKeys = (
  clientRound: MessageInfo[],
  incoming: MessageInfo[],
): {
  list: MessageInfo[];
  localByIncomingIndex: Map<number, MessageInfo>;
} => {
  const localByIncomingIndex = new Map<number, MessageInfo>();
  const clientUser = clientRound[0];
  if (clientUser?.role !== AssistantRoleEnum.USER) {
    return { list: incoming, localByIncomingIndex };
  }

  const result = [...incoming];
  let cursor = -1;
  for (let index = result.length - 1; index >= 0; index -= 1) {
    const message = result[index];
    if (
      message.role === AssistantRoleEnum.USER &&
      (message.text || '').trim() === (clientUser.text || '').trim()
    ) {
      cursor = index;
      break;
    }
  }
  if (cursor < 0) {
    return { list: incoming, localByIncomingIndex };
  }

  clientRound.forEach((clientMessage, clientIndex) => {
    const matchedIndex = result.findIndex(
      (message, index) =>
        index >= cursor &&
        message.role === clientMessage.role &&
        (clientIndex !== 0 ||
          (message.text || '').trim() === (clientMessage.text || '').trim()),
    );
    if (matchedIndex < 0) {
      cursor = result.length;
      return;
    }

    result[matchedIndex] = {
      ...result[matchedIndex],
      clientRenderKey:
        clientMessage.clientRenderKey || String(clientMessage.id),
    };
    localByIncomingIndex.set(matchedIndex, clientMessage);
    cursor = matchedIndex + 1;
  });
  return { list: result, localByIncomingIndex };
};

/**
 * 会话终态快照（轮询/恢复读取）合并时，保留本地消息的可见呈现。
 *
 * 本地 SSE 流式渲染的 text/think/processingList 与后端落库快照可能存在细微
 * 差异；若直接用快照覆盖，Markdown/思考区会重新渲染，产生肉眼可见的闪烁。
 * 会话结束后轮询仍在继续，因此需要冻结「本地已终态」消息的呈现字段。
 *
 * 匹配优先级：
 * 1. 稳定服务端 id（更早轮次已落库消息、SSE 中已换服务端 id 的中间过程消息）；
 * 2. 客户端轮次映射（乐观 uuid 消息按轮次内顺序对应）；
 * 3. clientRenderKey + finalResult（历史兼容兜底：仅最终结果消息）。
 *
 * 只有「本地已终态（非 loading/incomplete）」的消息才保留本地呈现；
 * 流式中的消息仍允许快照更新补齐。保留范围仅呈现字段，id/index 与
 * mcpAsk/ACP 等交互元数据仍取自服务端快照。
 */
const preserveFinalizedMessagePresentation = (
  current: MessageInfo[],
  incomingList: MessageInfo[],
  incoming: MessageInfo,
  incomingIndex: number,
  localByIncomingIndex: Map<number, MessageInfo>,
): MessageInfo => {
  let local: MessageInfo | undefined;

  // 1) 精确匹配：已落库 / 中间过程消息都有服务端稳定 id，按 id 找本地对应消息
  if (hasStableMessageId(incoming.id)) {
    local = current.find((message) => sameStableId(message.id, incoming.id));
  }

  // 2) 乐观 uuid 消息（尚未落库）按客户端轮次映射对应
  if (!local) {
    local = localByIncomingIndex.get(incomingIndex);
  }

  // 3) 兜底：带 finalResult 的最终消息（历史兼容路径）
  if (!local && incoming.clientRenderKey) {
    // 同一轮工作流可能产生多条复用 clientRenderKey 的 assistant 消息；FINAL_RESULT
    // 属于该 key 的最后一条，仅兜底保护该条，避免污染前置过程消息。
    for (
      let index = incomingList.length - 1;
      index > incomingIndex;
      index -= 1
    ) {
      if (incomingList[index].clientRenderKey === incoming.clientRenderKey) {
        return incoming;
      }
    }
    local = current.find(
      (message) =>
        message.clientRenderKey === incoming.clientRenderKey &&
        message.finalResult,
    );
  }

  // 纯后端加载的消息（本地无客户端渲染标识）本地 == 快照，无需保留
  if (!local || !local.clientRenderKey) {
    return incoming;
  }

  // 流式中的消息（loading/incomplete）仍以快照为准；已终态
  // （Complete/Error/Stopped/null）才冻结本地呈现，避免结束后的轮询覆盖闪烁。
  if (!local.finalResult && isIncompleteStatus(local.status)) {
    // 流式中收到轮询/resume 快照：内联思考只存在于流式管道（THINK 分片写入
    // think 字段），快照正文不带——直接采纳快照会让已渲染的思考块凭空消失。
    // 本地有思考而快照无思考时，保留本地思考展示（正文仍以快照为准）。
    if ((local.think || '') && !(incoming.think || '')) {
      return {
        ...incoming,
        think: local.think,
        thinkingFinished: local.thinkingFinished,
      };
    }
    return incoming;
  }

  return {
    ...incoming,
    clientRenderKey: local.clientRenderKey,
    text: local.text,
    think: local.think,
    thinkBlocks: local.thinkBlocks,
    attachments: local.attachments,
    requestId: local.requestId,
    status: local.status,
    thinkingFinished: local.thinkingFinished,
    finalResult: local.finalResult,
    processingList: local.processingList,
  };
};

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

  // SSE assistant 可能已换成服务端格式 ID，优先从乐观 user 开始保留整个未落库轮次。
  const optimisticRoundStart = findOptimisticRoundStart(prev);
  const tail: MessageInfo[] =
    optimisticRoundStart >= 0 ? prev.slice(optimisticRoundStart) : [];

  // 没有乐观 user 时兼容仅 assistant 占位的恢复场景：从末尾收集连续 UUID。
  if (!tail.length) {
    for (let i = prev.length - 1; i >= 0; i -= 1) {
      if (isOptimisticMessageId(prev[i].id)) {
        tail.unshift(prev[i]);
      } else {
        break;
      }
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
  // 未落库 user 后面的 assistant 即使已被 SSE 换成服务端格式 ID，仍属于本地轮次，
  // 不能提前归入 persisted；否则 preserveOptimisticMessageTail 追加整轮时会重复。
  const optimisticRoundStart = findOptimisticRoundStart(currentList);
  const persistedSource =
    optimisticRoundStart >= 0
      ? currentList.slice(0, optimisticRoundStart)
      : currentList;
  const optimisticRound =
    optimisticRoundStart >= 0 ? currentList.slice(optimisticRoundStart) : [];
  const clientRoundStart = findClientRenderRoundStart(currentList);
  const clientRound =
    clientRoundStart >= 0
      ? currentList.slice(clientRoundStart)
      : optimisticRound;
  const persisted = persistedSource.filter(
    (message) => !isOptimisticMessageId(message.id),
  );
  const indexByIdentity = new Map<string, number>();
  const serverMerged: MessageInfo[] = [];
  const upsert = (message: MessageInfo, replaceExisting: boolean) => {
    const hasId = hasStableMessageId(message.id);
    const identity = hasId
      ? `id:${String(message.id)}`
      : getIdlessMessageKey(message);
    const existingIndex = indexByIdentity.get(identity);
    if (existingIndex !== undefined) {
      // 稳定 ID 的服务端消息需要覆盖旧内容；无 ID 合成消息只在语义发生变化时
      // 替换，从而忽略服务端每轮重新生成的 time 等易变字段。
      if (
        replaceExisting &&
        (hasId ||
          getIdlessMessageSignature(serverMerged[existingIndex]) !==
            getIdlessMessageSignature(message))
      ) {
        const existing = serverMerged[existingIndex];
        serverMerged[existingIndex] = existing.clientRenderKey
          ? { ...message, clientRenderKey: existing.clientRenderKey }
          : message;
      }
      return;
    }
    indexByIdentity.set(identity, serverMerged.length);
    serverMerged.push(message);
  };

  // 先归并当前列表，可立即清除之前轮询已经累计的重复开场白。
  persisted.forEach((message) => upsert(message, false));
  const { list: incomingWithRenderKeys, localByIncomingIndex } =
    preserveClientRenderKeys(clientRound, incomingList);
  incomingWithRenderKeys
    .map((message, index) =>
      preserveFinalizedMessagePresentation(
        currentList,
        incomingWithRenderKeys,
        message,
        index,
        localByIncomingIndex,
      ),
    )
    .forEach((message) => upsert(message, true));

  const merged = preserveOptimisticMessageTail(currentList, serverMerged);
  return isEqual(currentList, merged) ? currentList : merged;
}
