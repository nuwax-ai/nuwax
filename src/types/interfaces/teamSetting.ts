import { TeamStatusEnum } from '@/types/enums/teamSetting';

// 更新团队空间入参
export interface UpdateSpaceTeamParams {
  id: number;
  name: string;
  description: string;
  icon: string;
  // 空间是否接收来自外部的发布
  receivePublish?: number;
  // 空间是否开启开发功能
  allowDevelop?: number;
}

// 指定空间信息返回数据
export interface TeamDetailInfo extends UpdateSpaceTeamParams {
  tenantId: number;
  creatorId: number;
  // 当前登录用户在空间的角色,可用值:Owner,Admin,User
  currentUserRole: TeamStatusEnum;
  created: string;
}

// 空间成员返回数据
export interface SpaceUserInfo {
  userId: number;
  spaceId: number;
  userName: string;
  nickName: string;
  avatar: string;
  role: TeamStatusEnum;
  created: string;
}

// 搜索成员返回数据
export interface SearchUserInfo {
  id: number;
  tenantId: number;
  userName: string;
  nickName: string;
  avatar: string;
  created: string;
  role: TeamStatusEnum;
}
