import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseChatSandboxProps {
  location: any;
  history: any;
  effectiveAgent: any;
  conversationInfo: ConversationInfo | undefined;
}

export const useChatSandbox = ({
  location,
  history,
  effectiveAgent,
  conversationInfo,
}: UseChatSandboxProps) => {
  // 是否锁定电脑选择（仅在从 AgentDetails 页面带有 selectedComputerId 且为 PUSH 跳转时生效）
  const [isSelectionLocked, setIsSelectionLocked] = useState<boolean>(false);

  // 当前选中的电脑 ID（通用型智能体）
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');

  // 记录用户是否已发送消息（用于锁定电脑选择）
  const [hasUserSentMessage, setHasUserSentMessage] = useState<boolean>(false);

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
  }, [history.action, location.key]);

  const getEffectiveSandboxId = useCallback(
    (info: ConversationInfo | undefined = conversationInfo) => {
      try {
        // 优先级 1: 手动选择 (selectedComputerId)
        if (selectedComputerId) {
          return selectedComputerId;
        }

        // 优先级 2: 兜底从 location.state 获取 (仅 PUSH 跳转)。
        // 解决首次加载发消息时，状态未及时更新导致获取到内置 sandboxId 的问题。
        if (history.action === 'PUSH' && location.state?.selectedComputerId) {
          return location.state.selectedComputerId;
        }

        // 优先级 3: 个人电脑 (sandboxId)
        if (effectiveAgent?.sandboxId) {
          return effectiveAgent.sandboxId;
        }

        // 优先级 4: 共享电脑 (sandboxServerId)
        const sandboxServerId = info?.sandboxServerId;
        if (sandboxServerId) {
          return String(sandboxServerId);
        }

        return '';
      } catch {
        return selectedComputerId;
      }
    },
    [
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
    getEffectiveSandboxId,
    finalSelectedId,
  };
};
