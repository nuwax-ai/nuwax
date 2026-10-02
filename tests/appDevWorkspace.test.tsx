import AppDevRemoteDesktopPanel from '@/pages/AppDevPro/components/AppDevRemoteDesktopPanel';
import AppDevWorkspacePanels, {
  type AppDevWorkspacePanel,
} from '@/pages/AppDevPro/components/AppDevWorkspacePanels';
import {
  getToolTabId,
  usePreviewTabs,
} from '@/pages/AppDevPro/ConversationAgentFilePreview/hooks/usePreviewTabs';
import {
  PREVIEW_TOOL_DEFINITIONS,
  type PreviewToolId,
} from '@/pages/AppDevPro/ConversationAgentFilePreview/previewToolDefinitions';
import { useAppDevWorkspace } from '@/pages/AppDevPro/hooks/useAppDevWorkspace';
import type { AppDevWorkspaceView } from '@/pages/AppDevPro/workspaceDefinitions';
import { act, render, renderHook, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

const { mountVnc, unmountVnc } = vi.hoisted(() => ({
  mountVnc: vi.fn(),
  unmountVnc: vi.fn(),
}));

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/pages/AppDevPro/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/pages/AppDevPro/components/AppDevDatabasePanel/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/pages/AppDevPro/services/appDevPro', () => ({
  getUserAppVncProxyUrl: (appId: number) =>
    `/api/userapp/proxy/vnc/dev/${appId}/`,
}));
vi.mock('@/components/business-component/VncPreview', () => ({
  default: function MockVncPreview({
    cId,
    sourceUrl,
  }: {
    cId: number;
    sourceUrl: string;
  }) {
    useEffect(() => {
      mountVnc();
      return () => unmountVnc();
    }, []);
    return (
      <div data-testid="remote-vnc" data-cid={cId} data-source={sourceUrl} />
    );
  },
}));
vi.mock('@/pages/AppDevPro/components/AppDevStatusHero', () => ({
  default: () => <div data-testid="remote-starting" />,
}));

describe('AppDevPro 工作区选择', () => {
  it('数据库再次点击返回之前的视图，重新进入时重置管理页签', () => {
    const { result } = renderHook(useAppDevWorkspace);
    expect(result.current.workspaceView).toBe('app-preview');
    act(() => result.current.toggleWorkspace('database'));
    act(() => result.current.setDatabaseTabId(getToolTabId('database-config')));
    expect(result.current.workspaceViewRef.current).toBe('database');
    act(() => result.current.toggleWorkspace('database'));
    expect(result.current.workspaceView).toBe('app-preview');
    act(() => result.current.toggleWorkspace('database'));
    expect(result.current.databaseTabId).toBe(getToolTabId('database'));
    act(() => result.current.setWorkspaceView('files'));
    act(() => result.current.toggleWorkspace('database'));
    act(() => result.current.toggleWorkspace('database'));
    expect(result.current.workspaceView).toBe('files');
  });

  it('桌面返回数据库时保留数据库配置页；数据库仍能返回原始工作区', () => {
    const { result } = renderHook(useAppDevWorkspace);
    act(() => result.current.openWorkspace('database'));
    act(() => result.current.setDatabaseTabId(getToolTabId('database-config')));
    act(() => result.current.openWorkspace('remote-desktop'));
    act(() => result.current.toggleWorkspace('remote-desktop'));
    expect(result.current.workspaceView).toBe('database');
    expect(result.current.databaseTabId).toBe(getToolTabId('database-config'));
    act(() => result.current.toggleWorkspace('database'));
    expect(result.current.workspaceView).toBe('app-preview');
  });

  it('没有恢复记录时使用原默认值，setter 仍接受本机切换的 updater', () => {
    const { result } = renderHook(useAppDevWorkspace);
    act(() => result.current.setWorkspaceView('remote-desktop'));
    act(() => result.current.toggleWorkspace('remote-desktop'));
    expect(result.current.workspaceView).toBe('files');
    act(() => result.current.setWorkspaceView('database'));
    act(() => result.current.toggleWorkspace('database'));
    expect(result.current.workspaceView).toBe('app-preview');
    act(() => result.current.setWorkspaceView('remote-desktop'));
    act(() =>
      result.current.setWorkspaceView((current) =>
        current === 'remote-desktop' ? 'files' : current,
      ),
    );
    expect(result.current.workspaceViewRef.current).toBe('files');
  });

  it('切换环境强制进入数据库保留切换前视图，关闭旧页签的排队更新不会覆盖返回位置', () => {
    const { result } = renderHook(useAppDevWorkspace);
    act(() => result.current.setWorkspaceView('files'));
    act(() => result.current.openWorkspace('remote-desktop'));
    act(() => {
      // closeTab 可能激活剩余文件标签；原页面恢复 ref 读取本次 render 的视图。
      result.current.setWorkspaceView('files');
      result.current.openWorkspace('database');
    });
    expect(result.current.workspaceView).toBe('database');
    expect(result.current.databaseTabId).toBe(getToolTabId('database'));
    act(() => result.current.toggleWorkspace('database'));
    expect(result.current.workspaceView).toBe('remote-desktop');
    act(() => result.current.toggleWorkspace('remote-desktop'));
    expect(result.current.workspaceView).toBe('files');
  });
});

