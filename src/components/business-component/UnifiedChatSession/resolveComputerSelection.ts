import { CLOUD_SANDBOX_ID } from '@/constants/workspaceDirPolicy.constants';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { isRealAgentSandboxBinding } from '@/utils/effectiveSandbox';

interface ResolveComputerSelectionParams {
  conversationId?: number;
  conversationInfo?: Pick<ConversationInfo, 'id' | 'sandboxServerId'> | null;
  restoreConversationSandbox: boolean;
  selectedComputerId: string;
  agentSandboxId?: string | number;
  isSelectionLocked: boolean;
  hasUserSentMessage: boolean;
  hasPersistedMessage: boolean;
}

/** 历史会话的电脑以会话记录为准；其他入口保留原有的智能体绑定规则。 */
export function resolveComputerSelection({
  conversationId,
  conversationInfo,
  restoreConversationSandbox,
  selectedComputerId,
  agentSandboxId,
  isSelectionLocked,
  hasUserSentMessage,
  hasPersistedMessage,
}: ResolveComputerSelectionParams) {
  const hasCurrentConversationInfo =
    restoreConversationSandbox &&
    conversationId !== undefined &&
    conversationInfo !== null &&
    conversationInfo !== undefined &&
    String(conversationInfo.id) === String(conversationId);

  if (hasCurrentConversationInfo) {
    const savedId = String(conversationInfo.sandboxServerId ?? '').trim();
    return {
      agentSandboxId: savedId || selectedComputerId,
      fixedSelection: Boolean(savedId),
      isPersonalComputer: Boolean(savedId) && savedId !== CLOUD_SANDBOX_ID,
    };
  }

  const isAgentSandboxBound = isRealAgentSandboxBinding(agentSandboxId);
  return {
    agentSandboxId: isAgentSandboxBound ? agentSandboxId : selectedComputerId,
    fixedSelection:
      isAgentSandboxBound ||
      isSelectionLocked ||
      hasUserSentMessage ||
      hasPersistedMessage,
    isPersonalComputer: isAgentSandboxBound,
  };
}
