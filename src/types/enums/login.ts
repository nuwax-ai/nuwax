export enum LoginTypeEnum {
  // 密码登录
  Password,
  // 手机验证码登录、注册
  Code,
}

// 发送验证码枚举
export enum SendCodeEnum {
  LOGIN_OR_REGISTER = 'LOGIN_OR_REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
  BIND_EMAIL = 'BIND_EMAIL',
}