describe('AppDevPro 预览页签兼容', () => {
  it('工具定义提供标题，终端不创建页签，已有页签激活与关闭规则保持', () => {
    const onToolTabActivate = vi.fn();
    const workspaceToolIds: PreviewToolId[] = ['version-control'];
    const { result } = renderHook(() =>
      usePreviewTabs({ workspaceToolIds, onToolTabActivate }),
    );
    expect(onToolTabActivate).toHaveBeenCalledWith('version-control');
    act(() => result.current.openToolTab('terminal'));
    expect(result.current.tabs).toHaveLength(1);
    act(() => result.current.openToolTab('database-config'));
    expect(result.current.activeTab).toMatchObject({
      id: 'tool:database-config',
      label: 'PC.Pages.AppDevPro.databaseConfig',
    });
    expect(onToolTabActivate).toHaveBeenLastCalledWith('database-config');
    act(() => result.current.closeTab(getToolTabId('version-control')));
    expect(result.current.tabs).toHaveLength(2);
    act(() => result.current.closeTab(getToolTabId('database-config')));
    expect(result.current.activeTab?.toolId).toBe('version-control');
  });

  it('文件与 diff 标识、重命名和关闭恢复仍由原 hook 管理', () => {
    const onFileTabActivate = vi.fn();
    const workspaceToolIds: PreviewToolId[] = [];
    const { result } = renderHook(() =>
      usePreviewTabs({ workspaceToolIds, onFileTabActivate }),
    );
    act(() =>
      result.current.openFileTab('src/a.ts', false, { skipActivate: true }),
    );
    expect(onFileTabActivate).not.toHaveBeenCalled();
    act(() => result.current.openFileTab('src/a.ts', true));
    expect(onFileTabActivate).toHaveBeenCalledWith('src/a.ts', true);
    act(() => result.current.renameFileTab('src/a.ts', 'src/b.ts'));
    expect(result.current.tabs.map((tab) => tab.id)).toEqual([
      'file:src/b.ts',
      'diff:src/b.ts',
    ]);
    act(() => result.current.closeFileTabs('src', true));
    expect(result.current.tabs).toEqual([]);
    expect(result.current.activeTab).toBeNull();
  });

  it('工作区工具收起文件侧栏，其余旧工具打开文件预览', () => {
    const closeIds = Object.entries(PREVIEW_TOOL_DEFINITIONS)
      .filter(([, definition]) => definition.filePreview === 'close')
      .map(([toolId]) => toolId);
    expect(closeIds).toEqual([
      'preview',
      'version-control',
      'database',
      'database-config',
    ]);
  });
});

