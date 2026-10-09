import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { resolveEffectiveSandboxId } from '@/utils/effectiveSandbox';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseChatSandboxProps {
  conversationId?: number;
  location: any;
  history: any;
  effectiveAgent: any;
  conversationInfo: ConversationInfo | undefined;
  hasPersistedMessage: boolean;
}

export const useChatSandbox = ({
  conversationId,
  location,
  history,
  effectiveAgent,
  conversationInfo,
  hasPersistedMessage,
}: UseChatSandboxProps) => {
  // 是否锁定电脑选择（仅在从 AgentDetails 页面带有 selectedComputerId 且为 PUSH 跳转时生效）
  const [isSelectionLocked, setIsSelectionLocked] = useState<boolean>(false);

  // 当前选中的电脑 ID（通用型智能体）
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');

  // 记录用户是否已发送消息（用于锁定电脑选择）
  const [hasUserSentMessage, setHasUserSentMessage] = useState<boolean>(false);
  const [
    hasChangedComputerInEmptySession,
    setHasChangedComputerInEmptySession,
  ] = useState(false);

  // 仅在本次会话中使用从 AgentDetails 页面带过来的 selectedComputerId；
  // 刷新（POP）或新建会话（REPLACE）时，不再沿用之前的选择。
  useEffect(() => {
    const passedDetails = location.state?.selectedComputerId;

    // PUSH: 正常跳转 (AgentDetails -> Chat)
    const isPushWithComputer = history.action === 'PUSH' && !!passedDetails;

    if (isPushWithComputer) {
      setSelectedComputerId(passedDetails);
      setIsSelectionLocked(true);
    } else {
      setSelectedComputerId('');
      setIsSelectionLocked(false);
    }
    setHasChangedComputerInEmptySession(false);
  }, [conversationId, history.action, location.key]);

  const handleComputerSelect = useCallback(
    (computerId: string) => {
      if (
        conversationInfo &&
        String(conversationInfo.id) === String(conversationId) &&
        !hasPersistedMessage &&
        !isSelectionLocked
      ) {
        setHasChangedComputerInEmptySession(true);
      }
      setSelectedComputerId(computerId);
    },
    [conversationId, conversationInfo, hasPersistedMessage, isSelectionLocked],
  );

  const getEffectiveSandboxId = useCallback(
    (info: ConversationInfo | undefined = conversationInfo): string => {
      // 已有会话按创建时记录的电脑执行；路由刚切换时忽略旧会话快照。
      const isCurrentConversation =
        conversationId !== undefined &&
        !!info &&
        String(info?.id) === String(conversationId);
      if (isCurrentConversation) {
        const sessionSandboxId = String(info?.sandboxServerId ?? '').trim();
        // 创建时的绑定不锁定空会话；首条消息前允许使用新选择的电脑。
        const canUseCurrentSelection =
          hasChangedComputerInEmptySession && selectedComputerId;
        if (sessionSandboxId && !canUseCurrentSelection) {
          return sessionSandboxId;
        }
      }

      // 四级取值链单源（bug 2451）：手动 > PUSH 携带 > 智能体绑定 > 共享电脑，
      // 详见 src/utils/effectiveSandbox.ts
      return resolveEffectiveSandboxId({
        selectedComputerId,
        pushStateComputerId:
          history.action === 'PUSH'
            ? location.state?.selectedComputerId
            : undefined,
        agentSandboxId: effectiveAgent?.sandboxId,
        sandboxServerId: isCurrentConversation
          ? info.sandboxServerId
          : undefined,
      });
    },
    [
      conversationId,
      hasChangedComputerInEmptySession,
      selectedComputerId,
      history.action,
      location.state?.selectedComputerId,
      effectiveAgent?.sandboxId,
      conversationInfo,
    ],
  );

  // 计算最终选中的沙盒ID
  const finalSelectedId = useMemo(() => {
    return getEffectiveSandboxId();
  }, [getEffectiveSandboxId]);

  return {
    selectedComputerId,
    setSelectedComputerId,
    isSelectionLocked,
    setIsSelectionLocked,
    hasUserSentMessage,
    setHasUserSentMessage,
    hasChangedComputerInEmptySession,
    handleComputerSelect,
    getEffectiveSandboxId,
    finalSelectedId,
  };
};
