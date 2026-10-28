import { COUNT_DOWN_LEN } from '@/constants/common.constants';

/** 与页面倒计时一致：同一账号 60 秒内只允许成功发起一次发码，刷新和重新进入也算 */
const COOLDOWN_MS = COUNT_DOWN_LEN * 1000;

const storageKey = (account: string) => `nuwax:verify-code-sent-at:${account}`;

/** 距离下次可发码还要等多久。0 表示现在可以发。 */
export function getVerifyCodeCooldownRemaining(account: string): number {
  const sentAt = Number(sessionStorage.getItem(storageKey(account)));
  if (!sentAt) return 0;
  const remaining = COOLDOWN_MS - (Date.now() - sentAt);
  return remaining > 0 ? remaining : 0;
}

/** 发码请求发出前占住冷却，避免刷新抢在响应回来之前再发一次 */
export function markVerifyCodeSent(account: string): void {
  sessionStorage.setItem(storageKey(account), String(Date.now()));
}

/** 发码失败时放开冷却，允许用户立即重试 */
export function clearVerifyCodeSent(account: string): void {
  sessionStorage.removeItem(storageKey(account));
}
