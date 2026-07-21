import type { UnifiedAgentInfo } from '@/components/business-component/UnifiedChatSession/types';
import {
  AssistantRoleEnum,
  DefaultSelectedEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { AgentTypeEnum } from '@/types/enums/space';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

/** 演示用会话 ID */
export const DEMO_CONVERSATION_ID = 900001;

/** 演示用 Agent 信息（与真实 Agent 会话框配置字段对齐） */
export const DEMO_AGENT_INFO: UnifiedAgentInfo = {
  id: DEMO_CONVERSATION_ID,
  name: '语音交互演示 Agent',
  type: AgentTypeEnum.ConversationAgent,
  allowChooseMode: DefaultSelectedEnum.Yes,
  hasPermission: true,
  openingChatMsg:
    '这是真实 Agent 会话输入框的演示环境。点击发送按钮左侧的麦克风开始录音；录音结束后可选择「停止回填」或「停止发送」。',
};

/** 开场推荐问题 */
export const DEMO_SUGGEST_LIST = [
  '语音回填和自动发送有什么区别？',
  '帮我用一句话说明当前需求',
];

let messageSeq = 1;

/** 创建一条演示用用户消息 */
export const createUserMessage = (text: string): MessageInfo => {
  const id = messageSeq++;
  return {
    id,
    index: id,
    role: AssistantRoleEnum.USER,
    messageType: MessageTypeEnum.USER,
    text,
    time: new Date().toISOString(),
    componentExecutedList: [],
    tenantId: 1,
    senderType: 'USER',
    senderId: 'demo-user',
    userId: 1,
    agentId: DEMO_CONVERSATION_ID,
    status: MessageStatusEnum.Complete,
  };
};

/** 创建一条演示用助手回复（Mock，不请求后端） */
export const createAssistantReply = (userText: string): MessageInfo => {
  const id = messageSeq++;
  return {
    id,
    index: id,
    role: AssistantRoleEnum.ASSISTANT,
    messageType: MessageTypeEnum.ASSISTANT,
    text: `（演示回复）已收到你的消息：「${userText}」。真实环境中这里会由 Agent 流式返回。`,
    time: new Date().toISOString(),
    componentExecutedList: [],
    tenantId: 1,
    senderType: 'AGENT',
    senderId: 'demo-agent',
    userId: 1,
    agentId: DEMO_CONVERSATION_ID,
    status: MessageStatusEnum.Complete,
  };
};
