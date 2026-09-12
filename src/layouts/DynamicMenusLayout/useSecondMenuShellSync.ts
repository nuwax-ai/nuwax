/**
 * 二级菜单列 ↔ nuwaclaw 壳同步 hook（ClassicLayout / SidebarNavLayout 双布局单源，
 * 2026-09-12 抽取；此前两布局各持一份逐字节相同的双 effect）。
 *
 * - available：当前页是否有二级菜单——壳工具栏据此显隐「收起二级列」按钮；
 *   布局卸载时 cleanup 推 false，防按钮残留可用态
 * - collapsed：二级列真实收起态——webview reload 后壳本地态不重置、reload 瞬间的
 *   toggle 命令可能丢失，推送真实值可校正失同步
 * 浏览器端接入层 no-op。路由切换间 cleanup→mount 的瞬时 false 会被新值立即覆盖。
 */
import { useEffect } from 'react';

import { nuwaClawHost } from '@/utils/nuwaClawBridge';

export function useSecondMenuShellSync(available: boolean, collapsed: boolean) {
  useEffect(() => {
    nuwaClawHost.layout.setSecondMenuAvailable(available);
    return () => nuwaClawHost.layout.setSecondMenuAvailable(false);
  }, [available]);

  useEffect(() => {
    nuwaClawHost.layout.setSecondMenuCollapsed(collapsed);
  }, [collapsed]);
}
