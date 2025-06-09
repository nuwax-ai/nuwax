import type { TaskStatus, TaskTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type {
  AgentDetailDto,
  AgentStatisticsInfo,
} from '@/types/interfaces/agent';
import type { ChatMessageDto } from '@/types/interfaces/conversationInfo';

// 智能体详情页侧边栏
export interface AgentSidebarProps {
  className?: string;
  agentId: number;
  loading?: boolean;
  agentDetail?: AgentDetailDto | null;
  onToggleCollectSuccess: (isCollect: boolean) => void;
}

// 定时任务组件属性
export interface TimedTaskProps {
  agentId: number;
}

// 定时任务列表组件属性
export interface TaskListProps {
  className?: string;
  loading?: boolean;
  taskStatus: TaskStatus;
  taskList: TimedConversationTaskInfo[];
  onCancelTask?: (info: TimedConversationTaskInfo) => void;
  onEditTask?: (info: TimedConversationTaskInfo) => void;
}

// 创建定时任务弹窗组件属性
export interface CreateTimedTaskProps {
  agentId: number;
  mode?: CreateUpdateModeEnum;
  open: boolean;
  // 当前任务信息
  currentTask?: TimedConversationTaskInfo;
  onCancel: () => void;
  onConfirm: () => void;
}

// 智能体内容
export interface AgentContentProps {
  agentDetail?: AgentDetailDto | null;
  onToggleCollectSuccess: (isCollect: boolean) => void;
}

// 统计信息
export interface StatisticsInfoProps {
  statistics?: AgentStatisticsInfo;
  onClose?: () => void;
  visible?: boolean;
}

// 智能体相关会话组件
export interface AgentConversationProps {
  agentId: number;
}

// 创建定时会话添加或更新请求参数
export interface CreateTimedConversationTaskDto {
  // 智能体ID
  agentId: number;
  // 开发模式
  devMode?: boolean;
  /**
   * 会话ID
   */
  id?: number;
  /**
   * 任务会话内容
   */
  summary: string;
  /**
   * 任务会话定时配置
   */
  taskCron: string;
  /**
   * 任务会话主题
   */
  topic: string;
}

/**
 * 定时会话任务信息
 */
export interface TimedConversationTaskInfo {
  /**
   * Agent信息，已发布过的agent才有此信息
   */
  agent?: AgentDetailDto;
  // 智能体ID
  agentId?: number;
  created?: string;
  devMode?: number;
  /**
   * 会话ID
   */
  id?: number;
  /**
   * 会话消息列表，会话列表查询时不会返回该字段值
   */
  messageList?: ChatMessageDto[];
  modified?: string;
  /**
   * 会话摘要，当开启长期记忆时，会对每次会话进行总结
   */
  summary?: string;
  // 任务会话定时配置
  taskCron?: string;
  taskCronDesc?: string;
  taskId?: string;
  // 任务状态
  taskStatus?: TaskStatus;
  tenantId?: number;
  /**
   * 会话主题
   */
  topic?: string;
  // 任务类型
  type?: TaskTypeEnum;
  /**
   * 会话UUID
   */
  uid?: string;
  userId?: number;
}

// 定时会话任务列表请求参数
export interface TimedConversationTaskParams {
  agentId: number;
  taskStatus: TaskStatus;
}

// 任务定时范围
export interface TaskCronInfo {
  /**
   * 具体类型下可选项
   */
  items: TaskCronItemDto[];
  /**
   * 类型，比如 每周 每月 每天
   */
  typeName: string;
}

/**
 *
 * CronItemDto
 */
export interface TaskCronItemDto {
  /**
   * cron表达式，传给后台
   */
  cron?: string;
  /**
   * cron描述
   */
  desc?: string;
}
