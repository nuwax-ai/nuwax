import type {
  CreateUpdateModeEnum,
  PublishStatusEnum,
} from '@/types/enums/common';
import type { WorkflowModeEnum } from '@/types/enums/library';
import type { ComponentTypeEnum } from '@/types/enums/space';
import type { BindConfigWithSub, CreatorInfo } from '@/types/interfaces/agent';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ModelSaveParams } from '@/types/interfaces/model';
import type { PluginHttpUpdateParams } from '@/types/interfaces/plugin';
import React from 'react';
import { AgentComponentTypeEnum } from '../enums/agent';

// 组件库单个组件项
export interface ComponentItemProps {
  componentInfo: ComponentInfo;
  onClick: () => void;
  onClickMore: (item: CustomPopoverItem) => void;
}

// 工作流基础信息
export interface WorkflowBaseInfo {
  // 工作流ID
  id: number;
  spaceId: number;
  // 工作流名称
  name: string;
  // 工作流描述
  description: string;
  // 图标地址
  icon: string;
  extension: { size: number };
}

// 更新、创建工作流弹窗
export interface CreateWorkflowProps {
  type?: WorkflowModeEnum;
  spaceId?: number;
  id?: number;
  name?: string;
  description?: string;
  icon?: string;
  open: boolean;
  onCancel: () => void;
  onConfirm?: (info: WorkflowBaseInfo) => void;
}

// 新建、更新插件组件
export interface CreateNewPluginProps {
  spaceId?: number;
  id?: number;
  icon?: string;
  name?: string;
  description?: string;
  // 弹窗类型：新建、更新
  mode?: CreateUpdateModeEnum;
  open: boolean;
  onCancel: () => void;
  onConfirm?: (info: PluginHttpUpdateParams) => void;
}

// table头部header带*号标题
export interface LabelStarProps {
  className?: string;
  label: string;
}

// 试运行弹窗组件属性
export interface PluginTryRunModelProps {
  inputConfigArgs: BindConfigWithSub[];
  inputExpandedRowKeys: React.Key[];
  pluginId: number;
  pluginName: string;
  open: boolean;
  onCancel: () => void;
}

// 自动解析弹窗
export interface PluginAutoAnalysisProps extends PluginTryRunModelProps {
  onConfirm: (list: BindConfigWithSub[]) => void;
}

// 接口配置
export interface ModelConfigDataType {
  key: React.Key;
  url: string;
  // 接口密钥
  apikey: string;
  // 权重
  weight: string;
}

// 创建模型弹窗组件
export interface CreateModelProps {
  mode?: CreateUpdateModeEnum;
  id?: number;
  spaceId?: number;
  open: boolean;
  action?: (data: ModelSaveParams) => Promise<any>;
  onCancel: () => void;
  onConfirm: (info: ModelSaveParams) => void;
}

// 内网模型组件
export interface IntranetModelProps {
  onOpen: () => void;
}

// 添加工作流传入参数
export interface AddWorkflowParams {
  spaceId: number;
  name: string;
  description: string;
  icon: string;
}

// 更新工作流传入参数
export interface UpdateWorkflowParams {
  id: number;
  name: string;
  description: string;
  icon: string;
}

// 组件信息
export interface ComponentInfo {
  // 组件ID
  id: number;
  // 空间ID
  spaceId: number;
  // 组件类型,可用值:Variable,Workflow,Plugin,Model,KnowledgeBase,Table
  type: ComponentTypeEnum;
  // 组件名称
  name: string;
  // 	组件描述
  description: string;
  // 图标地址
  icon: string;
  // 发布状态，工作流、插件有效,可用值:Developing,Applying,Published,Rejected
  publishStatus: PublishStatusEnum;
  // 最后编辑时间
  modified: string;
  // 创建时间
  created: string;
  creatorId: number;
  // 创建者信息
  creator: CreatorInfo;
  // 扩展字段
  ext: any;
}

// box组件
export interface BoxInfoProps {
  icon?: React.ReactNode;
  text: string;
}

// 智能体、插件、工作流下架输入参数
export interface PublishedOffShelfParams {
  // 类型，智能体、插件、工作流可以下架,可用值:Agent,Plugin,Workflow,Knowledge,Table
  targetType: AgentComponentTypeEnum;
  // 智能体、插件或工作流ID
  targetId: number;
}

// 复制参数
export interface CopyTableParams {
  tableId: number;
}
