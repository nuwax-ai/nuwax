/**
 * 工作台页历史栈兜底（仅单栏 style3 生效）
 * @description 单栏模式下全屏工作台页（fullscreenWorkbenchPaths）的返回走真实
 * 浏览器历史（history.back）。当工作台页是标签页历史栈首条（直开 URL / 新标签 /
 * 桌面壳会话恢复 / 登录 redirect）时，back 无路可退会表现为「点击无反应」——
 * 本模块在栈底垫一条 /home，保证 back/forward（含桌面壳前进后退按钮）始终有路。
 * 经典风格（style1/2）与移动端的 bare 全屏形态不参与：返回逻辑与栈行为保持原样。
 */
import { unifiedThemeService } from '@/services/unifiedThemeService';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { isDesktopHost } from '@/utils/hostBridge';
import { shouldSeedWorkbenchHistoryBase } from './fullscreenWorkbenchPaths';

/** 栈底兜底目标：主界面 */
export const WORKBENCH_HISTORY_BASE_URL = '/home';

/** 启动期（router history 创建前）的实际导航风格是否为单栏 */
const isStyle3AtBoot = (): boolean => {
  // 商业桌面端（Nuwax webview）锁定单栏，直接认定；社区宿主走 localStorage 链
  if (isDesktopHost()) return true;
  try {
    // 服务构造时已同步解析完 localStorage 优先级链（用户 > 租户 > 默认）
    return (
      unifiedThemeService.getCurrentData().navigationStyle ===
      ThemeNavigationStyleType.STYLE3
    );
  } catch {
    // 解析异常时宁可不种：漏种仅剩 layout 层补网（多一次闪切），误种会影响
    // 经典风格直开行为
    return false;
  }
};

let bootSeeded = false;

/**
 * 启动期种子：直开工作台 URL 时用原生 history 在栈底垫 /home
 * （replaceState + pushState，当前 URL 不变）。
 * 必须在 umi router history 创建前执行（app.ts 顶部首个 import 的模块副作用），
 * router 之后照常以当前条目初始化——零闪烁、零重挂，back 落 /home、forward 回工作台。
 * 仅单栏风格执行；经典风格直开行为保持原样。
 */
export const seedWorkbenchHistoryBaseAtBoot = (): void => {
  if (bootSeeded) return;
  if (
    !shouldSeedWorkbenchHistoryBase(
      window.location.pathname,
      window.history.length,
    )
  )
    return;
  if (!isStyle3AtBoot()) return;

  bootSeeded = true;
  const { href } = window.location;
  window.history.replaceState(null, '', WORKBENCH_HISTORY_BASE_URL);
  window.history.pushState(null, '', href);
};

seedWorkbenchHistoryBaseAtBoot();
