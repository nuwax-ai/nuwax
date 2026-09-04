/**
 * 侧栏搜索框控制单例
 * @description 主导航改造（单栏模式）后，搜索入口收进侧栏顶栏 icon（⌘K 同效）。
 * 搜索框在 NewHomeSection 内默认隐藏，通过本单例跨组件「展开并聚焦」；
 * 搜索框只在会话域挂载，因此用模块级单例注册（沿用 componentCache 模式）。
 */

type SidebarSearchController = () => void;

let controller: SidebarSearchController | null = null;

/**
 * 注册搜索框控制器（NewHomeSection 挂载时调用）：展开搜索框并聚焦
 * @returns 取消注册函数
 */
export const registerSidebarSearch = (fn: SidebarSearchController) => {
  controller = fn;
  return () => {
    if (controller === fn) {
      controller = null;
    }
  };
};

/**
 * 展开（或收起）并聚焦侧栏搜索框
 * @returns 是否成功（未注册说明当前不在会话域，搜索框不存在）
 */
export const toggleSidebarSearch = (): boolean => {
  if (!controller) {
    return false;
  }
  controller();
  return true;
};
