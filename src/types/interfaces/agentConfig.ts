import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { DataTypeEnum } from '@/types/enums/common';
import type { OpenCloseEnum } from '@/types/enums/space';
import type {
  AgentCardInfo,
  AgentComponentInfo,
  AgentConfigInfo,
  AgentStatisticsInfo,
  BindConfigWithSub,
  CreatorInfo,
  TriggerTimeZone,
} from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  AttachmentFile,
  ExecuteResultInfo,
} from '@/types/interfaces/conversationInfo';
import React, { MouseEvent } from 'react';

// 智能体header组件
export interface AgentHeaderProps {
  agentConfigInfo: AgentConfigInfo;
  onToggleShowStand: () => void;
  onToggleVersionHistory: () => void;
  onEditAgent: () => void;
  onPublish: () => void;
}

// 编配title组件
export interface ArrangeTitleProps {
  icon?: string;
  modelName?: string;
  onClick: () => void;
}

// 智能体编排区域配置组件
export interface AgentArrangeConfigProps {
  spaceId: number;
  agentId: number;
  agentConfigInfo: AgentConfigInfo;
  // 修改智能体基础配置信息
  onChangeAgent: (value: string | string[], attr: string) => void;
}

// 插件模型设置
export interface PluginModelSettingProps {
  open: boolean;
  variables?: BindConfigWithSub[];
  onCancel: () => void;
}

// 参数设置组件
export interface ParamsSettingProps {
  variables?: BindConfigWithSub[];
}

// 智能体模型组件，插件、工作流、触发器等组件通用显示组件
export interface AgentModelComponentProps {
  agentComponentInfo: AgentComponentInfo;
  defaultImage?: string;
  extra?: React.ReactNode;
}

// 创建触发器组件
export interface CreateTriggerProps {
  agentId: number;
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// 触发器时区组件
export interface TimingTriggerProps {
  triggerTimeZone?: TriggerTimeZone;
}

// 触发器请求参数输入数据类型
export interface TriggerRequireInputType {
  key: React.Key;
  // 参数名称，符合函数命名规则
  name: string;
  // 参数详细描述信息
  description: string;
  // 数据类型
  dataType: DataTypeEnum;
  children?: TriggerRequireInputType[];
}

// 智能体模型设置弹窗组件
export interface AgentModelSettingProps {
  spaceId: number;
  modelComponentConfig: AgentComponentInfo;
  open: boolean;
  onCancel: () => void;
  onSelectMode: (value: number, label: string) => void;
}

// 卡片设置组件
export interface CardModeSettingProps {
  cardKey?: string;
  list: AgentCardInfo[];
  onChoose: (info: AgentCardInfo) => void;
}

// 预览与调试组件
export interface PreviewAndDebugHeaderProps {
  agentId: number;
  agentConfigInfo: AgentConfigInfo;
  onExecuteResults?: (executeResults: ExecuteResultInfo[]) => void;
  onPressDebug: () => void;
}

// 智能体聊天记录为空组件 - 展示智能体信息
export interface AgentChatEmptyProps {
  // 智能体图标
  icon?: string;
  // 智能体名称
  name: string;
}

// 会话建议列表
export interface RecommendListProps {
  className?: string;
  loading: boolean;
  chatSuggestList: string[];
  onClick: (message: string) => void;
}

// 长期记忆内容组件
export interface LongMemoryContentProps {
  openLongMemory?: OpenCloseEnum;
}

// 开场白组件
export interface OpenRemarksEditProps {
  agentConfigInfo: AgentConfigInfo;
  onChangeAgent: (value: string | string[], attr: string) => void;
}

// 变量列表组件
export interface VariableListProps {
  onClick: (e: MouseEvent) => void;
  list: BindConfigWithSub[];
}

// 聊天上传文件列表组件
export interface ChatUploadFileProps {
  files: UploadFileInfo[];
  onDel: (index: number) => void;
}

// 用户聊天上传文件列表组件
export interface AttachFileProps {
  files: AttachmentFile[];
}

// 调试详情组件
export interface DebugDetailsProps {
  visible?: boolean;
  onClose: () => void;
}

// 节点详情
export interface NodeDetailsProps {
  node?: ExecuteResultInfo;
}

// 知识库文本列表组件
export interface KnowledgeTextListProps {
  list: AgentComponentInfo[];
  onDel: (id: number) => void;
}

// 知识库设置组件
export interface KnowledgeSettingProps {
  open: boolean;
  agentComponentInfo: AgentComponentInfo;
  onCancel: () => void;
}

// 创建、更新变量弹窗组件
export interface CreateVariablesProps {
  open: boolean;
  variablesInfo: AgentComponentInfo;
  onCancel: () => void;
  onConfirm: () => void;
}

// 智能体分类信息
export interface CategoryInfo {
  name: string;
  type: string;
}

export interface CategoryItemInfo {
  targetType: AgentComponentTypeEnum;
  targetId: number;
  name: string;
  description: string;
  icon: string;
  statistics: AgentStatisticsInfo;
  publishUser: CreatorInfo;
  collect: boolean;
}

// 主页智能体分类列表
export interface HomeAgentCategoryInfo {
  // 首页分类
  categories: CategoryInfo[];
  // 首页分类数据列表
  categoryItems: unknown;
}
