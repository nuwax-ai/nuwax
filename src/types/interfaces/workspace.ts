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

// 用户工作空间信息
export interface SpaceInfo {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  icon: string;
  type: string;
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
