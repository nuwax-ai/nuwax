import type { PublishStatusEnum } from '@/types/enums/common';
import type { SquareAgentTypeEnum } from '@/types/enums/square';
import { UserRoleEnum } from '@/types/enums/systemManage';

// 查询发布审核输入参数
export interface PublishApplyListParams {
  pageNo: number;
  pageSize: number;
  queryFilter: {
    targetType: string | undefined;
    publishStatus: string | undefined;
    kw: string;
  };
}

// 查询发布审核返回数据
export interface PublishApplyListInfo {
  id: number;
  targetId: number;
  spaceId: number;
  name: string;
  targetType: SquareAgentTypeEnum;
  description: string;
  remark: string;
  publishStatus: PublishStatusEnum;
  created: string;
  applyUser: {
    userName: string;
    nickName: string;
    role: UserRoleEnum;
  };
}

// 查询已发布管理输入参数
export interface PublishListParams {
  pageNo: number;
  pageSize: number;
  queryFilter: {
    targetType: string | undefined;
    kw: string;
  };
}

// 查询已发布管理返回数据
export interface PublishListInfo {
  id: number;
  spaceId: number;
  name: string;
  targetType: SquareAgentTypeEnum;
  targetId: number;
  description: string;
  remark: string;
  created: string;
  applyUser: {
    userName: string;
    nickName: string;
    role: UserRoleEnum;
  };
}
