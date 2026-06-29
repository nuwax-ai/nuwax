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
  };
};

export function getMcpAskComponentInput(
  component: McpAskExecutedComponent,
): unknown {
  return component.input ?? component.result?.input;
}

export function getMcpAskComponentToolCallId(
  component: McpAskExecutedComponent,
): string | undefined {
  const id =
    component.executeId ??
    component.result?.executeId ??
    component.toolCallId ??
    component.result?.toolCallId;
  return typeof id === 'string' && id ? id : undefined;
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

/**
 * 持久化 tool call 已成功结束，说明 ask-question 已被用户处理过。
 */
export function isMcpAskCompletedComponent(
  component: McpAskExecutedComponent,
): boolean {
  if (isMcpAskFailedComponent(component)) {
    return false;
  }

  const status = readComponentStatus(component).toUpperCase();
  if (
    status === 'SUCCESS' ||
    status === 'FINISHED' ||
    status === 'COMPLETED' ||
    status === 'SUCCEEDED'
  ) {
    return true;
  }

  return component.success === true || component.result?.success === true;
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
