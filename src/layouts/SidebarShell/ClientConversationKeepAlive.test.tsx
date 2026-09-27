import { fullPageInstanceCacheManager } from '@/features/conversation/react/useFullPageInstanceCache';
import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ClientConversationKeepAlive from './ClientConversationKeepAlive';

const mocks = vi.hoisted(() => ({
  location: { pathname: '/home', search: '', state: undefined as unknown },
  enabled: true,
  mounts: [] as string[],
}));

vi.mock('@/hooks/useStyle3PcKeepAliveEnabled', () => ({
  default: () => mocks.enabled,
}));

vi.mock('umi', () => ({
  history: { action: 'PUSH' },
  useLocation: () => mocks.location,
  useModel: (() => {
    const ConversationRenderer = ({ route, active }: any) => {
      useEffect(() => {
        mocks.mounts.push(route.key);
      }, []);
      return <div data-testid={route.key}>{active ? 'active' : 'hidden'}</div>;
    };
    const clientConversationRenderers = {
      conversation: ConversationRenderer,
      'ide-workspace': ConversationRenderer,
    };
    return () => ({ clientConversationRenderers });
  })(),
}));

beforeEach(() => {
  mocks.location = { pathname: '/home', search: '', state: undefined };
  mocks.enabled = true;
  mocks.mounts.length = 0;
  fullPageInstanceCacheManager.invalidateAll('test-setup');
});

afterEach(() => {
  act(() => fullPageInstanceCacheManager.invalidateAll('test-cleanup'));
});

describe('PC style3 整页实例宿主', () => {
  it('同 app147 的 A→B→A 切换各会话仅挂载一次并保留原 DOM 实例', () => {
    mocks.location = {
      pathname: '/space/752/app-pro/147/1694001',
      search: '',
      state: undefined,
    };
    const view = render(<ClientConversationKeepAlive />);
    const firstWorkbench = screen.getByTestId('ide-workspace:752:147:1694001');

    act(() => {
      mocks.location = {
        pathname: '/space/752/app-pro/147/1694002',
        search: '',
        state: undefined,
      };
      view.rerender(<ClientConversationKeepAlive />);
    });
    const secondWorkbench = screen.getByTestId('ide-workspace:752:147:1694002');
    expect(firstWorkbench.textContent).toBe('hidden');
    expect(secondWorkbench.textContent).toBe('active');

    act(() => {
      mocks.location = {
        pathname: '/space/752/app-pro/147/1694001',
        search: '',
        state: undefined,
      };
      view.rerender(<ClientConversationKeepAlive />);
    });

    expect(screen.getByTestId('ide-workspace:752:147:1694001')).toBe(
      firstWorkbench,
    );
    expect(screen.getByTestId('ide-workspace:752:147:1694002')).toBe(
      secondWorkbench,
    );
    expect(firstWorkbench.textContent).toBe('active');
    expect(secondWorkbench.textContent).toBe('hidden');
    expect(mocks.mounts).toEqual([
      'ide-workspace:752:147:1694001',
      'ide-workspace:752:147:1694002',
    ]);
  });

  it('A→B→菜单→A 时复用 A 的真实 React 实例', () => {
    const view = render(<ClientConversationKeepAlive />);
    act(() => {
      mocks.location = {
        pathname: '/home/chat/1/10',
        search: '',
        state: undefined,
      };
      view.rerender(<ClientConversationKeepAlive />);
    });
    expect(screen.getByTestId('conversation:1').textContent).toBe('active');

    act(() => {
      mocks.location = {
        pathname: '/home/chat/2/10',
        search: '',
        state: undefined,
      };
      view.rerender(<ClientConversationKeepAlive />);
    });
    expect(screen.getByTestId('conversation:1').textContent).toBe('hidden');
    expect(screen.getByTestId('conversation:2').textContent).toBe('active');

    act(() => {
      mocks.location = { pathname: '/space', search: '', state: undefined };
      view.rerender(<ClientConversationKeepAlive />);
    });
    expect(fullPageInstanceCacheManager.getSnapshot().activeKey).toBeNull();

    act(() => {
      mocks.location = {
        pathname: '/home/chat/1/10',
        search: '',
        state: undefined,
      };
      view.rerender(<ClientConversationKeepAlive />);
    });
    expect(screen.getByTestId('conversation:1').textContent).toBe('active');
    expect(mocks.mounts.filter((key) => key === 'conversation:1')).toHaveLength(
      1,
    );
  });

  it('style1/style2 或移动端不创建整页实例', () => {
    mocks.enabled = false;
    mocks.location = {
      pathname: '/home/chat/1/10',
      search: '',
      state: undefined,
    };
    render(<ClientConversationKeepAlive />);
    expect(fullPageInstanceCacheManager.getSnapshot().entries).toHaveLength(0);
    expect(screen.queryByTestId('conversation:1')).toBeNull();
  });

  it('离开 PC style3 时立即释放已有实例', () => {
    mocks.location = {
      pathname: '/home/chat/1/10',
      search: '',
      state: undefined,
    };
    const view = render(<ClientConversationKeepAlive />);
    expect(fullPageInstanceCacheManager.getSnapshot().entries).toHaveLength(1);

    act(() => {
      mocks.enabled = false;
      view.rerender(<ClientConversationKeepAlive />);
    });

    expect(fullPageInstanceCacheManager.getSnapshot().entries).toHaveLength(0);
    expect(screen.queryByTestId('conversation:1')).toBeNull();
  });
});
