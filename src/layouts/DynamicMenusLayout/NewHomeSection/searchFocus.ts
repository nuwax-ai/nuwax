/**
 * 侧栏搜索框聚焦单例
 * @description 主导航改造（单栏模式）后，侧栏顶部「搜索」入口与 ⌘K 快捷键
 * 需要跨组件聚焦 NewHomeSection 内的搜索框；搜索框只在会话域挂载，
 * 因此用模块级单例注册（沿用 NewHomeSection componentCache 的模式）。
 */

let focusFn: (() => void) | null = null;

/**
 * 注册聚焦函数（NewHomeSection 挂载时调用）
 * @returns 取消注册函数
 */
export const registerSidebarSearchFocus = (fn: () => void) => {
  focusFn = fn;
  return () => {
    if (focusFn === fn) {
      focusFn = null;
    }
  };
};

/**
 * 聚焦侧栏搜索框
 * @returns 是否成功（未注册说明当前不在会话域，搜索框不存在）
 */
export const focusSidebarSearch = (): boolean => {
  if (!focusFn) {
    return false;
  }
  focusFn();
  return true;
};
