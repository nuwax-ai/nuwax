/**
 * 会话「最终结果」与执行步骤耗时的纯函数集合。
 * 与 chatUtils（SSE、附件等）解耦，业务组件统一从此文件引用，减少分散侵入。
 */

import type { ConversationFinalResult } from '@/types/interfaces/conversationInfo';

/** 仅含起止时间字段，避免与 ConversationFinalResult 强耦合 */
export type FinalResultElapsedSource = {
  endTime?: number;
  startTime?: number;
};

/**
 * 解析最终结果对象上的起止时间；流式或异常数据下可能缺字段，返回 null。
 */
export function parseFinalResultTimes(
  fr: FinalResultElapsedSource | null | undefined,
): { startTime: number; endTime: number; elapsedMs: number } | null {
  if (fr === null || fr === undefined) return null;
  const { endTime, startTime } = fr;
  if (
    typeof endTime !== 'number' ||
    typeof startTime !== 'number' ||
    !Number.isFinite(endTime) ||
    !Number.isFinite(startTime)
  ) {
    return null;
  }
  return {
    startTime,
    endTime,
    elapsedMs: endTime - startTime,
  };
}

/**
 * 耗时毫秒数，用于 dict 插值；无效时返回 `'--'`。
 */
export function safeElapsedMsForDict(
  fr: FinalResultElapsedSource,
): number | string {
  const t = parseFinalResultTimes(fr);
  return t === null ? '--' : t.elapsedMs;
}

/**
 * 总耗时（秒，一位小数）；无效时返回 `'0'`。
 */
export function formatFinalResultElapsedSeconds(
  fr: FinalResultElapsedSource | null | undefined,
): string {
  const t = parseFinalResultTimes(fr);
  if (!t) return '0';
  return (t.elapsedMs / 1000).toFixed(1);
}

/**
 * 智能体日志接口 `executeResult`：JSON 字符串 → 会话最终结果；解析失败不抛错。
 */
export function parseConversationFinalResultJson(
  raw: string | undefined,
): ConversationFinalResult | null {
  if (raw === null || raw === undefined || String(raw).trim() === '') {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object') {
      return parsed as ConversationFinalResult;
    }
    return null;
  } catch (e) {
    console.error('[parseConversationFinalResultJson] JSON 解析失败', e);
    return null;
  }
}

/**
 * 日志详情中单步 input / data 在 `<pre>` 中的展示字符串。
 */
export function stringifyExecutePayloadForPre(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data !== null && typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  }
  return data === null || data === undefined ? '' : String(data);
}

/**
 * 单步执行耗时文案（如 RunOver Popover 行尾）；与总耗时格式化规则不同，单独维护。
 */
export function formatProcessingStepDurationLabel(
  endTime?: number | null,
  startTime?: number | null,
): string {
  if (!endTime || !startTime || endTime <= 0 || startTime <= 0) {
    return '';
  }
  const time = endTime - startTime;
  if (time < 0) {
    return '';
  }
  if (time < 1000) {
    return `${time}ms`;
  }
  return `${(time / 1000).toFixed(1)}s`;
}
