/**
 * 登录链路后端原始报错的人话化转换（NW-049）。
 *
 * 验证码失效时后端只返回「校验参数异常」等面向开发的报错，且没有专用
 * 错误码可供判断，前端只能按「接口 + 文案特征」识别后转成可行动提示。
 * 仅对发码 / 验证码登录两个接口生效，避免吞掉其它业务的原始报错。
 */

/** 发送验证码（短信/邮箱）接口 */
const CODE_SEND_URL = '/api/user/code/send';
/** 验证码登录接口 */
const CODE_LOGIN_URL = '/api/user/codeLogin';

/** 验证码失效类原始报错特征（后端无专用 code，只能按文案识别） */
const CODE_INVALID_PATTERNS: RegExp[] = [
  /校验参数异常/,
  /参数校验(异常|失败)/,
  /验证码(已)?(失效|过期|错误)/,
  /invalid captcha/i,
  /captcha.*(invalid|expired)/i,
];

/** 判断报错文案是否属于验证码失效类（登录提交与发码共用判断） */
export const isLoginCodeInvalidError = (
  rawMessage?: string | null,
): boolean => {
  if (!rawMessage) return false;
  return CODE_INVALID_PATTERNS.some((pattern) => pattern.test(rawMessage));
};

/**
 * 登录链路接口的报错转用户可懂提示。
 * @returns 对应 i18n key；接口不在登录链路或文案未命中失效特征时返回 null（保持原文案）
 */
export const humanizeLoginError = (
  url?: string | null,
  rawMessage?: string | null,
): string | null => {
  if (!url || !isLoginCodeInvalidError(rawMessage)) return null;
  if (url.includes(CODE_LOGIN_URL)) {
    return 'PC.Pages.VerifyCode.codeInvalidTip';
  }
  if (url.includes(CODE_SEND_URL)) {
    return 'PC.Pages.VerifyCode.sendFailedRetry';
  }
  return null;
};
