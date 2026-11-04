/**
 * L2「取昵称+设头像」引导的登录后触发门（对齐 App 端 profileSetupPrompt 登录门）。
 *
 * 产品口径：只在「刚完成登录」时判定一次（持久会话冷启动不弹、无冷却）。
 * 实现上用 sessionStorage 标记：navigateAfterLogin（密码/验证码/首设密码三条
 * 登录路径的共享终点）置标记，全局 Gate 在登录态就位后消费标记并判定。
 * sessionStorage 生命周期＝当前标签页会话：新标签页冷启动无标记，天然不弹。
 */

const PROFILE_SETUP_PENDING_KEY = 'nuwax.profile-setup-pending';

/** 登录流程收尾时调用：标记「刚完成登录」，供本轮会话内判定一次。 */
export function markLoginJustCompleted(): void {
  try {
    sessionStorage.setItem(PROFILE_SETUP_PENDING_KEY, '1');
  } catch {
    // 隐私模式等存储异常时静默放弃引导，不影响登录主流程
  }
}

/** 读取并清除标记。只在「刚完成登录」的会话内返回一次 true。 */
export function consumeLoginJustCompleted(): boolean {
  try {
    const marked = sessionStorage.getItem(PROFILE_SETUP_PENDING_KEY) === '1';
    if (marked) {
      sessionStorage.removeItem(PROFILE_SETUP_PENDING_KEY);
    }
    return marked;
  } catch {
    return false;
  }
}
