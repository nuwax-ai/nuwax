import { AgentComponentTypeEnum } from '../enums/agent';
import { PermissionsEnum, PublishStatusEnum } from '../enums/common';

// 技能文件
export interface SkillFileInfo {
  // 文件ID (自定义，初始值时name的值)
  fileId?: string;
  // 文件名称
  name: string;
  // 文件内容
  contents: string;
  /** 重命名之前的文件名（仅在重命名场景下使用） */
  renameFrom?: string;
  // 操作类型
  operation?: 'create' | 'delete' | 'rename' | 'modify';
  // 是否为文件夹
  isDir?: boolean;
}

// 技能详情
export interface SkillDetailInfo {
  // 技能ID
  id: number;
  // 技能分类
  category?: string;
  // 技能名称
  name: string;
  // 技能描述
  description: string;
  // 技能图标
  icon: string;
  // 文件内容
  files: SkillFileInfo[];
  // 发布状态,可用值:Developing,Applying,Published,Rejected
  publishStatus: PublishStatusEnum;
  // 租户ID
  tenantId: number;
  // 空间ID
  spaceId: number;
  // 技能创建时间
  created: string;
  // 创建人ID
  creatorId: number;
  // 创建人名称
  creatorName: string;
  // 	更新时间
  modified: string;
  // 最后修改人ID
  modifiedId: number;
  // 最后修改人名称
  modifiedName: string;
  // 权限列表
  permissions: PermissionsEnum[];
}

// 修改技能
export interface SkillUpdateParams {
  id: number;
  name?: string;
  description?: string;
  icon?: string;
  // 文件内容
  files?: SkillFileInfo[];
  // 发布状态,可用值:Developing,Applying,Published,Rejected
  publishStatus?: PublishStatusEnum;
}

// 导入技能
export interface SkillImportParams {
  file: any;
  targetSkillId: string;
  targetSpaceId: string;
}

// 上传技能文件
export interface SkillUploadFileParams {
  file: any;
  skillId: string;
  filePath: string;
}

// 已发布技能列表接口
export interface PublishedSkillListParams {
  // 目标类型，Agent,Plugin,Workflow,可用值:Agent,Plugin,Workflow,Knowledge,Table,Skill
  targetType?: AgentComponentTypeEnum;
  // 页码，从1开始
  page: number;
  // 每页数量
  pageSize: number;
  // 分类名称
  category: string;
  // 关键字搜索
  kw?: string;
  // 空间ID（可选）需要通过空间过滤时有用
  spaceId?: number;
  // 只返回空间的组件
  justReturnSpaceData?: boolean;
}
