import { UserStatus } from '@/types/enums/common';
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
  creatorName?: string;
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

/** 搜索用户返回数据（/api/user/search） */
export interface SearchUserInfo {
  /** 用户ID */
  id: number;
  /** 用户唯一标识 */
  uid?: string;
  /** 商户ID */
  tenantId?: number;
  /** 用户名 */
  userName: string;
  /** 用户昵称 */
  nickName?: string;
  /** 用户头像 */
  avatar?: string | null;
  /** 用户密码 */
  password?: string | null;
  /** 是否设置过密码；未设置时需要弹出密码设置框 */
  resetPass?: number;
  /** 用户状态,可用值:Enabled,Disabled,Deleted */
  status?: UserStatus | null;
  /** 角色,可用值:Admin,User */
  role?: TeamStatusEnum;
  /** 邮箱 */
  email?: string | null;
  /** 手机号码 */
  phone?: string | null;
  /** 最后登录时间 */
  lastLoginTime?: string;
  /** 最近的语言环境 */
  lang?: string | null;
  /** 创建时间 */
  created?: string;
  /** 更新时间 */
  modified?: string;
  /** 语言环境对应的值，仅类型为 System */
  langMap?: Record<string, string> | null;
}
