import type { TeamStatusEnum } from '@/types/enums/teamSetting';

export type SpaceInviteRole = TeamStatusEnum.User | TeamStatusEnum.Admin;
export type SpaceInviteStatus = 'Active' | 'Expired' | 'Disabled';

export interface CreateSpaceInviteParams {
  spaceId: number;
  role: SpaceInviteRole;
  /** 不传表示永久有效。 */
  expire?: string;
}

export interface SpaceInvite {
  id: number;
  spaceId: number;
  inviteCode: string;
  inviteUrl: string;
  role: SpaceInviteRole;
  expire: string | null;
  status: SpaceInviteStatus;
  inviterId: number;
  inviterName: string | null;
  created: string;
}

export interface SpaceInviteInfo {
  status: SpaceInviteStatus;
  /** 只有 Active 状态才返回团队详情。 */
  spaceId: number | null;
  spaceName: string | null;
  spaceIcon: string | null;
  inviterName: string | null;
  role: SpaceInviteRole | null;
  expire: string | null;
  joined: boolean;
}
