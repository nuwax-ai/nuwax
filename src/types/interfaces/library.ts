import type { PublishStatusEnum } from '@/types/enums/common';
import type { PluginModeEnum, WorkflowModeEnum } from '@/types/enums/library';
import { CodeLangEnum } from '@/types/enums/plugin';
import type { ComponentTypeEnum } from '@/types/enums/space';
import type { CreatorInfo } from '@/types/interfaces/agent';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import React from 'react';

// 组件库单个组件项
export interface ComponentItemProps {
  ComponentInfo: ComponentInfo;
  onClick: () => void;
  onClickMore: (type: CustomPopoverItem) => void;
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
  onConfirm: (data: WorkflowBaseInfo) => void;
}

// 新建、更新插件组件
export interface CreateNewPluginProps {
  spaceId?: number;
  pluginId?: number;
  icon?: string;
  name?: string;
  description?: string;
  // 插件类型,可用值:HTTP,CODE
  type?: PluginModeEnum;
  // 插件代码语言,可用值:Python,JavaScript
  codeLang?: CodeLangEnum;
  open: boolean;
  onCancel: () => void;
  onConfirmCreate?: (id: number) => void;
  onConfirmUpdate?: () => void;
}

// 入参与出参共有配置数据类型
export interface ConfigDataType {
  key: React.Key;
  // 参数名称
  paramName: string;
  // 参数描述
  desc: string;
  // 参数类型
  paramType: number;
  // 开启
  open: boolean;
}

// 出参配置数据类型
export interface OutputConfigDataType extends ConfigDataType {
  children?: OutputConfigDataType[];
}

// 入参配置数据类型(插件基于云端代码js、python创建)
export interface InputConfigCloudDataType extends ConfigDataType {
  // 是否必须
  mustNot: boolean;
  // 默认值
  default: string;
  children?: InputConfigCloudDataType[];
}

// 入参配置数据类型(插件基于http创建)
export interface InputConfigDataType extends ConfigDataType {
  // 传入方式
  afferentMode: number;
  // 是否必须
  mustNot: boolean;
  // 默认值
  default: string;
  children?: InputConfigDataType[];
}

// table头部header带*号标题
export interface LabelStarProps {
  label: string;
}

// 试运行弹窗组件属性
export interface TryRunModelProps {
  open: boolean;
  onCancel: () => void;
}

// 试运行~table出参配置数据类型
export interface tryOutputConfigDataType {
  key: React.Key;
  // 参数名称
  paramName: string;
  // 参数值
  desc: string;
  children?: tryOutputConfigDataType[];
}

// 接口配置
export interface ModelConfigDataType {
  key: React.Key;
  url: string;
  apikey: string;
  // 权重
  weight: string;
}

// 创建模型弹窗组件
export interface CreateModelProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
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
  // 组件类型,可用值:Workflow,Plugin,Model,KnowledgeBase,Database
  type: ComponentTypeEnum;
  // 组件名称
  name: string;
  // 	组件描述
  description: string;
  // 图标地址
  icon: string;
  // 发布状态，工作流、插件有效,可用值:Developing,Applying,Published,Rejected
  publishStatus: PublishStatusEnum;
  modified: string;
  // 创建时间
  created: string;
  creatorId: number;
  // 创建者信息
  creator: CreatorInfo;
  // 扩展字段
  ext: string;
}

// box组件
export interface BoxInfoProps {
  icon?: React.ReactNode;
  text: string;
}
