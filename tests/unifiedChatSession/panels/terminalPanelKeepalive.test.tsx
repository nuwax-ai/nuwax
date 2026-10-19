/**
 * 会话终端面板「连接生命周期与显隐解耦」合同（NW-026 / NW-027）：
 * - 面板 visible 翻 false 只暂停自动连接，preserveTerminalConnections 模式下
 *   EmbeddedConsoleTerminal 收到 keepConnection=true，连接不被销毁；
 * - 面板恢复 visible 后复用同一终端实例（不重挂），autoConnect 回到 true；
 * - 未开 preserve 的旧入口仍传 keepConnection=false（保持既有断连口径）。
 * 连接不被 close 的最终保证由 EmbeddedConsoleTerminal 真组件用例覆盖，
 * 这里锁定面板层把正确指令传下去且不卸载实例。
 */
import ConversationBottomConsole from '@/components/business-component/ConversationBottomConsole';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mounts: [] as string[],
  terminals: [] as any[],
  run: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('@/components/base', () => ({ SvgIcon: () => <span /> }));
vi.mock('@/components/custom/TooltipIcon', () => ({
  default: ({ title }: any) => <button>{title}</button>,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/vncDesktop', () => ({
  apiEnsurePod: vi.fn(),
  apiKeepalivePod: vi.fn(),
  isEnsurePodThrottledError: () => false,
}));
vi.mock('ahooks', () => ({
  useRequest: () => ({ run: mocks.run, cancel: mocks.cancel }),
}));
vi.mock(
  '@/components/business-component/ConversationBottomConsole/index.less',
  () => ({
    default: new Proxy({}, { get: (_, key) => String(key) }),
  }),
);
vi.mock(
  '@/components/business-component/ConversationBottomConsole/DevLogPanel',
  () => ({ default: () => <div /> }),
);
vi.mock(
  '@/components/business-component/Terminal/EmbeddedConsoleTerminal',
  async () => {
    const React = await import('react');
    return {
      default: React.forwardRef((props: any, ref) => {
        React.useEffect(() => {
          // 记录挂载次数：面板显隐不得导致终端重挂（重挂即连接销毁）
          mocks.mounts.push(props.wsUrl);
        }, []);
        mocks.terminals.push(props);
        React.useImperativeHandle(ref, () => ({
          restoreAfterVisibilityChange() {},
          disconnect() {},
          reconnect() {},
          writeln() {},
          getTerminal: () => ({ write() {} }),
          focus() {},
        }));
        return (
          <div
            data-testid={props.wsUrl}
            data-connect={String(props.autoConnect)}
            data-keep={String(props.keepConnection)}
          />
        );
      }),
    };
  },
);

beforeEach(() => {
  mocks.mounts = [];
  mocks.terminals = [];
  mocks.run.mockClear();
  mocks.cancel.mockClear();
});
afterEach(cleanup);

const latestTerminal = () => mocks.terminals.at(-1);

describe('conversation terminal panel keepalive contract', () => {
  it('hiding the panel only pauses auto-connect and reuses the instance when shown again (preserve mode)', () => {
    const props = {
      wsUrl: 'ws://keep',
      preserveTerminalConnections: true,
      defaultLayoutMode: 'default' as const,
    };
    const { rerender } = render(<ConversationBottomConsole {...props} />);
    expect(latestTerminal().autoConnect).toBe(true);
    expect(latestTerminal().keepConnection).toBe(true);

    // 切到文件预览 / 智能体电脑等：面板隐藏不得销毁连接
    rerender(<ConversationBottomConsole {...props} visible={false} />);
    expect(latestTerminal().autoConnect).toBe(false);
    expect(latestTerminal().keepConnection).toBe(true);

    // 切回终端：复用同一实例恢复视图，不重建
    rerender(<ConversationBottomConsole {...props} visible />);
    expect(latestTerminal().autoConnect).toBe(true);
    expect(mocks.mounts).toHaveLength(1);
  });

  it('keeps the legacy disconnect contract when preserve mode is not requested', () => {
    const props = {
      wsUrl: 'ws://legacy',
      visible: false,
      defaultLayoutMode: 'default' as const,
    };
    render(<ConversationBottomConsole {...props} />);
    expect(latestTerminal().keepConnection).toBe(false);
  });
});
