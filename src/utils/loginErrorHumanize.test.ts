import { describe, expect, it } from 'vitest';
import {
  humanizeLoginError,
  isLoginCodeInvalidError,
} from './loginErrorHumanize';

describe('登录链路验证码失效报错识别', () => {
  it.each([
    '校验参数异常',
    '参数校验失败',
    '验证码已失效',
    '验证码过期',
    '验证码错误',
    'Invalid captcha',
    'captcha expired',
  ])('后端原始报错「%s」命中失效特征', (rawMessage) => {
    expect(isLoginCodeInvalidError(rawMessage)).toBe(true);
  });

  it.each(['', null, undefined, '发送过于频繁', '账号或密码错误', '网络超时'])(
    '非失效类报错「%s」不命中',
    (rawMessage) => {
      expect(isLoginCodeInvalidError(rawMessage)).toBe(false);
    },
  );
});

describe('登录链路报错人话化转换', () => {
  it('验证码登录接口的失效报错转为引导重新获取的提示', () => {
    expect(humanizeLoginError('/api/user/codeLogin', '校验参数异常')).toBe(
      'PC.Pages.VerifyCode.codeInvalidTip',
    );
  });

  it('发码接口的失效报错转为引导重新发送的提示', () => {
    expect(
      humanizeLoginError(
        'https://nuwax.example/api/user/code/send',
        '校验参数异常',
      ),
    ).toBe('PC.Pages.VerifyCode.sendFailedRetry');
  });

  it.each([
    ['/api/user/code/send', '发送过于频繁'],
    ['/api/user/passwordLogin', '校验参数异常'],
    [null, '校验参数异常'],
    ['/api/user/codeLogin', ''],
  ])('接口 %s 的报错「%s」保持原文案不转换', (url, rawMessage) => {
    expect(humanizeLoginError(url, rawMessage)).toBeNull();
  });
});
