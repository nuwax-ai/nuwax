import type { RequestResponse } from './request';

export interface DeveloperAccount {
  id?: number;
  tenantId?: number;
  userId?: number;
  email?: string;
  phone?: string;
  realName?: string;
  idCardNo?: string;
  idCardFrontPhotoUrl?: string;
  idCardBackPhotoUrl?: string;
  bankName?: string;
  branchName?: string;
  bankCardNo?: string;
  created?: string;
  modified?: string;
}

export type DeveloperAccountResponse = RequestResponse<DeveloperAccount>;
