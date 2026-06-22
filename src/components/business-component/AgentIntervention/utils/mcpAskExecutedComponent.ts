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
  return isMcpAskCompletedComponent(component) ? 'submitted' : 'pending';
}
