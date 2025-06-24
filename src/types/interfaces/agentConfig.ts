import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
  InvokeTypeEnum,
} from '@/types/enums/agent';
import type { CreateUpdateModeEnum, DataTypeEnum } from '@/types/enums/common';
import type { OpenCloseEnum, PluginSettingEnum } from '@/types/enums/space';
import type {
  AgentCardInfo,
  AgentComponentInfo,
  AgentConfigInfo,
  AgentStatisticsInfo,
  ComponentModelBindConfig,
  CreatorInfo,
  TriggerTimeZone,
} from '@/types/interfaces/agent';
import type {
  BindConfigWithSub,
  CreatedNodeItem,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type {
  AttachmentFile,
  ExecuteResultInfo,
} from '@/types/interfaces/conversationInfo';
import React, { MouseEvent } from 'react';
import { CardBindConfig } from './cardInfo';

// 智能体header组件
export interface AgentHeaderProps {
  agentConfigInfo?: AgentConfigInfo;
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
  agentId: number;
  agentConfigInfo?: AgentConfigInfo;
  // 修改智能体基础配置信息
  onChangeAgent: (value: string | string[], attr: string) => void;
}

// 组件设置弹窗
export interface ComponentSettingModalProps {
  open: boolean;
  currentComponentInfo?: AgentComponentInfo;
  variables?: BindConfigWithSub[];
  settingActionList?: { type: PluginSettingEnum; label: string }[];
  onCancel: () => void;
}

// 卡片绑定组件
export interface CardBindProps {
  loading?: boolean;
  agentCardList: AgentCardInfo[];
  componentInfo?: AgentComponentInfo;
  onSaveSet: (attr: string, value: CardBindConfig) => void;
}

// 智能体模型组件，插件、工作流、触发器等组件通用显示组件
export interface CollapseComponentItemProps {
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
  onCancel: (
    targetId: number,
    name: string,
    data: ComponentModelBindConfig,
  ) => void;
}

// 卡片设置组件
export interface CardModeSettingProps {
  cardKey?: string;
  list: AgentCardInfo[];
  onChoose: (info: AgentCardInfo) => void;
}

export interface BindDataSourceProps {
  cardInfo?: AgentCardInfo;
  componentInfo?: AgentComponentInfo;
  onSaveSet: (attr: string, value: CardBindConfig) => void;
}

// 调用方式保存形参
export interface InvokeTypeSaveParams {
  invokeType: InvokeTypeEnum;
  defaultSelected: DefaultSelectedEnum;
}

// 调用方式组件属性
export interface InvokeTypeProps {
  invokeType: InvokeTypeEnum;
  defaultSelected?: DefaultSelectedEnum;
  onSaveSet: (data: InvokeTypeSaveParams) => void;
}

// 异步运行保存形参
export interface AsyncRunSaveParams {
  async: DefaultSelectedEnum;
  asyncReplyContent: string;
}

// 异步运行组件属性
export interface AsyncRunProps {
  async: DefaultSelectedEnum;
  asyncReplyContent: string;
  onSaveSet: (data: AsyncRunSaveParams) => void;
}

// 预览与调试组件
export interface PreviewAndDebugHeaderProps {
  agentId: number;
  agentConfigInfo?: AgentConfigInfo;
  onExecuteResults?: (executeResults: ExecuteResultInfo[]) => void;
  onPressDebug: () => void;
}

// 智能体聊天记录为空组件 - 展示智能体信息
export interface AgentChatEmptyProps {
  className?: string;
  // 智能体图标
  icon?: string;
  // 智能体名称
  name: string;
  extra?: React.ReactNode;
}

// 会话建议列表
export interface RecommendListProps {
  className?: string;
  itemClassName?: string;
  loading?: boolean;
  chatSuggestList: string[];
  onClick: (message: string) => void;
}

// 长期记忆内容组件
export interface LongMemoryContentProps {
  openLongMemory?: OpenCloseEnum;
}

// 开场白组件
export interface OpenRemarksEditProps {
  agentConfigInfo?: AgentConfigInfo;
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
  node?: ExecuteResultInfo | null;
}

// 组件列表
export interface CollapseComponentListProps {
  textClassName?: string;
  type: AgentComponentTypeEnum;
  list: AgentComponentInfo[];
  onSet: (id: number) => void;
  onDel: (
    id: number,
    targetId: number,
    type: AgentComponentTypeEnum,
    toolName?: string,
  ) => void;
}

// 知识库文本列表组件
export interface KnowledgeTextListProps {
  textClassName?: string;
  list: AgentComponentInfo[];
  onDel: (id: number, targetId: number, type: AgentComponentTypeEnum) => void;
}

// 知识库设置组件
export interface KnowledgeSettingProps {
  open: boolean;
  agentComponentInfo?: AgentComponentInfo;
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

// 智能体分类项详细信息
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
  categoryItems: {
    [key: string]: CategoryItemInfo[];
  };
}

// 智能体添加组件状态
export interface AgentAddComponentStatusInfo {
  type: AgentComponentTypeEnum;
  targetId: number;
  status: AgentAddComponentStatusEnum;
  toolName?: string;
}

// 首页智能体列表项组件
export interface AgentItemProps {
  info: CategoryItemInfo;
  onItemClick: () => void;
  onToggleCollect: () => void;
}

// 创建变量弹窗组件
export interface CreateVariableModalProps {
  mode?: CreateUpdateModeEnum;
  currentVariable?: BindConfigWithSub | null;
  id: number;
  targetId: number;
  inputData: BindConfigWithSub[];
  open: boolean; // 控制弹窗的显示隐藏
  onCancel: () => void; // 取消按钮的回调函数
  onConfirm: (data: BindConfigWithSub[]) => void; // 确定按钮的回调函数，传入变量名称
}

// 可拖拽手动创建项组件的props
export interface DragManualCreateItemProps {
  value?: string;
  id: string; // 唯一标识符
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
}

// 插件绑定组件props
export interface PluginBindingProps {
  // 数据源类型,可用值:Agent,Plugin,Workflow,Knowledge,Table
  targetType?: AgentComponentTypeEnum;
  // 插件或工作流名称
  targetName?: string;
  // 插件或工作流图标
  targetIcon?: string;
  targetComponentInfo?: CreatedNodeItem | null; // 目标组件信息
  onClick: () => void; // 点击绑定事件
}
