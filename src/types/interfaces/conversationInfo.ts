import type {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
  TaskStatus,
  TaskTypeEnum,
} from '@/types/enums/agent';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { MessageStatusEnum } from '@/types/enums/common';
import { ProcessingEnum } from '@/types/enums/common';
import type { OpenCloseEnum } from '@/types/enums/space';
import type {
  AgentCardInfo,
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
  AgentStatisticsInfo,
  BindConfigWithSub,
  CreatorInfo,
} from '@/types/interfaces/agent';
import { CardBindConfig, CardDataInfo } from '@/types/interfaces/cardInfo';

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
  think: string;
  time: number;
  // 可用值:CHAT,GUID,QUESTION,ANSWER
  type: MessageModeEnum;
}

// 会话调用插件、工作流等的过程数据
export interface ProcessingData {
  targetId: number;
  name: string;
  type: AgentComponentTypeEnum;
  status: ProcessingEnum;
  result: {
    id: number;
    name: string;
    type: AgentComponentTypeEnum;
    success: boolean;
    error: string;
    data: unknown;
    startTime: number;
    endTime: number;
    input: {
      query: string;
    };
  };
  // 卡片绑定配置信息
  cardBindConfig: CardBindConfig;
  // 卡片数据
  cardData: CardDataInfo[] | CardDataInfo;
}

// 调试结果
export interface ExecuteResultInfo {
  data: unknown;
  error: string;
  id: number;
  icon: string;
  // 可能是字符串，也可能是object，需要根据具体情况处理
  input: unknown;
  name: string;
  startTime: number;
  endTime: number;
  success: boolean;
  type: AgentComponentTypeEnum;
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
  data:
    | ConversationChatMessage
    | ConversationFinalResult
    | ProcessingData
    | any;
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

// 会话参数
export interface ConversationChatParams {
  // 会话唯一标识
  conversationId: number;
  // 变量参数，前端需要根据agent配置组装参数
  variableParams?: Record<string, string | number>;
  // chat消息
  message: string;
  // 附件列表
  attachments: AttachmentFile[];
  // 是否调试模式
  debug: boolean;
  selectedComponents: AgentSelectedComponentInfo[];
}

// 临时会话参数
export interface TempConversationChatParams {
  // 链接Key
  chatKey: string;
  // 会话唯一标识
  conversationUid: string;
  variableParams?: Record<string, string | number> | null;
  // chat消息
  message: string;
  // 附件列表
  attachments: AttachmentFile[];
  selectedComponents: AgentSelectedComponentInfo[];
}

// 智能体会话问题建议输入参数
export interface ConversationChatSuggestParams extends ConversationChatParams {
  // 变量参数，前端需要根据agent配置组装参数
  variableParams?: {
    [key: string]: any;
  };
}

// 创建会话输入参数
export interface ConversationCreateParams {
  // 智能体ID
  agentId: number;
  // 开发模式
  devMode: boolean;
  variables?: Record<string, string | number> | null;
}

// 消息查询过程信息
export interface ProcessingInfo {
  cardBindConfig: AgentCardInfo;
  name: string;
  result: ExecuteResultInfo;
  status: ProcessingEnum;
  targetId: number;
  type: AgentComponentTypeEnum;
}

// 消息问答扩展信息
export interface MessageQuestionExtInfo {
  uuid: string;
  index: string;
  content: string;
  nextNodeIds: string;
}

// 会话消息列表，会话列表查询时不会返回该字段值
export interface ChatMessageDto {
  // 消息ID
  id: number | string;
  // assistant 模型回复；user 用户消息,可用值:USER,ASSISTANT,SYSTEM,FUNCTION
  role: AssistantRoleEnum;
  // 可用值:CHAT,THINK,GUID,QUESTION,ANSWER
  type?: MessageModeEnum;
  // 消息内容，其中附件放在.*?标签中
  text?: string;
  // 思考内容
  think?: string;
  // 消息时间
  time: string;
  // 消息附件
  attachments?: AttachmentFile[];
  // 消息问答扩展信息
  ext?: MessageQuestionExtInfo[];
  finished?: boolean;
  metadata?: unknown;
  // 可用值:USER,ASSISTANT,SYSTEM,TOOL
  messageType: MessageTypeEnum;
}

// 会话消息信息
export interface MessageInfo extends ChatMessageDto {
  // 消息状态，可选值为 loading | incomplete | complete | error
  status?: MessageStatusEnum;
  // 自定义添加字段：chat 会话结果
  finalResult?: ConversationFinalResult;
  // 消息查询过程信息
  processingList?: ProcessingInfo[];
}

// 查询会话信息
export interface ConversationInfo {
  // 会话ID
  id: number;
  tenantId: number;
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
  variables?: Record<string, string | number> | null;
  // Agent信息，已发布过的agent才有此信息
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
    // 可手动选择的组件列表
    manualComponents: AgentManualComponentInfo[];
    // 发布备注信息
    remark: string;
    // 智能体发布时间
    publishDate: string;
    // 智能体发布修改时间
    modified: string;
    // 智能体发布创建时间
    created: string;
    // 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
    statistics: AgentStatisticsInfo;
    // 发布者信息
    publishUser: CreatorInfo;
    // 智能体分类名称
    category: string;
    // 是否开启问题建议,可用值:Open,Close
    openSuggest: OpenCloseEnum;
    // 开场白文案
    openingChatMsg: string;
    // 引导问题
    openingGuidQuestions: string[];
    // 是否开启定时任务,可用值:Open,Close
    openScheduledTask: OpenCloseEnum;
    variables: BindConfigWithSub[];
    // 分享链接
    shareLink: string;
    collect: boolean;
  };
  // 会话消息列表，会话列表查询时不会返回该字段值
  messageList: MessageInfo[];
  // 可用值:Chat,TASK
  type: TaskTypeEnum;
  taskId: string;
  // 可用值:EXECUTING,CANCEL
  taskStatus: TaskStatus;
  taskCron: string;
  taskCronDesc: string;
  // 开发模式
  devMode: boolean;
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
  user?: ChatUserInfo;
  assistant: ChatUserInfo;
  system: ChatUserInfo;
}

// 聊天框组件
export interface ChatViewProps {
  className?: string;
  contentClassName?: string;
  // 消息信息
  messageInfo: MessageInfo;
  // 角色信息
  roleInfo: RoleInfo;
  // 聊天框底部样式 none: 不显示底部 home: 聊天主页底部 chat: 智能体编排页底部
  mode?: 'none' | 'home' | 'chat';
}

// 卡片信息
export interface CardInfo {
  image: string;
  title: string;
  content: string;
  // 卡片key值
  cardKey: string;
  // 跳转url
  bindLinkUrl: string;
}

// 聊天框底部更多操作组件
export interface ChatSampleBottomProps {
  messageInfo: MessageInfo;
}
