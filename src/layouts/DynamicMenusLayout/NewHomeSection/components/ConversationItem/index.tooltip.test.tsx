import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { pin } = vi.hoisted(() => ({ pin: vi.fn() }));
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationPin: pin,
  apiAgentConversationArchive: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));
vi.mock('@/components/business-component/ConversationContextMenu', () => ({
  default: ({ children }: any) => children(null),
}));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('../ConversationStatusMark/index.less', () => ({ default: {} }));
// 此层只验证受控状态契约；真实 Tooltip 的样式和可见性由隔离浏览器验证。
vi.mock('antd', async () => {
  const React = await import('react');
  return {
    message: { success: vi.fn(), error: vi.fn() },
    Tooltip: ({ children, open, onOpenChange }: any) => {
      const [hovered, setHovered] = React.useState(false);
      const change = (value: boolean) => {
        setHovered(value);
        onOpenChange?.(value);
      };
      return (
        <span
          onMouseEnter={() => change(true)}
          onMouseLeave={() => change(false)}
        >
          {React.cloneElement(children, {
            className: `${children.props.className} ${
              open ?? hovered ? 'ant-tooltip-open' : ''
            }`,
          })}
        </span>
      );
    },
  };
});

import ConversationItem from './index';

const props = {
  item: { id: 320, topic: '生命周期验收任务' } as any,
  isActive: false,
  onClick: vi.fn(),
  pinned: true,
};
const getPinButton = () =>
  screen.getByRole('button', {
    name: /^PC.Components.ConversationContextMenu.(unpin|pin)$/,
  });
const hover = async () => {
  fireEvent.mouseEnter(getPinButton());
  await waitFor(() => expect(getPinButton()).toHaveClass('ant-tooltip-open'));
};

describe('任务置顶提示生命周期', () => {
  beforeEach(() => {
    pin.mockReset();
  });
  afterEach(() => cleanup());

  it('外部置顶状态改变时，旧 hover 提示立即失效，重新移入仍能显示', async () => {
    const view = render(<ConversationItem {...props} />);
    await hover();
    view.rerender(<ConversationItem {...props} pinned={false} />);
    expect(getPinButton()).not.toHaveClass('ant-tooltip-open');
    await hover();
    fireEvent.mouseLeave(getPinButton());
    await waitFor(() =>
      expect(getPinButton()).not.toHaveClass('ant-tooltip-open'),
    );
  });

  it('请求期间关闭旧提示，失败恢复按钮且不泄漏 hover 状态', async () => {
    let finish!: (value: any) => void;
    pin.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const onFlagChanged = vi.fn();
    render(<ConversationItem {...props} onFlagChanged={onFlagChanged} />);
    await hover();
    fireEvent.click(getPinButton());
    expect(getPinButton()).toBeDisabled();
    expect(getPinButton()).not.toHaveClass('ant-tooltip-open');
    fireEvent.mouseLeave(getPinButton().closest('[class*="status-slot"]')!);
    await act(async () => finish({ code: '0001' }));
    expect(getPinButton()).not.toBeDisabled();
    expect(getPinButton()).not.toHaveClass('ant-tooltip-open');
    expect(onFlagChanged).not.toHaveBeenCalled();
    expect(pin).toHaveBeenCalledWith(320, false);
  });
});
