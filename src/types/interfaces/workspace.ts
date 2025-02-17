import type { RoleEnum } from '@/types/enums/common';
import type { SpaceTypeEnum } from '@/types/enums/space';

// 创建新团队传入参数
export interface CreateSpaceTeamParams {
  name: string;
  description: string;
  icon: string;
}

// 更新新团队传入参数
export interface UpdateSpaceTeamParams extends CreateSpaceTeamParams {
  id: number;
}

// 删除工作空间
export interface DeleteSpaceParams {
  spaceId: string;
}

// 查询团队成员列表接口
export type UserSpaceListParams = DeleteSpaceParams;

// 查询指定空间信息
export type UserSpaceInfoParams = DeleteSpaceParams;

// 用户工作空间信息
export interface SpaceInfo {
  // 空间ID
  id: string;
  // 租户ID
  tenantId: string;
  name: string;
  description: string;
  icon: string;
  // 空间类型
  type: SpaceTypeEnum;
  creatorId: string;
  modified: string;
  created: string;
}

// 增加团队成员输入参数
export interface AddSpaceUserParams {
  spaceId: string;
  userId: string;
  role: string;
}

export interface UserSpaceInfo {
  userId: string;
  userName: string;
  nickName: string;
  avatar: string;
  spaceId: string;
  role: RoleEnum;
  modified: string;
  created: string;
}

// 空间转让接口传入参数
export interface TransferSpaceParams {
  spaceId: string;
  // 目标用户ID
  targetUserId: string;
}
