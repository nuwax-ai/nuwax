export enum LoginTypeEnum {
  // 密码登录
  Password,
  // 手机验证码登录、注册
  Code,
}

export enum LoginMethodEnum {
  // 手机号码登录
  Phone,
  // 邮箱登录
  Email,
}

// 发送验证码枚举
export enum SendCodeEnum {
  LOGIN_OR_REGISTER = 'LOGIN_OR_REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
  BIND_EMAIL = 'BIND_EMAIL',
}