describe('AppDevPro 工作区布局', () => {
  it('切换只更新 chrome 与显隐，不卸载文件/应用/数据库，控制台保持原层级', () => {
    const mount = vi.fn();
    const unmount = vi.fn();
    function Content({ view }: { view: AppDevWorkspaceView }) {
      useEffect(() => {
        mount(view);
        return () => unmount(view);
      }, [view]);
      return <span data-testid={view}>{view}</span>;
    }
    const panels: Record<AppDevWorkspaceView, AppDevWorkspacePanel> = {
      files: {
        chrome: <header>文件页签</header>,
        content: <Content view="files" />,
      },
      'app-preview': {
        chrome: <header>应用地址栏</header>,
        content: <Content view="app-preview" />,
      },
      database: {
        chrome: <header>数据库页签</header>,
        content: <Content view="database" />,
      },
      'remote-desktop': { chrome: <header>智能体电脑</header>, content: null },
    };
    const { rerender } = render(
      <AppDevWorkspacePanels workspaceView="files" panels={panels}>
        <footer>终端控制台</footer>
      </AppDevWorkspacePanels>,
    );
    expect(screen.getByText('文件页签')).toBeInTheDocument();
    rerender(
      <AppDevWorkspacePanels workspaceView="database" panels={panels}>
        <footer>终端控制台</footer>
      </AppDevWorkspacePanels>,
    );
    expect(screen.queryByText('文件页签')).toBeNull();
    expect(screen.getByText('数据库页签')).toBeInTheDocument();
    expect(screen.getByTestId('files').parentElement).toHaveClass(
      'workspace-pane-hidden',
    );
    expect(screen.getByTestId('database').parentElement).toHaveClass(
      'tool-workspace-scroll',
    );
    expect(screen.getByTestId('database').parentElement).not.toHaveClass(
      'workspace-pane-hidden',
    );
    expect(mount).toHaveBeenCalledTimes(3);
    expect(mount.mock.calls.map(([view]) => view)).toEqual([
      'files',
      'app-preview',
      'database',
    ]);
    expect(unmount).not.toHaveBeenCalled();
    expect(screen.getByText('终端控制台').parentElement).toHaveClass(
      'right-panel-main',
    );
  });

  it('真实桌面面板只在工作区打开且页面可见时挂载，容器就绪后才连接VNC', () => {
    mountVnc.mockClear();
    unmountVnc.mockClear();
    const panels: Record<AppDevWorkspaceView, AppDevWorkspacePanel> = {
      files: { chrome: null, content: <span>文件</span> },
      'app-preview': { chrome: null, content: <span>应用</span> },
      database: { chrome: null, content: <span>数据库</span> },
      'remote-desktop': {
        chrome: <span>桌面标题</span>,
        content: (
          <AppDevRemoteDesktopPanel
            appId={9}
            conversationId={123}
            containerStatus="starting"
          />
        ),
      },
    };
    const { rerender } = render(
      <AppDevWorkspacePanels workspaceView="files" panels={panels} />,
    );
    expect(screen.queryByTestId('remote-starting')).toBeNull();
    expect(screen.queryByTestId('remote-vnc')).toBeNull();
    rerender(
      <AppDevWorkspacePanels workspaceView="remote-desktop" panels={panels} />,
    );
    expect(screen.getByTestId('remote-starting')).toBeInTheDocument();
    expect(mountVnc).not.toHaveBeenCalled();
    const readyPanels = {
      ...panels,
      'remote-desktop': {
        ...panels['remote-desktop'],
        content: (
          <AppDevRemoteDesktopPanel
            appId={9}
            conversationId={123}
            containerStatus="running"
          />
        ),
      },
    };
    rerender(
      <AppDevWorkspacePanels
        workspaceView="remote-desktop"
        panels={readyPanels}
      />,
    );
    expect(screen.getByTestId('remote-vnc')).toHaveAttribute('data-cid', '123');
    expect(screen.getByTestId('remote-vnc')).toHaveAttribute(
      'data-source',
      '/api/userapp/proxy/vnc/dev/9/',
    );
    expect(mountVnc).toHaveBeenCalledOnce();
    rerender(
      <AppDevWorkspacePanels
        active={false}
        workspaceView="remote-desktop"
        panels={readyPanels}
      />,
    );
    expect(screen.queryByTestId('remote-vnc')).toBeNull();
    expect(unmountVnc).toHaveBeenCalledOnce();
    rerender(
      <AppDevWorkspacePanels
        workspaceView="remote-desktop"
        panels={readyPanels}
      />,
    );
    expect(mountVnc).toHaveBeenCalledTimes(2);
    rerender(
      <AppDevWorkspacePanels workspaceView="database" panels={readyPanels} />,
    );
    expect(screen.queryByTestId('remote-vnc')).toBeNull();
    expect(unmountVnc).toHaveBeenCalledTimes(2);
  });
});
