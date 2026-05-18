import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { applyAcpPermissionSseEvent } from '../acp-permission/sse/apply-sse-event';
import { applyMcpAskToolCallSseEvent } from '../mcp-ask/sse/apply-tool-call-event';

/**
 * 统一处理 Agent 干预类 SSE（ACP 权限 + MCP Ask），对当前消息打补丁
 */
export function processInterventionSsePatch(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  return (
    applyAcpPermissionSseEvent(res, currentMessage) ??
    applyMcpAskToolCallSseEvent(res, currentMessage)
  );
}
