import type { ConversationSessionViewInput } from '@/features/conversation/domain/sessionView';
import { TaskStatus } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

/**
 * 入口向会话构建器提供的 model 原始字段（不自行组合）。
 * 与主 model / UnifiedChatSession 既有 Props 一一对应。
 */
export interface ConversationSessionModelInput {
  conversationId?: number;
  messageList: MessageInfo[];
  /** model 原始流式活跃态（isConversationActive，不含后台任务态） */
  isConversationActive?: boolean;
  /** 本地聊天已发起但协议终态尚未到达 */
  isAwaitingChatTerminal?: boolean;
  /** conversationInfo?.taskStatus */
  taskStatus?: TaskStatus;
}

/**
 * 入口消费的标准会话 Props 形状（方案 §4 createConversationSessionModel：
 * 页面不再自行组合 active/task/terminal 判断，§2.3）。
 */
export interface ConversationSessionModelProps {
  /** 完整活跃（本地流式 或 后台任务执行中）：停止按钮 / 输入禁用等 UI 语义 */
  isConversationActive: boolean;
  /** 纯本地流式（不含后台任务态）：流式恢复 hook 的输入 */
  isLocallyStreaming: boolean;
  isAwaitingChatTerminal: boolean;
  /** Session View 的入口侧输入（队列/干预态由 UnifiedChatSession 内部合并） */
  sessionViewInput: ConversationSessionViewInput;
}

/**
 * 从 model 原始字段构建入口级会话 Props。
 *
 * 吸收的既有组合规则（冻结行为，逐字等价）：
 * - 完整活跃 = model 原始活跃 || taskStatus===EXECUTING（原 Chat 页合成逻辑）；
 * - 纯本地流式 = model 原始活跃（供 useConversationStreamResume）；
 * - sessionViewInput 携带原始维度，语义推导统一由 selectConversationSessionView 承载。
 */
export function createConversationSessionModel(
  input: ConversationSessionModelInput,
): ConversationSessionModelProps {
  const {
    conversationId,
    messageList,
    isConversationActive,
    isAwaitingChatTerminal,
    taskStatus,
  } = input;
  const locallyStreaming = Boolean(isConversationActive);
  const taskExecuting = taskStatus === TaskStatus.EXECUTING;

  return {
    isConversationActive: locallyStreaming || taskExecuting,
    isLocallyStreaming: locallyStreaming,
    isAwaitingChatTerminal: Boolean(isAwaitingChatTerminal),
    sessionViewInput: {
      conversationId,
      modelStreamActive: locallyStreaming,
      awaitingChatTerminal: Boolean(isAwaitingChatTerminal),
      taskStatus,
      messageList,
    },
  };
}
