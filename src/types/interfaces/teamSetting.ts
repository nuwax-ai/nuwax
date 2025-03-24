import { TeamStatusEnum } from '@/types/enums/teamSetting';

// 指定空间信息返回数据
export interface TeamDetailInfo {
  id: number;
  tenantId: number;
  name: string;
  description: string;
  icon: string;
  creatorId: number;
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

// 更新空间入参
export interface UpdateSpaceParams {
  id: number;
  name: string;
  description: string;
  icon: string;
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
