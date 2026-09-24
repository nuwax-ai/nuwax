import { fullPageInstanceCacheManager } from '@/features/conversation/react/useFullPageInstanceCache';
import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ClientConversationKeepAlive from './ClientConversationKeepAlive';

const mocks = vi.hoisted(() => ({
  location: { pathname: '/home', search: '', state: undefined as unknown },
  desktop: true,
  mounts: [] as string[],
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
    };
    return () => ({ clientConversationRenderers });
  })(),
}));

vi.mock('@/utils/hostBridge', () => ({
  isDesktopHost: () => mocks.desktop,
}));

beforeEach(() => {
  mocks.location = { pathname: '/home', search: '', state: undefined };
  mocks.desktop = true;
  mocks.mounts.length = 0;
  fullPageInstanceCacheManager.invalidateAll('test-setup');
});

afterEach(() => {
  act(() => fullPageInstanceCacheManager.invalidateAll('test-cleanup'));
});

describe('商业客户端整页实例宿主', () => {
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

  it('浏览器风格不创建整页实例', () => {
    mocks.desktop = false;
    mocks.location = {
      pathname: '/home/chat/1/10',
      search: '',
      state: undefined,
    };
    render(<ClientConversationKeepAlive />);
    expect(fullPageInstanceCacheManager.getSnapshot().entries).toHaveLength(0);
    expect(screen.queryByTestId('conversation:1')).toBeNull();
  });
});
