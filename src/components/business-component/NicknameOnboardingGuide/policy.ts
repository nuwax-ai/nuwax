/**
 * 默认名用户首登昵称/头像引导 —— 判定与会话级跳过策略（纯函数，无 umi 依赖，可单测）
 *
 * 业务口径（2026-10 规划 7.3）：
 * - 判定：用户名仍是注册默认名形态（user 前缀 + 数字，由后端注册时生成；
 *   前端无法精确核对数字段即 userId，按形态匹配）且昵称为空；
 * - 非必填、可跳过、不拦主流程：跳过/完成后仅本次浏览器会话
 *   （sessionStorage，关标签页即失效）不再弹；下次登录会话条件仍满足
 *   会再次引导；完成设置后判定条件不再满足，永久不再触发。
 */

/** 昵称长度上限（规划已定 50 字） */
export const NICKNAME_MAX_LENGTH = 50;

/** 默认名形态：user 前缀 + 纯数字（如 user1024）；大小写不敏感 */
const DEFAULT_USERNAME_PATTERN = /^user\d+$/i;

/** 昵称校验错误类型（组件层映射为对应 i18n 提示文案） */
export type NicknameValidationError = 'required' | 'tooLong' | null;

/** 判定用户名是否仍是注册默认名形态（user+数字 id） */
export const isDefaultUserName = (
  userName?: string | null,
): boolean =>
  DEFAULT_USERNAME_PATTERN.test(String(userName ?? '').trim());

/** 判定昵称是否未设置（空或仅空白字符） */
export const isBlankNickname = (nickName?: string | null): boolean =>
  !String(nickName ?? '').trim();

/**
 * 引导触发判定：默认名 + 空昵称才弹。
 * 用户信息未加载（null/undefined）一律不弹，避免登录前误触发。
 */
export const shouldShowNicknameOnboarding = (
  userInfo?: {
    userName?: string | null;
    nickName?: string | null;
  } | null,
): boolean => {
  if (!userInfo) return false;
  return (
    isDefaultUserName(userInfo.userName) && isBlankNickname(userInfo.nickName)
  );
};

/**
 * 校验昵称输入：trim 后非空、不超上限。
 * 「超长」分支兜底绕过输入框 maxLength 的场景（如脚本赋值/自动填充），
 * 常规键入由 Input maxLength 在 UI 层先行截断。
 */
export const validateNickname = (
  raw?: string | null,
): NicknameValidationError => {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return 'required';
  if (trimmed.length > NICKNAME_MAX_LENGTH) return 'tooLong';
  return null;
};

// —— 会话级跳过标记 ——

const SKIP_STORAGE_KEY_PREFIX = 'NICKNAME_ONBOARDING_SKIPPED';

/** 跳过标记按用户 id 隔离：同标签页切换账号不互相误伤 */
export const getSkipStorageKey = (
  userId?: number | string | null,
): string => `${SKIP_STORAGE_KEY_PREFIX}_${userId ?? 'anonymous'}`;

/** 本会话是否已跳过/已完成引导 */
export const isOnboardingSkippedThisSession = (
  userId?: number | string | null,
): boolean => {
  try {
    return sessionStorage.getItem(getSkipStorageKey(userId)) === '1';
  } catch {
    // 隐私模式等存储异常时按未跳过处理，不影响主流程
    return false;
  }
};

/** 标记本会话已跳过/已完成引导 */
export const markOnboardingDoneThisSession = (
  userId?: number | string | null,
): void => {
  try {
    sessionStorage.setItem(getSkipStorageKey(userId), '1');
  } catch {
    // 存储异常时静默降级：最坏情况是本会话条件仍满足时再弹一次
  }
};
