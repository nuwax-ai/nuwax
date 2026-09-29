import type { AgentComponentTypeEnum } from '@/types/enums/agent';

/** scope 变更审核状态 */
export enum OAuth2ScopeApplyStatusEnum {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

/** 平台支持的 scope（设置页勾选） */
export interface OAuth2ScopeInfo {
  scope: string;
  description: string;
  /** 敏感能力 */
  sensitive: boolean;
}

/** 管理员审核列表项 */
export interface OAuth2ScopeApplyInfo {
  id: number;
  projectId: number;
  /** ThirdApp / UserApp */
  projectType: AgentComponentTypeEnum;
  projectName: string;
  clientId: string;
  applyUserId: number;
  /** 申请时已生效的 scope（空数组 = 平台默认 profile） */
  oldScopes: string[];
  /** 申请的目标 scope（空数组 = 清空回落平台默认） */
  scopes: string[];
  status: OAuth2ScopeApplyStatusEnum;
  reviewerId?: number;
  rejectReason?: string;
  reviewedAt?: string;
  created: string;
}

/** 审核列表查询（注意分页参数为 pageNo） */
export interface OAuth2ScopeApplyPageParams {
  pageNo: number;
  pageSize: number;
  queryFilter?: {
    status?: OAuth2ScopeApplyStatusEnum;
    projectId?: number;
  };
}
