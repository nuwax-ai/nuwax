import { UserRoleEnum, UserStatusEnum } from '@/types/enums/systemManage';

// 查询用户列表输入参数
export interface SystemUserListParams {
  pageNo: number;
  pageSize: number;
  queryFilter: {
    role?: string;
    userName?: string;
  };
}

// 查询用户列表返回数据
export interface SystemUserListInfo {
  // 主键id
  id: number;
  // 昵称
  nickName: string;
  // 用户名
  userName: string;
  // 手机号码
  phone: string;
  // 邮箱
  email: string;
  // 角色
  role: UserRoleEnum;
  // 状态
  status: UserStatusEnum;
  // 加入时间
  created: string;
}
