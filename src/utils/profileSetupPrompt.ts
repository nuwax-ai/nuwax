/**
 * 新用户「取昵称+设头像」引导的触发判定（PC Web，对齐 App 端 profileSetupPrompt.uts）。
 *
 * 背景：注册默认 userName = user{数字}（后缀约 10 位，非登录接口返回的 19 位雪花 id），
 * 昵称为空时所有展示位回落到默认账号名。本模块判断「userName 仍是默认形态 且 昵称为空」
 * → 调用方弹引导窗。
 *
 * 产品口径（App 端 2026-10-21 确认，PC 对齐）：
 * - 弹窗内昵称、头像均可选，用户可随时关闭，不强制；
 * - 无冷却——每次登录进来都做同样判断；设置过昵称后条件天然不满足，不再弹
 *   （只设头像不设昵称的用户下次登录仍会弹，属预期）。
 */

export interface ProfileSetupUserLike {
  nickName?: string | null;
  userName?: string | null;
}

/** 后缀是否全为数字。 */
function isAllDigits(s: string): boolean {
  if (s.length === 0) return false;
  for (let i = 0; i < s.length; i++) {
    if (s.charAt(i) < '0' || s.charAt(i) > '9') return false;
  }
  return true;
}

/**
 * 默认 userName 判定：前缀 "user" + 纯数字后缀（宽松位数，App 端真机样本
 * userName="user1792564071"——后缀不是雪花 id，不能按 user{id} 全等匹配）。
 * 误判面仅剩「用户真名恰好是 user+纯数字且从未设昵称」，最坏多弹一次可跳过的引导。
 */
export function needsProfileSetup(user: ProfileSetupUserLike): boolean {
  const nick =
    user.nickName !== null && user.nickName !== undefined
      ? String(user.nickName).trim()
      : '';
  if (nick.length > 0) return false;
  const name =
    user.userName !== null && user.userName !== undefined
      ? String(user.userName).trim()
      : '';
  if (name.length <= 4) return false;
  if (name.substring(0, 4) !== 'user') return false;
  return isAllDigits(name.substring(4));
}
