// 登录
import { SendCodeEnum } from '@/types/enums/login';

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
  resetPass: string;
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

// 滑动验证码弹窗类型
export type ModalSliderCaptchaType = {
  open: boolean;
  onCancel: (open: boolean) => void;
  onSuccess: () => void;
};
