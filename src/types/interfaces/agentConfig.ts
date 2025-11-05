import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
  EventListEnum,
  HomeIndexEnum,
  InvokeTypeEnum,
  OutputDirectlyEnum,
  VisibleToLLMEnum,
} from '@/types/enums/agent';
import type { CreateUpdateModeEnum } from '@/types/enums/common';
import type { ComponentSettingEnum, OpenCloseEnum } from '@/types/enums/space';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type {
  AgentCardInfo,
  AgentComponentEventConfig,
  AgentComponentInfo,
  AgentConfigInfo,
  AgentStatisticsInfo,
  ComponentModelBindConfig,
  CreatorInfo,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import type {
  BindConfigWithSub,
  CreatedNodeItem,
  NativeUploadFile,
  VariableSelectConfig,
} from '@/types/interfaces/common';
import type {
  AttachmentFile,
  ExecuteResultInfo,
} from '@/types/interfaces/conversationInfo';
import React, { MouseEvent } from 'react';
import { CardBindConfig } from './cardInfo';
import { PageArgConfig } from './pageDev';

// 智能体header组件
export interface AgentHeaderProps {
  agentConfigInfo?: AgentConfigInfo;
  onToggleShowStand: () => void;
  onToggleVersionHistory: () => void;
  onEditAgent: () => void;
  onPublish: () => void;
  onOtherAction: (key: ApplicationMoreActionEnum) => void;
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
  onChangeAgent: (
    value: string | string[] | number | GuidQuestionDto[],
    attr: string,
  ) => void;
  onConfirmUpdateEventQuestions: (
    value: string | string[] | number | GuidQuestionDto[],
    attr: string,
  ) => void;
  // 插入系统提示词
  onInsertSystemPrompt?: (text: string) => void;
}

// 组件设置弹窗
export interface ComponentSettingModalProps {
  open: boolean;
  currentComponentInfo?: AgentComponentInfo;
  devConversationId?: number;
  variables?: BindConfigWithSub[];
  settingActionList?: { type: ComponentSettingEnum; label: string }[];
  onCancel: () => void;
}

// 页面设置弹窗Props
export interface PageSettingModalProps {
  open: boolean;
  currentComponentInfo?: AgentComponentInfo;
  allPageComponentList?: AgentComponentInfo[];
  onCancel: () => void;
}

// 卡片绑定保存形参
export interface CardBindSaveParams {
  cardBindConfig: CardBindConfig;
}

// 卡片绑定组件
export interface CardBindProps {
  loading?: boolean;
  agentCardList: AgentCardInfo[];
  componentInfo?: AgentComponentInfo;
  onSaveSet: (data: CardBindSaveParams) => void;
}

// 智能体模型组件，插件、工作流、触发器等组件通用显示组件
export interface CollapseComponentItemProps {
  className?: string;
  showImage?: boolean;
  agentComponentInfo: AgentComponentInfo;
  defaultImage?: string;
  extra?: React.ReactNode;
}

// 智能体模型设置弹窗组件
export interface AgentModelSettingProps {
  spaceId: number;
  modelComponentConfig: AgentComponentInfo;
  open: boolean;
  devConversationId?: number;
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
  onSaveSet: (data: CardBindSaveParams) => void;
}

// 参数保存形参
export interface ParamsSaveParams {
  inputArgBindConfigs: BindConfigWithSub[];
}

// 参数设置组件属性
export interface ParamsSettingProps {
  inputArgBindConfigs: BindConfigWithSub[];
  variables: BindConfigWithSub[];
  onSaveSet: (data: ParamsSaveParams) => void;
  style?: React.CSSProperties;
  scroll?: { y: number };
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

// 输出方式保存形参
export interface OutputDirectlyParams {
  directOutput: OutputDirectlyEnum;
}

// 输出方式组件属性
export interface OutputWayProps {
  directOutput: OutputDirectlyEnum;
  onSaveSet: (data: OutputDirectlyParams) => void;
}

// 页面是否模型可见组件属性
export interface VisibleToLLMProps {
  visibleToLLMType: VisibleToLLMEnum;
  onChangePageInfo: (attr: string, value: number) => void;
  onSaveSet: () => void;
}

// 是否为智能体页面首页组件属性
export interface HomeIndexProps {
  homeIndexType: HomeIndexEnum;
  onChangePageInfo: (attr: string, value: number) => void;
  onSaveSet: () => void;
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

// 异常处理保存形参
export interface ExceptionHandingSaveParams {
  exceptionOut: DefaultSelectedEnum;
  fallbackMsg: string;
}

// 异常处理组件属性
export interface ExceptionHandingProps {
  exceptionOut: DefaultSelectedEnum;
  fallbackMsg: string;
  onSaveSet: (data: ExceptionHandingSaveParams) => void;
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
  chatSuggestList: GuidQuestionDto[] | string[];
  onClick: (message: string) => void;
}

// 长期记忆内容组件
export interface LongMemoryContentProps {
  textClassName?: string;
  openLongMemory?: OpenCloseEnum;
}

// 开场白组件
export interface OpenRemarksEditProps {
  agentConfigInfo?: AgentConfigInfo;
  pageArgConfigs: PageArgConfig[];
  onChangeAgent: (
    value: string | string[] | GuidQuestionDto[],
    attr: string,
  ) => void;
  onConfirmUpdateEventQuestions: (
    value: string | string[] | number | GuidQuestionDto[],
    attr: string,
  ) => void;
}

// 开场白预置问题设置弹窗Props
export interface GuidQuestionSetModalProps {
  open: boolean;
  agentConfigInfo?: AgentConfigInfo;
  currentGuidQuestionDto?: GuidQuestionDto;
  pageArgConfigs: PageArgConfig[];
  onCancel: () => void;
  onConfirm: (result: GuidQuestionDto[]) => void;
  currentGuidQuestionDtoIndex: number;
}

// 页面路径选择框选项(自定义)
export interface PagePathSelectOption {
  label: string;
  value: string;
  pageUri: string;
  pageId?: number;
}

// 事件绑定弹窗Props
export interface EventBindModalProps {
  open: boolean;
  eventsInfo: AgentComponentInfo;
  currentEventConfig?: AgentComponentEventConfig;
  pageArgConfigs: PageArgConfig[];
  onCancel: () => void;
  onConfirm: () => void;
}

// 变量列表组件
export interface VariableListProps {
  textClassName?: string;
  onClick: (e: MouseEvent) => void;
  list: BindConfigWithSub[];
}

// 事件列表组件
export interface EventListProps {
  textClassName?: string;
  onClick: (
    item: AgentComponentEventConfig,
    action: EventListEnum,
    index: number,
  ) => void;
  list: AgentComponentEventConfig[];
}

// 聊天上传文件列表组件
export interface ChatUploadFileProps {
  files: NativeUploadFile[];
  onDel: (uid: string) => void;
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

// 正在删除组件信息
export interface DeleteComponentInfo {
  id: number;
  targetId: number;
  type: AgentComponentTypeEnum;
}

// 组件列表
export interface CollapseComponentListProps {
  textClassName?: string;
  itemClassName?: string;
  type: AgentComponentTypeEnum;
  list: AgentComponentInfo[];
  // 正在删除组件列表
  deleteList?: DeleteComponentInfo[];
  onSet: (id: number) => void;
  onDel: (
    id: number,
    targetId: number,
    type: AgentComponentTypeEnum,
    toolName?: string,
  ) => void;
}

// 分组MCP组件信息
export interface GroupMcpInfo {
  targetId: number;
  icon: string;
  groupName: string;
  groupDescription: string;
  children: AgentComponentInfo[];
}

// 分组MCP组件props
export interface McpGroupComponentItemProps {
  item: GroupMcpInfo;
  // 正在删除组件列表
  deleteList?: DeleteComponentInfo[];
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
  // 正在删除组件列表
  deleteList?: DeleteComponentInfo[];
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
  // ChatBot、PageApp
  agentType: 'ChatBot' | 'PageApp';
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

// 智能体添加组件基础信息
export interface AgentAddComponentBaseInfo {
  targetType: AgentComponentTypeEnum;
  targetId: number;
  toolName?: string;
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

// 变量数据绑定组件props
export interface VariableDataBindingProps {
  selectConfig?: VariableSelectConfig;
  targetComponentInfo?: CreatedNodeItem | null; // 目标组件信息
  onClick: () => void; // 点击绑定事件
}
