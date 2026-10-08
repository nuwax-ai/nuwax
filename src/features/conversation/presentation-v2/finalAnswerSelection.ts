/**
 * V2 最终回答归属判断。只依据消息段边界与终态文本做保守去重，
 * 无法证明是完整拼接时保留后端原文。
 */
import { AssistantRoleEnum, MessageModeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { MessageSegment } from './parseMessageSegments';

export interface AnswerSegmentRef {
  messageIndex: number;
  segmentIndex: number;
}

/** SYSTEM/FUNCTION、THINK、QUESTION/GUID 的正文不能成为回答。 */
export const isAnswerCandidateMessage = (message: MessageInfo): boolean =>
  message.role === AssistantRoleEnum.ASSISTANT &&
  (message.type === undefined ||
    message.type === MessageModeEnum.CHAT ||
    message.type === MessageModeEnum.ANSWER);

export function findLastAnswerCandidateSegment(
  messages: MessageInfo[],
  parsedSegments: MessageSegment[][],
): AnswerSegmentRef | null {
  for (let mi = parsedSegments.length - 1; mi >= 0; mi -= 1) {
    if (!isAnswerCandidateMessage(messages[mi])) continue;
    const segments = parsedSegments[mi];
    for (let si = segments.length - 1; si >= 0; si -= 1) {
      const segment = segments[si];
      if (segment.type === 'text' && segment.content.trim()) {
        return { messageIndex: mi, segmentIndex: si };
      }
    }
  }
  return null;
}

const isAskName = (name?: string): boolean =>
  !!name &&
  (name === '问答' ||
    /(?:^|[^a-z0-9])nuwax_ask_question(?:$|[^a-z0-9])/i.test(name) ||
    /^(?:Backend\.Sandbox\.Event\.)?AskQuestion$/i.test(name));

const hasAskMetadata = (item: {
  name?: string;
  subEventType?: string | null;
}): boolean => isAskName(item.name) || item.subEventType === 'ASK_QUESTION';

/** 问答是回答中的用户交互，不能把交互前的正文划入执行过程。 */
const isAskSegment = (
  segment: MessageSegment,
  message: MessageInfo,
): boolean => {
  if (segment.type !== 'process') return false;
  if (isAskName(segment.name)) return true;
  if (!segment.executeId) return false;
  const executeId = segment.executeId;
  if (
    message.mcpAskInteractions?.some(
      (interaction) => interaction.toolCallId === executeId,
    )
  ) {
    return true;
  }
  return (
    !!message.processingList?.some(
      (item) =>
        item.executeId === executeId &&
        (hasAskMetadata(item) || isAskName(item.result?.name)),
    ) ||
    !!message.componentExecutedList?.some(
      (item) =>
        item.result?.executeId === executeId &&
        (hasAskMetadata(item) || hasAskMetadata(item.result)),
    ) ||
    !!message.finalResult?.componentExecuteResults?.some(
      (item) => item.executeId === executeId && isAskName(item.name),
    )
  );
};

/** 从末段向前跨过问答，保留同一回答的各段；普通工具、思考和未知内容仍是分界。 */
export function findAnswerSegmentsThroughAsk(
  messages: MessageInfo[],
  parsedSegments: MessageSegment[][],
  tail: AnswerSegmentRef | null,
): AnswerSegmentRef[] {
  if (!tail) return [];
  const refs = [tail];
  let crossedAsk = false;
  for (let mi = tail.messageIndex; mi >= 0; mi -= 1) {
    if (!isAnswerCandidateMessage(messages[mi])) break;
    const segments = parsedSegments[mi];
    for (
      let si =
        mi === tail.messageIndex ? tail.segmentIndex - 1 : segments.length - 1;
      si >= 0;
      si -= 1
    ) {
      const segment = segments[si];
      if (isAskSegment(segment, messages[mi])) {
        crossedAsk = true;
      } else if (
        crossedAsk &&
        segment.type === 'text' &&
        segment.content.trim()
      ) {
        refs.unshift({ messageIndex: mi, segmentIndex: si });
        crossedAsk = false;
      } else {
        return refs;
      }
    }
  }
  return refs;
}

/** 逐段匹配原文，仅允许段与段之间有空白；不能删除任何段内字符。 */
export function isExactTextAggregation(
  outputText: string,
  textParts: string[],
): boolean {
  let remaining = outputText.replace(/\r\n?/g, '\n').trim();
  for (const part of textParts) {
    const content = part.replace(/\r\n?/g, '\n').trim();
    remaining = remaining.trimStart();
    if (!content || !remaining.startsWith(content)) return false;
    remaining = remaining.slice(content.length);
  }
  return remaining.trim() === '';
}

/** 每两段正文之间都要有可信的过程分界，连续正文可能同属一份回答。 */
const hasProcessBoundaryBetweenEachTextSegment = (
  segments: MessageSegment[],
  textIndices: number[],
): boolean => {
  return textIndices
    .slice(0, -1)
    .every((start, index) =>
      segments
        .slice(start + 1, textIndices[index + 1])
        .some(
          (segment) =>
            segment.type === 'think' ||
            (segment.type === 'process' && !!segment.executeId),
        ),
    );
};

export function selectFinalResultAnswerText({
  outputText,
  outputMessageIndex,
  running,
  messages,
  parsedSegments,
}: {
  outputText?: string;
  outputMessageIndex?: number;
  running: boolean;
  messages: MessageInfo[];
  parsedSegments: MessageSegment[][];
}): string | undefined {
  if (!outputText || running) return outputText;
  const sourceMessage =
    outputMessageIndex === undefined ? undefined : messages[outputMessageIndex];
  if (
    sourceMessage?.finalResult?.success !== true ||
    sourceMessage.status === MessageStatusEnum.Error ||
    sourceMessage.status === MessageStatusEnum.Stopped
  ) {
    return outputText;
  }
  const tail = findLastAnswerCandidateSegment(messages, parsedSegments);
  if (!tail || tail.messageIndex !== outputMessageIndex) return outputText;
  const tailSegments = parsedSegments[tail.messageIndex];
  const tailSegment = tailSegments[tail.segmentIndex];
  if (
    tailSegment.type !== 'text' ||
    tail.segmentIndex !== tailSegments.length - 1
  ) {
    return outputText;
  }
  // 末段后又出现候选消息的过程内容时，回答边界仍不确定。
  if (
    parsedSegments.some(
      (segments, index) =>
        index > tail.messageIndex &&
        isAnswerCandidateMessage(messages[index]) &&
        segments.length > 0,
    )
  ) {
    return outputText;
  }

  const timeline = parsedSegments.flatMap((segments, index) =>
    index <= tail.messageIndex && isAnswerCandidateMessage(messages[index])
      ? segments
      : [],
  );
  if (timeline.some((segment) => segment.type === 'unknown')) return outputText;
  const textIndices = timeline.flatMap((segment, index) =>
    segment.type === 'text' && segment.content.trim() ? [index] : [],
  );
  if (textIndices.length < 2) return outputText;
  if (!hasProcessBoundaryBetweenEachTextSegment(timeline, textIndices)) {
    return outputText;
  }
  const textParts = textIndices.map(
    (index) =>
      (timeline[index] as Extract<MessageSegment, { type: 'text' }>).content,
  );
  if (!isExactTextAggregation(outputText, textParts)) return outputText;
  const answerRefs = findAnswerSegmentsThroughAsk(
    messages,
    parsedSegments,
    tail,
  );
  // 只剥离已证明属于过程的前缀，保留问答两侧正文及其原始段间格式。
  let answerText = outputText.replace(/\r\n?/g, '\n').trim();
  for (const part of textParts.slice(0, textParts.length - answerRefs.length)) {
    answerText = answerText
      .trimStart()
      .slice(part.replace(/\r\n?/g, '\n').trim().length);
  }
  return answerText.trim();
}
