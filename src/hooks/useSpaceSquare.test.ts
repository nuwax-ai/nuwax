import useSpaceSquare from '@/hooks/useSpaceSquare';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// usePinnedAgentHandoff 依赖 umi 的 useModel/pageHandoffContext 与 history，
// 按仓库惯例测试内整体 mock（vitest 不能 import umi 模块，含传递依赖）；
// mock 工厂会被提升到文件顶部，引用的 mock 函数须经 vi.hoisted 一并提升
const { pushMock, setContextMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  setContextMock: vi.fn(),
}));
vi.mock('umi', () => ({
  history: { push: pushMock },
  useModel: () => ({
    setContext: setContextMock,
    consumeContext: vi.fn(() => undefined),
  }),
}));

describe('useSpaceSquare handleClick（bug 2398：智能体卡片改跳首页上框）', () => {
  beforeEach(() => {
    pushMock.mockClear();
    setContextMock.mockClear();
  });

  it('智能体类型：写 homePinnedAgent 透传并 push /home，不再跳详情页/会话页', () => {
    const { result } = renderHook(() => useSpaceSquare());

    act(() => {
      result.current.handleClick(
        2592,
        SquareAgentTypeEnum.Agent,
        'square',
        { name: '东的测试云电脑', icon: '/api/f/x.png' },
      );
    });

    expect(setContextMock).toHaveBeenCalledTimes(1);
    const [key, payload] = setContextMock.mock.calls[0];
    expect(String(key)).toContain('homePinnedAgent');
    expect(payload).toEqual({
      agentId: 2592,
      name: '东的测试云电脑',
      icon: '/api/f/x.png',
    });
    expect(pushMock.mock.calls).toEqual([['/home']]);
  });

  it('非智能体类型分流不受影响（插件仍走发布详情路由）', () => {
    const { result } = renderHook(() => useSpaceSquare());

    act(() => {
      result.current.handleClick(11, SquareAgentTypeEnum.Plugin, 'space');
    });

    expect(setContextMock).not.toHaveBeenCalled();
    expect(pushMock.mock.calls).toEqual([['/space/publish/plugin/11']]);
  });
});
