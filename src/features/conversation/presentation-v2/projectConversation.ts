/**
 * V2 投影 · MessageInfo[] → ConversationPresentationV2（specs/nuwax-conversation-renderer-v2.md）。
 *
 * 历史回放与实时流式共用本函数；legacy model 与 runtime session 两条数据线
 * 产出同构 MessageInfo[]，投影对两线无感（四组合矩阵的唯一投影事实源）。
 *
 * 稳定性契约：
 * - 轮次优先按 requestId 归组，缺失（乐观消息/中断轮/历史常态）回退 USER 边界；
 * - 词法解析容错，畸形内容产出 unknown 节点不中断整轮；
 * - 工具按稳定 executeId 去重（保留最后一次出现的位置与属性，与 V1 分组算法一致）；
 * - 本函数不做异常吞噬：投影层自身 bug 抛出，由渲染层捕获并整份回退 V1。
 */
import {
  AgentComponentTypeEnum,
  AssistantRoleEnum,
  MessageModeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ExecuteResultInfo,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import {
  parseMessageSegments,
  stripCustomTags,
  type MessageSegment,
} from './parseMessageSegments';
import type {
  ConversationFinalAnswer,
  ConversationPresentationV2,
  ConversationProcessNode,
  ConversationTurnPresentationV2,
} from './types';

/** 与 useActiveInterventionQueue.isActiveResponseStatus 同语义：pending/submitting（含缺省）视为待回答，不投影为节点 */
const INTERACTION_ACTIVE_STATUS = new Set(['pending', 'submitting']);

const isUserMessage = (message: MessageInfo): boolean =>
  message.role === AssistantRoleEnum.USER;

const isRunningStatus = (status?: string): boolean =>
  status === MessageStatusEnum.Loading ||
  status === MessageStatusEnum.Incomplete;

const firstLine = (text: string, max = 80): string => {
  const line = (text || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return line.length > max ? `${line.slice(0, max)}…` : line;
};

const messageStableKey = (
  message: MessageInfo,
  fallbackIndex: number,
): string => {
  const id = message.clientRenderKey || message.id;
  if (id !== null && id !== undefined && String(id).trim() !== '') {
    return String(id);
  }
  return `idx-${message.index ?? fallbackIndex}`;
};

/** 按会话顺序稳定排序：有 index 用 index，无 index 保持原相对顺序 */
const sortMessages = (list: MessageInfo[]): MessageInfo[] =>
  list
    .map((message, position) => ({ message, position }))
    .sort((a, b) => {
      const ai =
        typeof a.message.index === 'number' ? a.message.index : a.position;
      const bi =
        typeof b.message.index === 'number' ? b.message.index : b.position;
      return ai - bi;
    })
    .map((entry) => entry.message);

/** 历史执行结果 → ProcessingInfo（success 推断终态，与 reconcileFinalMessageState.toProcessingData 同规则） */
const toProcessingFromResult = (result: ExecuteResultInfo): ProcessingInfo =>
  ({
    executeId: result.executeId,
    name: result.name,
    type: result.type,
    status:
      result.success === false
        ? ProcessingEnum.FAILED
        : ProcessingEnum.FINISHED,
    result,
    targetId: -1,
    cardBindConfig: null,
  } as unknown as ProcessingInfo);

/**
 * 消息内工具执行详情合并（spec「数据与状态」）：
 * 1) 历史 componentExecutedList 作基底（历史消息 processingList 常缺失，过滤无 executeId 条目）；
 * 2) 消息 processingList（流式）覆盖基底；
 * 3) finalResult.componentExecuteResults（终态）覆盖一切——终态覆盖流式、缺失补齐；
 * 4) finalResult 在场时残余 EXECUTING 判 FAILED（与 reconcileFinalMessageState 同规则）。
 */
const collectProcessingByKey = (
  message: MessageInfo,
): Map<string, ProcessingInfo> => {
  const map = new Map<string, ProcessingInfo>();
  const upsert = (item: ProcessingInfo) => {
    if (!item?.executeId) return;
    map.set(item.executeId, item);
  };
  if (Array.isArray(message.componentExecutedList)) {
    message.componentExecutedList.forEach((raw) => {
      const result = (raw as { result?: ExecuteResultInfo })?.result;
      if (!result?.executeId) return;
      upsert(toProcessingFromResult(result));
    });
  }
  (message.processingList ?? []).forEach(upsert);
  const terminalResults =
    (message.finalResult?.componentExecuteResults ?? []).filter(
      (result) => !!result?.executeId,
    ) ?? [];
  terminalResults.forEach((result) => upsert(toProcessingFromResult(result)));
  if (message.finalResult) {
    map.forEach((item, executeId) => {
      if (item.status === ProcessingEnum.EXECUTING) {
        map.set(executeId, { ...item, status: ProcessingEnum.FAILED });
      }
    });
  }
  return map;
};

const isOpenUiRenderName = (name?: string): boolean =>
  !!name &&
  (/nuwax_render_openui/i.test(name) ||
    /Backend\.Sandbox\.Event\.renderUI/i.test(name));

const isPlainEventSegment = (segment: MessageSegment): boolean =>
  segment.type === 'process' &&
  segment.componentType === AgentComponentTypeEnum.Event &&
  !isOpenUiRenderName(segment.name);

/** process 段过滤+去重：丢弃纯 Event 与无 executeId 段（与 V1 渲染 null 分支一致）；executeId 去重保留最后一次出现 */
const dedupeProcessSegments = (
  segments: MessageSegment[],
): MessageSegment[] => {
  const lastIndexOf = new Map<string, number>();
  segments.forEach((segment, index) => {
    if (segment.type !== 'process' || !segment.executeId) return;
    lastIndexOf.set(segment.executeId, index);
  });
  const kept = segments.filter((segment, index) => {
    if (segment.type !== 'process') return true;
    if (isPlainEventSegment(segment)) return false;
    if (!segment.executeId) return false;
    return lastIndexOf.get(segment.executeId) === index;
  });
  // 相邻连续 Plan 去冗余（只保留最后一个），与 groupMarkdownProcesses 同规则
  const result: MessageSegment[] = [];
  kept.forEach((segment) => {
    const prev = result[result.length - 1];
    if (
      segment.type === 'process' &&
      segment.componentType === AgentComponentTypeEnum.Plan &&
      prev?.type === 'process' &&
      prev.componentType === AgentComponentTypeEnum.Plan
    ) {
      result.pop();
    }
    result.push(segment);
  });
  return result;
};

const processingNodeStatus = (
  segment: Extract<MessageSegment, { type: 'process' }>,
  detail?: ProcessingInfo,
): ConversationProcessNode['status'] => {
  if (detail?.status === ProcessingEnum.FAILED) return 'failed';
  if (detail?.status === ProcessingEnum.FINISHED) return 'finished';
  if (detail?.status === ProcessingEnum.EXECUTING) return 'running';
  if (segment.status === ProcessingEnum.FAILED) return 'failed';
  if (segment.status === ProcessingEnum.FINISHED) return 'finished';
  if (segment.status === ProcessingEnum.EXECUTING) return 'running';
  return 'unknown';
};

interface TurnDraft {
  key: string;
  userMessage?: MessageInfo;
  requestId?: string;
  assistantMessages: MessageInfo[];
}

const collectCompletedAskInteractions = (
  message: MessageInfo,
): NonNullable<ConversationProcessNode['interaction']>[] =>
  (message.mcpAskInteractions ?? [])
    .filter(
      (interaction) =>
        !!interaction.responseStatus &&
        !INTERACTION_ACTIVE_STATUS.has(interaction.responseStatus),
    )
    .map((interaction) => ({
      kind: 'ask' as const,
      title: interaction.input?.title || interaction.input?.description || '',
      answerSummary: '',
      toolCallId: interaction.toolCallId,
      triggeredAt: interaction.triggeredAt,
    }));

const collectCompletedPermissionInteractions = (
  message: MessageInfo,
): NonNullable<ConversationProcessNode['interaction']>[] =>
  (
    (message.acpPermissionInteractions ?? []) as Array<{
      id: string;
      responseStatus?: string;
      selectedOptionId?: string;
      triggeredAt?: number;
      intervention?: {
        acp?: {
          request?: { toolCall?: { toolCallId?: string; title?: string } };
        };
      };
    }>
  )
    .filter(
      (interaction) =>
        !!interaction.responseStatus &&
        !INTERACTION_ACTIVE_STATUS.has(interaction.responseStatus),
    )
    .map((interaction) => ({
      kind: 'permission' as const,
      title: interaction.intervention?.acp?.request?.toolCall?.title || '',
      answerSummary: interaction.selectedOptionId || '',
      toolCallId: interaction.intervention?.acp?.request?.toolCall?.toolCallId,
      triggeredAt: interaction.triggeredAt,
    }));

/** 单轮投影：节点序列、最终回答、指标 */
const projectTurn = (draft: TurnDraft): ConversationTurnPresentationV2 => {
  const assistantMessages = draft.assistantMessages;
  const running = assistantMessages.some((message) =>
    isRunningStatus(message.status),
  );
  // 终态/状态参考消息取最后一条 ASSISTANT 角色消息：assistantMessages 含
  // SYSTEM/FUNCTION（context），轮末跟随时其无 status，不得遮蔽真实终态
  const lastAssistantRoleMessage = [...assistantMessages]
    .reverse()
    .find((message) => message.role === AssistantRoleEnum.ASSISTANT);
  const terminalStatus: ConversationTurnPresentationV2['terminalStatus'] =
    lastAssistantRoleMessage?.status === MessageStatusEnum.Error
      ? 'error'
      : lastAssistantRoleMessage?.status === MessageStatusEnum.Stopped
      ? 'stopped'
      : 'complete';

  // ---- 最终回答候选消息：仅 ASSISTANT 的 CHAT/ANSWER（缺省视为 CHAT）----
  // SYSTEM/FUNCTION 是上下文、THINK 已单列、QUESTION/GUID 不是回答——都不得外显为最终回答
  const isAnswerCandidateMessage = (message: MessageInfo): boolean =>
    message.role === AssistantRoleEnum.ASSISTANT &&
    (message.type === undefined ||
      message.type === MessageModeEnum.CHAT ||
      message.type === MessageModeEnum.ANSWER);

  // ---- 最终回答第一优先级：最后一条非空 finalResult.outputText（剥标签后仍非空）----
  let answerFromFinalResult: string | undefined;
  for (let i = assistantMessages.length - 1; i >= 0; i -= 1) {
    if (!isAnswerCandidateMessage(assistantMessages[i])) continue;
    const outputText = assistantMessages[i].finalResult?.outputText;
    if (!outputText) continue;
    const stripped = stripCustomTags(outputText);
    if (stripped) {
      answerFromFinalResult = stripped;
      break;
    }
  }

  // ---- 预解析各消息段，确定「回答正文段」归属（回答不进轨迹，其余正文段为 narration）----
  const parsedSegments = assistantMessages.map((message) =>
    parseMessageSegments(message.text),
  );
  // 最后一条候选正文段（从后向前，只看 ASSISTANT 的 CHAT/ANSWER 消息）
  const findLastAnswerCandidateSegment = (): {
    messageIndex: number;
    segmentIndex: number;
  } | null => {
    for (let mi = parsedSegments.length - 1; mi >= 0; mi -= 1) {
      if (!isAnswerCandidateMessage(assistantMessages[mi])) continue;
      const segs = parsedSegments[mi];
      for (let si = segs.length - 1; si >= 0; si -= 1) {
        const seg = segs[si];
        if (seg.type === 'text' && seg.content.trim()) {
          return { messageIndex: mi, segmentIndex: si };
        }
      }
    }
    return null;
  };
  const normalizeForCompare = (text: string): string =>
    text.replace(/\s+/g, '');
  /** outputText 与正文段同源判定：任一方向包含即视为同一内容（终态 outputText 常为正文段的聚合/截断） */
  const isSameAnswerContent = (
    outputText: string,
    segmentText: string,
  ): boolean => {
    const a = normalizeForCompare(outputText);
    const b = normalizeForCompare(segmentText);
    if (!a || !b) return false;
    return a.includes(b) || b.includes(a);
  };
  const answerRef: { messageIndex: number; segmentIndex: number } | null =
    (() => {
      if (answerFromFinalResult) {
        // 去重：消息末尾与 outputText 同源的正文段即最终回答本身，不得再入轨迹
        const tail = findLastAnswerCandidateSegment();
        if (
          tail &&
          isSameAnswerContent(
            answerFromFinalResult,
            (
              parsedSegments[tail.messageIndex][tail.segmentIndex] as Extract<
                MessageSegment,
                { type: 'text' }
              >
            ).content,
          )
        ) {
          return tail;
        }
        return null;
      }
      if (running) {
        // 运行态：最后一条候选消息的末尾若为正文段，即为实时回答区。
        // 轮末瞬时跟随 SYSTEM/FUNCTION（非候选）时回退扫描最后的候选正文段，
        // 避免实时回答区闪烁清空、已流出正文降级为轨迹摘要。
        const last = parsedSegments.length - 1;
        if (last < 0) return null;
        if (!isAnswerCandidateMessage(assistantMessages[last])) {
          return findLastAnswerCandidateSegment();
        }
        const segs = parsedSegments[last];
        const tail = segs[segs.length - 1];
        return tail?.type === 'text' && tail.content.trim()
          ? { messageIndex: last, segmentIndex: segs.length - 1 }
          : null;
      }
      // 终态回退：全轮最后一个非空候选正文段
      return findLastAnswerCandidateSegment();
    })();

  const finalAnswer: ConversationFinalAnswer = answerFromFinalResult
    ? { text: answerFromFinalResult, source: 'finalResult' }
    : answerRef
    ? {
        text: (
          parsedSegments[answerRef.messageIndex][
            answerRef.segmentIndex
          ] as Extract<MessageSegment, { type: 'text' }>
        ).content,
        source: 'messageText',
      }
    : { text: '', source: 'none' };

  // ---- 组装节点（保持真实顺序）----
  // 回答正文段按对象身份排除（dedupe 只会移除 process 段，text 段对象引用稳定）
  const answerSegment = answerRef
    ? (parsedSegments[answerRef.messageIndex][answerRef.segmentIndex] as
        | MessageSegment
        | undefined)
    : undefined;
  const nodes: ConversationProcessNode[] = [];
  assistantMessages.forEach((message, messageIndex) => {
    const messageKey = messageStableKey(message, messageIndex);
    const processingByKey = collectProcessingByKey(message);

    // SYSTEM/FUNCTION 消息整体作为 context 节点（上下文/系统提示），不再做段解析：
    // 其正文是上下文内容，既不产生 narration，也不得成为最终回答
    if (
      message.role === AssistantRoleEnum.SYSTEM ||
      message.role === AssistantRoleEnum.FUNCTION
    ) {
      nodes.push({
        id: `${messageKey}-context`,
        kind: 'context',
        title: '',
        summary: firstLine(message.text ?? ''),
        status: 'finished',
        failed: false,
        text: message.text ?? '',
      });
      return;
    }

    // 历史消息兜底：text 无思考标签但有聚合 think/thinkBlocks 时补 reasoning 节点
    const segments = parsedSegments[messageIndex];
    const hasThinkSegment = segments.some((seg) => seg.type === 'think');
    if (!hasThinkSegment) {
      const thinkTexts =
        message.thinkBlocks?.filter((block) => !!block && !!block.trim()) ??
        (message.think?.trim() ? [message.think] : []);
      thinkTexts.forEach((thinkText, blockIndex) => {
        nodes.push({
          id: `${messageKey}-think-legacy-${blockIndex}`,
          kind: 'reasoning',
          title: '',
          summary: firstLine(thinkText),
          status: 'finished',
          failed: false,
          thinkText,
        });
      });
    }

    dedupeProcessSegments(segments).forEach((segment, segmentIndex) => {
      if (segment.type === 'think') {
        nodes.push({
          id: `${messageKey}-think-${segmentIndex}`,
          kind: 'reasoning',
          title: '',
          summary: firstLine(segment.content),
          status: segment.status === 'thinking' ? 'running' : 'finished',
          failed: false,
          thinkText: segment.content,
        });
        return;
      }
      if (segment.type === 'process') {
        const detail = segment.executeId
          ? processingByKey.get(segment.executeId)
          : undefined;
        const status = processingNodeStatus(segment, detail);
        const kind: ConversationProcessNode['kind'] =
          segment.componentType === AgentComponentTypeEnum.SubAgent
            ? 'subagent'
            : segment.componentType === AgentComponentTypeEnum.Plan
            ? 'plan'
            : 'tool';
        nodes.push({
          id: segment.executeId ?? `${messageKey}-process-${segmentIndex}`,
          kind,
          title: detail?.name || segment.name || segment.componentType || '',
          summary: firstLine(detail?.executingMessage ?? ''),
          status,
          failed: status === 'failed',
          processing: detail,
          executeId: segment.executeId,
          componentType: segment.componentType,
          segmentStatus: segment.status,
          startTime:
            typeof detail?.result?.startTime === 'number'
              ? detail.result.startTime
              : undefined,
          endTime:
            typeof detail?.result?.endTime === 'number'
              ? detail.result.endTime
              : undefined,
        });
        return;
      }
      if (segment.type === 'unknown') {
        nodes.push({
          id: `${messageKey}-unknown-${segmentIndex}`,
          kind: 'unknown',
          title: '',
          summary: firstLine(segment.content),
          status: 'unknown',
          failed: false,
          text: segment.content,
        });
        return;
      }
      // text 段：被选为最终回答的段不进轨迹，其余为 narration 节点
      if (segment === answerSegment) {
        return;
      }
      nodes.push({
        id: `${messageKey}-narration-${segmentIndex}`,
        kind: 'narration',
        title: '',
        summary: firstLine(segment.content),
        status: running ? 'running' : 'finished',
        failed: false,
        text: segment.content,
      });
    });

    // 已完成交互（提问/权限）→ completed-interaction 节点（待回答的留在 dock，不进轨迹）
    const completedInteractions = [
      ...collectCompletedAskInteractions(message),
      ...collectCompletedPermissionInteractions(message),
    ];
    completedInteractions.forEach((interaction) => {
      const anchorIndex = interaction.toolCallId
        ? (() => {
            const idx = nodes.findIndex(
              (node) => node.id === interaction.toolCallId,
            );
            return idx;
          })()
        : -1;
      const node: ConversationProcessNode = {
        id: `${messageKey}-interaction-${
          interaction.toolCallId ?? nodes.length
        }`,
        kind: 'completed-interaction',
        title: interaction.title,
        summary: interaction.answerSummary,
        status: 'finished',
        failed: false,
        interaction,
      };
      if (anchorIndex >= 0) {
        nodes.splice(anchorIndex + 1, 0, node);
      } else {
        nodes.push(node);
      }
    });
  });

  // ---- 指标 ----
  const toolExecuteIds = new Set(
    nodes
      .filter((node) => node.kind === 'tool' || node.kind === 'subagent')
      .map((node) => node.executeId ?? node.id),
  );
  const messageCount = nodes.filter(
    (node) =>
      node.kind === 'reasoning' ||
      node.kind === 'context' ||
      node.kind === 'narration' ||
      node.kind === 'completed-interaction',
  ).length;

  const lastFinalResult = [...assistantMessages]
    .reverse()
    .find((message) => message.finalResult)?.finalResult;
  let elapsedMs: number | undefined;
  let elapsedAnchor: number | undefined;
  if (
    typeof lastFinalResult?.startTime === 'number' &&
    typeof lastFinalResult?.endTime === 'number'
  ) {
    elapsedMs = lastFinalResult.endTime - lastFinalResult.startTime;
  } else {
    const starts = nodes
      .map((node) => node.startTime)
      .filter((value): value is number => typeof value === 'number');
    const ends = nodes
      .map((node) => node.endTime)
      .filter((value): value is number => typeof value === 'number');
    const minStart = starts.length ? Math.min(...starts) : undefined;
    const maxEnd = ends.length ? Math.max(...ends) : undefined;
    if (typeof minStart === 'number' && typeof maxEnd === 'number') {
      elapsedMs = Math.max(0, maxEnd - minStart);
    } else if (typeof minStart === 'number' && running) {
      elapsedAnchor = minStart;
    }
  }

  return {
    key: draft.key,
    userMessage: draft.userMessage,
    userAttachments: draft.userMessage?.attachments,
    assistantMessages,
    nodes,
    finalAnswer,
    running,
    terminalStatus,
    metrics: {
      toolCount: toolExecuteIds.size,
      messageCount,
      elapsedMs,
      elapsedAnchor,
    },
  };
};

/**
 * 消息列表 → 轮次展示投影。纯函数；分组规则：
 * USER 消息开启新轮；无 USER 前导的 assistant/system 消息（历史半轮/开场白）
 * 自成一轮；同一轮内非空 requestId 变化时切分新轮（requestId 优先归组）。
 */
export function projectConversation(
  messageList: MessageInfo[] | undefined | null,
): ConversationPresentationV2 {
  const ordered = sortMessages((messageList ?? []).slice());
  const drafts: TurnDraft[] = [];
  let current: TurnDraft | null = null;
  let seq = 0;

  ordered.forEach((message, position) => {
    if (isUserMessage(message)) {
      current = {
        key: `turn-${messageStableKey(message, position)}`,
        userMessage: message,
        requestId: message.requestId ?? undefined,
        assistantMessages: [],
      };
      drafts.push(current);
      return;
    }
    if (!current) {
      current = {
        key: `turn-head-${messageStableKey(message, position)}`,
        assistantMessages: [],
      };
      drafts.push(current);
    }
    const nextRequestId = message.requestId ?? undefined;
    const turnRequestId = current.requestId ?? nextRequestId;
    if (
      turnRequestId &&
      nextRequestId &&
      nextRequestId !== turnRequestId &&
      current.assistantMessages.length > 0
    ) {
      current = {
        key: `turn-${messageStableKey(message, position)}-${seq++}`,
        requestId: nextRequestId,
        assistantMessages: [],
      };
      drafts.push(current);
    } else if (!current.requestId && nextRequestId) {
      current.requestId = nextRequestId;
    }
    current.assistantMessages.push(message);
  });

  return { turns: drafts.map(projectTurn) };
}
