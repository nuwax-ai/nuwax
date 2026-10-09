import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildDesktopShellPreviewUrl,
  canUseDesktopShellPreview,
  DESKTOP_SHELL_PREVIEW_PARAM,
  DESKTOP_SHELL_PREVIEW_ROUTE,
  DESKTOP_SHELL_VIEWPORT_PRESETS,
  emitDesktopShellPreviewHostCommand,
  getDesktopShellPreviewPlatform,
  isDesktopShellPreviewPage,
  parseDesktopShellPreviewPlatform,
  resetDesktopShellPreviewRuntimeForTest,
  setDesktopShellPreviewHostCommandHandler,
  subscribeDesktopShellPreviewLayoutState,
  updateDesktopShellPreviewLayoutState,
} from './desktopShellPreview';

describe('desktopShellPreview', () => {
  afterEach(() => {
    resetDesktopShellPreviewRuntimeForTest();
  });

  it('只解析三个受支持的桌面平台', () => {
    expect(
      parseDesktopShellPreviewPlatform(
        `?${DESKTOP_SHELL_PREVIEW_PARAM}=windows`,
      ),
    ).toBe('windows');
    expect(
      parseDesktopShellPreviewPlatform(`?${DESKTOP_SHELL_PREVIEW_PARAM}=macos`),
    ).toBe('macos');
    expect(
      parseDesktopShellPreviewPlatform(
        `?${DESKTOP_SHELL_PREVIEW_PARAM}=android`,
      ),
    ).toBeUndefined();
  });

  it('构造同源目标 URL，保留业务参数并移除独立窗口标记', () => {
    const url = new URL(
      buildDesktopShellPreviewUrl({
        targetPath: '/space/752/mcp?owner=me&_shell=1',
        platform: 'linux',
        origin: 'http://localhost:3000',
      }),
    );

    expect(url.origin).toBe('http://localhost:3000');
    expect(url.pathname).toBe('/space/752/mcp');
    expect(url.searchParams.get('owner')).toBe('me');
    expect(url.searchParams.get('_shell')).toBeNull();
    expect(url.searchParams.get(DESKTOP_SHELL_PREVIEW_PARAM)).toBe('linux');
  });

  it('拒绝外站和递归预览路径，并提供客户端最小尺寸', () => {
    expect(
      new URL(
        buildDesktopShellPreviewUrl({
          targetPath: 'https://example.com/steal',
          platform: 'windows',
          origin: 'http://localhost:3000',
        }),
      ).pathname,
    ).toBe('/home');
    expect(
      new URL(
        buildDesktopShellPreviewUrl({
          targetPath: '/desktop-shell-preview',
          platform: 'macos',
          origin: 'http://localhost:3000',
        }),
      ).pathname,
    ).toBe('/home');
    expect(DESKTOP_SHELL_VIEWPORT_PRESETS[0]).toEqual({
      label: '客户端最小',
      width: 1200,
      height: 720,
    });
  });

  it('只把开发预览控制台视为公共工具页，iframe 业务路由仍需鉴权', () => {
    expect(canUseDesktopShellPreview()).toBe(true);
    window.history.replaceState({}, '', DESKTOP_SHELL_PREVIEW_ROUTE);
    expect(isDesktopShellPreviewPage()).toBe(true);

    window.history.replaceState(
      {},
      '',
      `/space/752/mcp?${DESKTOP_SHELL_PREVIEW_PARAM}=windows`,
    );
    expect(isDesktopShellPreviewPage()).toBe(false);
  });

  it('SPA 切换菜单丢失 query 后仍保持当前 iframe 的预览平台', () => {
    window.history.replaceState(
      {},
      '',
      `/space/752/mcp?${DESKTOP_SHELL_PREVIEW_PARAM}=windows`,
    );
    expect(getDesktopShellPreviewPlatform()).toBe('windows');

    window.history.replaceState({}, '', '/space/752/skill-manage');
    expect(getDesktopShellPreviewPlatform()).toBe('windows');
  });

  it('预览标题栏与页面布局双向同步折叠状态', () => {
    window.history.replaceState(
      {},
      '',
      `/space/752/mcp?${DESKTOP_SHELL_PREVIEW_PARAM}=windows`,
    );
    const commandHandler = vi.fn();
    const layoutListener = vi.fn();
    setDesktopShellPreviewHostCommandHandler(commandHandler);
    const unsubscribe = subscribeDesktopShellPreviewLayoutState(layoutListener);

    updateDesktopShellPreviewLayoutState({
      secondMenuAvailable: true,
      secondMenuCollapsed: false,
    });
    emitDesktopShellPreviewHostCommand({
      type: 'toggle-second-menu',
      collapsed: true,
    });

    expect(layoutListener).toHaveBeenLastCalledWith({
      secondMenuAvailable: true,
      secondMenuCollapsed: false,
    });
    expect(commandHandler).toHaveBeenCalledWith({
      type: 'toggle-second-menu',
      collapsed: true,
    });
    unsubscribe();
  });
});
