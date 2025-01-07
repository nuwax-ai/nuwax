// 登录
export type LoginFieldType = {
  username: string;
  areaCode: string;
  password?: string;
};

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
