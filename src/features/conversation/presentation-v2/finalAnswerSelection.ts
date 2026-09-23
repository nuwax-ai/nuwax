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
  return isExactTextAggregation(outputText, textParts)
    ? tailSegment.content.trim()
    : outputText;
}
