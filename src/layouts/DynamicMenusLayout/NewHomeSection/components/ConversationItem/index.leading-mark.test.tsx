/**
 * ConversationItem 行尾状态标记（leadingMark 门控）测试。
 *
 * 守卫 2026-09-17 定调的替换契约：
 * - leadingMark 开启（单栏）：执行中 → 行尾转圈，不再渲染「执行中」文字胶囊；
 * - leadingMark 关闭（经典布局维持现状）：执行中仍渲染文字胶囊、无转圈。
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));

// ConversationContextMenu（antd Dropdown 包装）整体替身：透传 render-prop
vi.mock('@/components/business-component/ConversationContextMenu', () => ({
  default: ({
    children,
  }: {
    children: (more: React.ReactNode) => React.ReactNode;
  }) => <>{children(<button type="button">more</button>)}</>,
}));

// 行内归档二次确认引入的会话服务：umi request 链在 vitest 下拉崩 esbuild，mock 断链
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationArchive: () =>
    Promise.resolve({ code: 200, success: true }),
}));

// vitest 下 plain .less 非 CSS Modules、默认导出 undefined（仓内既有坑）
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('../ConversationStatusMark/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

import ConversationItem from './index';

const EXECUTING_KEY =
  'PC.Layouts.DynamicMenusLayout.ConversationItem.executing';
const FAILED_KEY = 'PC.Layouts.DynamicMenusLayout.NewHomeSection.failedTask';

const buildItem = (
  overrides: Partial<ConversationInfo> = {},
): ConversationInfo =>
  ({
    id: 101,
    topic: '会话101',
    modified: '2026-09-17T06:00:00.000+00:00',
    ...overrides,
  } as unknown as ConversationInfo);

const renderRow = (props: {
  taskStatus?: TaskStatus;
  leadingMark?: boolean;
  pinned?: boolean;
}) => {
  return render(
    <ConversationItem
      compact
      item={buildItem({ taskStatus: props.taskStatus })}
      isActive={false}
      onClick={() => {}}
      leadingMark={props.leadingMark}
      pinned={props.pinned}
    />,
  );
};

describe('ConversationItem 行尾状态标记（leadingMark）', () => {
  it('空闲态也保留固定状态槽，置顶操作与时间共用行尾区域', () => {
    const { container } = renderRow({ leadingMark: true });
    expect(container.querySelector('[class*="status-slot"]')).toBeTruthy();
    expect(
      screen.getByLabelText('PC.Components.ConversationContextMenu.pin'),
    ).toBeTruthy();
  });

  it('已置顶静止态与取消置顶操作使用不同图形语义', () => {
    const { container } = renderRow({ leadingMark: true, pinned: true });
    expect(
      container.querySelector('[class*="pinned-state-icon"]'),
    ).toBeTruthy();
    expect(container.querySelector('[class*="unpin-slash"]')).toBeTruthy();
    expect(
      screen.getByLabelText('PC.Components.ConversationContextMenu.unpin'),
    ).toBeTruthy();
  });

  it('执行中用转圈替换文字胶囊并隐藏时间，结束后恢复时间', () => {
    const { container, rerender } = renderRow({
      leadingMark: true,
      taskStatus: TaskStatus.EXECUTING,
    });
    expect(screen.getByLabelText(EXECUTING_KEY)).toBeTruthy(); // 转圈 aria-label
    expect(screen.queryByText(EXECUTING_KEY)).toBeNull(); // 文字胶囊已替换
    expect(container.querySelector('[class*="conversation-date"]')).toBeNull();

    rerender(
      <ConversationItem
        compact
        item={buildItem({ taskStatus: TaskStatus.COMPLETE })}
        isActive={false}
        onClick={() => {}}
        leadingMark
      />,
    );
    expect(screen.queryByLabelText(EXECUTING_KEY)).toBeNull();
    expect(
      container.querySelector('[class*="conversation-date"]'),
    ).toBeTruthy();
  });

  it('开启 + 失败：失败状态优先于置顶', () => {
    renderRow({
      leadingMark: true,
      taskStatus: TaskStatus.FAILED,
      pinned: true,
    });
    expect(screen.getByLabelText(FAILED_KEY)).toBeTruthy();
  });

  it('开启 + 空闲：无任何标记', () => {
    renderRow({ leadingMark: true });
    expect(screen.queryByLabelText(EXECUTING_KEY)).toBeNull();
  });

  it('关闭（经典布局）：执行中仍渲染文字胶囊、无转圈', () => {
    renderRow({ taskStatus: TaskStatus.EXECUTING });
    expect(screen.getByText(EXECUTING_KEY)).toBeTruthy(); // 文字胶囊保留
    expect(screen.queryByLabelText(EXECUTING_KEY)).toBeNull(); // 无转圈
  });
});
