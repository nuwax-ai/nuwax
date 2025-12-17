import type {
  CreateUpdateModeEnum,
  PermissionsEnum,
  PublishStatusEnum,
} from '@/types/enums/common';
import type {
  ComponentTypeEnum,
  ModelComponentStatusEnum,
} from '@/types/enums/space';
import type { CreatorInfo } from '@/types/interfaces/agent';
import type {
  BindConfigWithSub,
  CustomPopoverItem,
} from '@/types/interfaces/common';
import type { ModelSaveParams } from '@/types/interfaces/model';
import type { PluginHttpUpdateParams } from '@/types/interfaces/plugin';
import React from 'react';

// 组件库单个组件项
export interface ComponentItemProps {
  componentInfo: ComponentInfo;
  onClick: () => void;
  onClickMore: (item: CustomPopoverItem) => void;
}

// 任务库单个任务项
export interface TaskItemProps {
  taskInfo: TaskInfo;
  onClick: () => void;
  onClickMore: (item: CustomPopoverItem) => void;
}

// 技能库单个技能项
export interface SkillItemProps {
  skillInfo: SkillInfo;
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
  type?: CreateUpdateModeEnum;
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
  label: React.ReactNode;
}

// 试运行弹窗组件属性
export interface PluginTryRunModalProps {
  inputConfigArgs: BindConfigWithSub[];
  inputExpandedRowKeys: React.Key[];
  pluginId: number;
  pluginName: string;
  open: boolean;
  onCancel: () => void;
}

// 自动解析弹窗
export interface PluginAutoAnalysisProps extends PluginTryRunModalProps {
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

// 添加定时任务传入参数
export interface AddTimedTaskParams {
  spaceId: number;
  targetType: string;
  targetId: string;
  taskName: string;
  cron: string;
  params: any;
}

// 添加技能传入参数
export interface AddSkillParams {
  spaceId: number;
  name: string;
  description: string;
  icon: string;
  files?: SkillFileInfo[];
}

// 更新技能传入参数
export interface UpdateSkillParams {
  id: number;
  name: string;
  description: string;
  icon: string;
  files?: SkillFileInfo[];
  // 发布状态,可用值:Developing,Applying,Published,Rejected
  publishStatus?: PublishStatusEnum;
}

// 更新工作流传入参数
export interface UpdateWorkflowParams {
  id: number;
  name: string;
  description: string;
  icon: string;
}

// 更新定时任务传入参数
export interface UpdateTimedTaskParams extends AddTimedTaskParams {
  id: number;
}

// 技能基础信息
export interface SkillBaseInfo {
  id: number;
  spaceId: number;
  name: string;
  description: string;
  icon: string;
}

// 更新、创建技能弹窗
export interface CreateSkillProps {
  type?: CreateUpdateModeEnum;
  skillInfo?: SkillInfo;
  spaceId?: number;
  id?: number;
  name?: string;
  description?: string;
  icon?: string;
  open: boolean;
  onCancel: () => void;
  onConfirm?: () => void;
}

// 添加技能传入参数
export interface AddSkillParams {
  spaceId: number;
  name: string;
  description: string;
  icon: string;
}

// 更新技能传入参数
export interface UpdateSkillParams {
  id: number;
  name: string;
  description: string;
  icon: string;
}

// 组件信息
export interface ComponentInfo {
  // 是否启用
  enabled?: ModelComponentStatusEnum;
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
  // 权限列表
  permissions?: PermissionsEnum[];
}

// 任务创建者信息
export interface TaskCreatorInfo {
  // 用户ID
  userId: number;
  // 用户名称
  userName: string;
  // 用户头像
  avatar: string;
}

// 任务信息
export interface TaskInfo {
  // 任务ID
  id: number;
  // 空间ID
  spaceId: number;
  // 目标名称
  targetName: string;
  // 目标图标
  targetIcon: string;
  // 目标类型
  targetType: string;
  // 目标ID
  targetId: string;
  // 任务名称
  taskName: string;
  // 定时任务
  cron: string;
  // 参数
  params: any;
  // 状态
  status: string;
  // 最新执行时间
  latestExecTime: string;
  // 锁定时间
  lockTime: string;
  // 执行次数
  execTimes: number;
  // 错误信息
  error: string;
  // 最后修改时间
  modified: string;
  // 创建时间
  created: string;
  // 创建者
  creator: TaskCreatorInfo;
}

// 技能文件信息
export interface SkillFileInfo {
  // 文件名称
  name: string;
  // 文件内容
  contents: string;
  // 重命名前的文件名
  renameFrom: string;
  // 操作类型
  operation: string;
}

// 技能查询过滤条件
export interface SkillQueryFilter {
  // 空间ID
  spaceId?: number;
  // 技能名称
  name?: string;
  // 发布状态
  publishStatus?: PublishStatusEnum[];
}

// 技能信息
export interface SkillInfo {
  // 技能 ID
  id: number;
  // 技能名称
  name: string;
  // 技能描述
  description: string;
  // 技能图标
  icon: string;
  // 文件内容列表
  files: SkillFileInfo[];
  // 发布状态，可用值：Developing, Applying, Published, Rejected
  publishStatus: PublishStatusEnum;
  // 租户 ID
  tenantId: number;
  // 空间 ID
  spaceId: number;
  // 创建时间
  created: string;
  // 创建人 ID
  creatorId: number;
  // 创建人名称
  creatorName: string;
  // 最后修改时间
  modified: string;
  // 最后修改人 ID
  modifiedId: number;
  // 最后修改人名称
  modifiedName: string;
}

// box组件
export interface BoxInfoProps {
  icon?: React.ReactNode;
  text: string;
}

// 复制参数
export interface CopyTableParams {
  tableId: number;
}
