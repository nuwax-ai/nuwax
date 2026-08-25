/**
 * 终端输出渲染协议（会话渲染升级 P0-1）
 *
 * 约定：Bash/shell 类工具调用的 `ExecuteResultInfo.data` 数组携带
 * `{ type: 'terminal', command?, content, exitCode? }` 项，与文件 diff 项
 * （`{ type: 'diff', ... }`，见 utils/fileChangeDiff.ts）同构共存。
 * 流式阶段 content 随 PROCESSING 事件 upsert 增长（经 chat model 的
 * processingList 同步），text 标签只负责占位，输出内容不走标签属性。
 */

export interface TerminalOutputItem {
  /** 执行的命令行；缺省回退 result.input.command 或工具名 */
  command?: string;
  /** 终端输出全文（stdout/stderr 合流） */
  content: string;
  /** 退出码：0 成功、非 0 失败、null/undefined 未结束（流式中） */
  exitCode?: number | null;
}

/** data 项的兼容形状：content/output 互为别名 */
const readContent = (item: Record<string, unknown>): string => {
  if (typeof item.content === 'string') return item.content;
  if (typeof item.output === 'string') return item.output;
  return '';
};

/**
 * 从工具结果归一化终端输出项；无 terminal 项时返回空数组（调用方走通用卡片渲染）。
 */
export const normalizeTerminalItems = (
  result: unknown,
): TerminalOutputItem[] => {
  if (!result || typeof result !== 'object') return [];
  const data = (result as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  const items: TerminalOutputItem[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    if (item.type !== 'terminal') continue;
    const content = readContent(item);
    if (!content && item.exitCode == null) continue;
    items.push({
      command: typeof item.command === 'string' ? item.command : undefined,
      content,
      exitCode: typeof item.exitCode === 'number' ? item.exitCode : null,
    });
  }
  return items;
};

/** 多次执行拼接为单块（命令取首项，退出码取末项——最终执行结果） */
export const mergeTerminalItems = (
  items: TerminalOutputItem[],
): TerminalOutputItem | null => {
  if (!items.length) return null;
  return {
    command: items.find((item) => item.command)?.command,
    content: items
      .map((item) => item.content)
      .filter(Boolean)
      .join('\n'),
    exitCode: items[items.length - 1].exitCode ?? null,
  };
};

/** 单步耗时（result.startTime/endTime，毫秒）；流式中或字段缺失返回 null */
export const getProcessDurationMs = (result: unknown): number | null => {
  if (!result || typeof result !== 'object') return null;
  const { startTime, endTime } = result as {
    startTime?: number;
    endTime?: number;
  };
  if (
    typeof startTime !== 'number' ||
    typeof endTime !== 'number' ||
    endTime < startTime
  ) {
    return null;
  }
  return endTime - startTime;
};

/** 耗时展示：<1s → '320ms'；<60s → '2.4s'；更长 → '2m5s' */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return seconds ? `${minutes}m${seconds}s` : `${minutes}m`;
};

/** Plan 进度摘要：completed 计数 + 当前 in_progress 步骤名 */
export const getPlanProgress = (
  steps: unknown,
): { completed: number; total: number; currentStep?: string } | null => {
  if (!Array.isArray(steps)) return null;
  let completed = 0;
  let currentStep: string | undefined;
  for (const entry of steps) {
    if (!entry || typeof entry !== 'object') continue;
    const step = entry as { status?: string; content?: string };
    if (step.status === 'completed') completed += 1;
    if (step.status === 'in_progress' && currentStep === undefined) {
      currentStep = step.content;
    }
  }
  return { completed, total: steps.length, currentStep };
};
