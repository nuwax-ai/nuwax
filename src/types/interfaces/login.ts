import type { SendCodeEnum } from '@/types/enums/login';

// 账号密码登录请求参数
export type LoginFieldType = {
  phone: string;
  areaCode: string;
  password?: string;
};

// 登录响应数据
export interface ILoginResult {
  token: string;
  expireDate: string;
  resetPass: number;
}

// 发送验证码
export interface SendCode {
  type: SendCodeEnum;
  phone: string;
  email?: string;
  // 验证票据
  ticket?: string;
}

// 验证码登录请求参数
export interface CodeLogin {
  phone: string;
  code: string;
}

// 首次登录设置密码
export interface SetPasswordParams {
  password: string;
}

// 设置密码
export type SetPasswordFieldType = {
  password: string;
  confirmPassword: string;
};

// 绑定邮箱输入参数
export interface BindEmailParams {
  email: string;
  code: string;
}

// 更新用户信息
export interface UserUpdateParams {
  userName: string;
  nickName: string;
  avatar: string;
}

// 重置密码
export interface ResetPasswordParams {
  newPassword: string;
  code: string;
}

export interface UserInfo {
  id: string;
  tenantId: string;
  userName: string;
  nickName: string;
  avatar: string;
  password: string;
  resetPass: number;
  // 用户状态
  status: string;
  role: string;
  email: string;
  phone: string;
  lastLoginTime: string;
  created: string;
  modified: string;
}

// 滑动验证码弹窗类型
export type ModalSliderCaptchaType = {
  open: boolean;
  onCancel: (open: boolean) => void;
  onSuccess: () => void;
};
