import type {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import type { MessageStatusEnum } from '@/types/enums/common';
import type {
  AgentStatisticsInfo,
  CreatorInfo,
} from '@/types/interfaces/agent';

// 会话聊天消息
export interface ConversationChatMessage {
  attachments?: AttachmentFile[];
  ext: string;
  // 是否完成
  finished: boolean;
  // 唯一标识
  id: string;
  // 可用值:USER,ASSISTANT,SYSTEM,TOOL
  messageType: MessageTypeEnum;
  metadata: object;
  // assistant 模型回复；user 用户消息,可用值:USER,ASSISTANT,SYSTEM,FUNCTION
  role: AssistantRoleEnum;
  text: string;
  time: number;
  // 可用值:CHAT,GUID,QUESTION,ANSWER
  type: MessageModeEnum;
}

// 调试结果
export interface ExecuteResultInfo {
  data: unknown;
  endTime: string;
  error: string;
  id: number;
  input: unknown;
  name: string;
  startTime: string;
  success: boolean;
  type: string;
}

// 会话聊天"FINAL_RESULT", 用于会话底部显示时间
export interface ConversationFinalResult {
  completionTokens: number;
  componentExecuteResults: ExecuteResultInfo[];
  endTime: number;
  error: string;
  outputText: string;
  promptTokens: number;
  startTime: number;
  success: boolean;
  totalTokens: number;
}

// 会话聊天响应数据
export interface ConversationChatResponse {
  completed: boolean;
  data: ConversationChatMessage | ConversationFinalResult;
  error: string;
  eventType: ConversationEventTypeEnum;
  requestId: string;
}

// 附加文件信息
export interface AttachmentFile {
  fileKey: string;
  // 文件URL
  fileUrl: string;
  // 文件名
  fileName: string;
  // 文件类型
  mimeType: string;
}

// 会话输入参数
export interface ConversationChatParams {
  // 会话唯一标识
  conversationId: number;
  // 变量参数，前端需要根据agent配置组装参数
  variableParams: object;
  // chat消息
  message: string;
  // 附件列表
  attachments: AttachmentFile[];
  // 是否调试模式
  debug: boolean;
}

// 智能体会话问题建议输入参数
export type ConversationChatSuggestParams = ConversationChatParams;

// 创建会话输入参数
export interface ConversationCreateParams {
  // 智能体ID
  agentId: number;
  // 开发模式
  devMode: boolean;
}

// 会话消息信息
export interface MessageInfo {
  // assistant 模型回复；user 用户消息,可用值:USER,ASSISTANT,SYSTEM,FUNCTION
  role: AssistantRoleEnum;
  // 可用值:CHAT,GUID,QUESTION,ANSWER
  type?: MessageModeEnum;
  // 消息内容，其中附件放在.*?标签中
  text?: string;
  // 消息时间
  time: string;
  attachments?: AttachmentFile[];
  id: number;
  metadata?: unknown;
  // 可用值:USER,ASSISTANT,SYSTEM,TOOL
  messageType: MessageTypeEnum;
  // 消息状态，可选值为 loading | incomplete | complete | error
  status?: MessageStatusEnum;
  // 自定义添加字段：chat 会话结果
  finalResult?: ConversationFinalResult;
}

// 查询会话信息
export interface ConversationInfo {
  // 会话ID
  id: number;
  userId: number;
  // 会话UUID
  uid: string;
  // 智能体ID
  agentId: number;
  // 会话主题
  topic: string;
  // 会话摘要，当开启长期记忆时，会对每次会话进行总结
  summary: string;
  modified: string;
  created: string;
  agent: {
    spaceId: number;
    // 目标对象（智能体、工作流、插件）ID,可用值:Agent,Plugin,Workflow,Knowledge
    targetType: string;
    // 目标对象（智能体、工作流、插件）ID
    targetId: number;
    // 发布名称
    name: string;
    // 描述
    description: string;
    // 图标
    icon: string;
    remark: string;
    // 智能体发布修改时间
    modified: string;
    // 智能体发布创建时间
    created: string;
    // 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
    statistics: AgentStatisticsInfo;
    // 发布者信息
    publishUser: CreatorInfo;
    // 分类名称
    category: string;
    collect: boolean;
  };
  // 会话消息列表，会话列表查询时不会返回该字段值
  messageList: MessageInfo[];
}

// 查询用户历史会话输入参数
export interface ConversationListParams {
  agentId: number;
}

// 聊天用户信息
export interface ChatUserInfo {
  name: string;
  avatar: string;
}

// 角色信息
export interface RoleInfo {
  user: ChatUserInfo;
  assistant: ChatUserInfo;
  system: ChatUserInfo;
}

// 聊天框组件
export interface ChatViewProps {
  messageInfo: MessageInfo;
  roleInfo: RoleInfo;
  onDebug?: () => void;
}
