import type { McpAskInteraction } from '../types/mcpAskIntervention';

/** 后端持久化的 componentExecutedList 条目（结构因版本略有差异） */
export type McpAskExecutedComponent = {
  status?: string;
  success?: boolean;
  executeId?: string;
  toolCallId?: string;
  input?: unknown;
  result?: {
    status?: string;
    success?: boolean;
    executeId?: string;
    toolCallId?: string;
    input?: unknown;
    data?: unknown;
  };
};

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function getMcpAskInputCandidate(
  value: unknown,
): Record<string, unknown> | undefined {
  const record = getRecord(value);
  const candidate = getRecord(record?.input) ?? record;
  return typeof candidate?.requestId === 'string' && getRecord(candidate.ui)
    ? candidate
    : undefined;
}

/**
 * 尝试将 result.data 解析为 Ask 表单候选。
 * 历史接口偶发把整个 payload 存成 JSON 字符串（外层常包 status/message + input），
 * 需先 parse 再走 candidate；非法字符串忽略，避免 hydrate 抛错。
 */
function getMcpAskInputFromMaybeJson(value: unknown): unknown {
  const directInput = getMcpAskInputCandidate(value);
  if (directInput) {
    return directInput;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  try {
    return getMcpAskInputCandidate(JSON.parse(value));
  } catch {
    // 非 JSON 文本不是 Ask 表单
    return undefined;
  }
}

/**
 * 历史接口中的 ASK_QUESTION 与实时 SSE 的数据形态并不完全一致：
 * - ToolCall 通常将输入存入 input；
 * - ASK_QUESTION 通常将表单直接存入 result.data（object，或整段 JSON 字符串）；
 * - 部分旧记录则以 JSON 文本包在 data[].content.text 中。
 */
function getMcpAskInputFromResultData(data: unknown): unknown {
  const directOrStringInput = getMcpAskInputFromMaybeJson(data);
  if (directOrStringInput) {
    return directOrStringInput;
  }

  if (!Array.isArray(data)) {
    return undefined;
  }

  for (const item of data) {
    const content = getRecord(getRecord(item)?.content);
    if (content?.type !== 'text' || typeof content.text !== 'string') {
      continue;
    }
    const parsedInput = getMcpAskInputFromMaybeJson(content.text);
    if (parsedInput) {
      return parsedInput;
    }
  }

  return undefined;
}

export function getMcpAskComponentInput(
  component: McpAskExecutedComponent,
): unknown {
  return (
    getMcpAskInputFromResultData(component.result?.data) ??
    component.input ??
    component.result?.input
  );
}

export function getMcpAskComponentToolCallId(
  component: McpAskExecutedComponent,
  input?: unknown,
): string | undefined {
  const id =
    component.executeId ??
    component.result?.executeId ??
    component.toolCallId ??
    component.result?.toolCallId;
  if (typeof id === 'string' && id) {
    return id;
  }

  // 实时 SSE 已以 requestId 作为 ASK_QUESTION 的 toolCallId；历史恢复需保持一致。
  const requestId = getRecord(input)?.requestId;
  return typeof requestId === 'string' && requestId ? requestId : undefined;
}

function readComponentStatus(component: McpAskExecutedComponent): string {
  return String(component.status ?? component.result?.status ?? '')
    .trim()
    .toLowerCase();
}

export function isMcpAskFailedComponent(
  component: McpAskExecutedComponent,
): boolean {
  const status = readComponentStatus(component);
  return (
    status === 'failed' ||
    status === 'error' ||
    component.success === false ||
    component.result?.success === false
  );
}

export function resolveMcpAskHydratedResponseStatus(
  component: McpAskExecutedComponent,
): McpAskInteraction['responseStatus'] {
  if (isMcpAskFailedComponent(component)) {
    return 'failed';
  }
  // ASK_QUESTION 的 component status(FINISHED/EXECUTING/SUCCESS)只代表「问」这一步完成,
  // 不代表用户已回答——回答由后续 resume 用户消息标志(reconcileMcpAskHydratedStatus 据此判 submitted)。
  // 默认 pending,让历史最后一条 ASK_QUESTION 能恢复渲染 dockpanel;reconcile 检测到 resume 才置 submitted(关闭)。
  return 'pending';
}
