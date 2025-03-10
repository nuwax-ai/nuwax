import type { RoleEnum, UserStatus } from '@/types/enums/common';
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
  id: number;
  tenantId: number;
  userName: string;
  nickName: string;
  avatar: string;
  password: string;
  // 判断用户是否设置过密码，如果未设置过，需要弹出密码设置框让用户设置密码
  resetPass: number;
  // 用户状态
  status: UserStatus;
  role: RoleEnum;
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

// 租户配置信息
export interface TenantConfigInfo {
  // 站点名称
  siteName: string;
  // 站点描述
  siteDescription: string;
  // 站点LOGO，为空使用现有默认的
  siteLogo: string;
  // 登录页banner
  loginBanner: string;
  // 登录页banner文案
  loginBannerText: string;
  // 广场Banner地址，为空使用现有默认的
  squareBanner: string;
  // 广场Banner文案标题
  squareBannerText: string;
  // 广场Banner文案副标题
  squareBannerSubText: string;
  // 广场Banner链接，如果链接不为空，点击跳转
  squareBannerLinkUrl: string;
  // 开启注册, 0 关闭；1 开启，如果为0，前端不展示注册入口
  openRegister: number;
  // 默认站点Agent
  defaultAgentId: number;
  // 首页会话框下的推荐问题
  homeRecommendQuestions: string[];
  // 站点域名
  domainNames: string[];
}