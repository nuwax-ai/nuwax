/**
 * ConversationItem 行首状态标记（leadingMark 门控）测试。
 *
 * 守卫 2026-09-17 定调的替换契约：
 * - leadingMark 开启（单栏）：执行中 → 行首转圈，不再渲染「执行中」文字胶囊；
 *   结束未读 → 蓝点；执行中抑制蓝点。
 * - leadingMark 关闭（经典布局维持现状）：执行中仍渲染文字胶囊、无转圈/蓝点。
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
const UNREAD_KEY =
  'PC.Layouts.DynamicMenusLayout.ConversationItem.unreadFinished';

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
  unread?: boolean;
  leadingMark?: boolean;
}) => {
  const unreadIds = new Set(props.unread ? ['101'] : []);
  return render(
    <ConversationItem
      compact
      item={buildItem({ taskStatus: props.taskStatus })}
      isActive={false}
      onClick={() => {}}
      leadingMark={props.leadingMark}
      unreadConversationIds={unreadIds}
    />,
  );
};

describe('ConversationItem 行首状态标记（leadingMark）', () => {
  it('空闲态也保留固定行首槽，置顶操作与标题不争抢宽度', () => {
    const { container } = renderRow({ leadingMark: true });
    expect(container.querySelector('[class*="leading-slot"]')).toBeTruthy();
    expect(
      screen.getByLabelText('PC.Components.ConversationContextMenu.pin'),
    ).toBeTruthy();
  });

  it('开启 + 执行中：行首转圈替换文字胶囊', () => {
    renderRow({ leadingMark: true, taskStatus: TaskStatus.EXECUTING });
    expect(screen.getByLabelText(EXECUTING_KEY)).toBeTruthy(); // 转圈 aria-label
    expect(screen.queryByText(EXECUTING_KEY)).toBeNull(); // 文字胶囊已替换
  });

  it('开启 + 结束未读：渲染蓝点', () => {
    renderRow({ leadingMark: true, unread: true });
    expect(screen.getByLabelText(UNREAD_KEY)).toBeTruthy();
  });

  it('开启 + 执行中抑制蓝点', () => {
    renderRow({
      leadingMark: true,
      taskStatus: TaskStatus.EXECUTING,
      unread: true,
    });
    expect(screen.getByLabelText(EXECUTING_KEY)).toBeTruthy();
    expect(screen.queryByLabelText(UNREAD_KEY)).toBeNull();
  });

  it('开启 + 空闲：无任何标记', () => {
    renderRow({ leadingMark: true });
    expect(screen.queryByLabelText(EXECUTING_KEY)).toBeNull();
    expect(screen.queryByLabelText(UNREAD_KEY)).toBeNull();
  });

  it('关闭（经典布局）：执行中仍渲染文字胶囊、无转圈/蓝点', () => {
    renderRow({ taskStatus: TaskStatus.EXECUTING });
    expect(screen.getByText(EXECUTING_KEY)).toBeTruthy(); // 文字胶囊保留
    expect(screen.queryByLabelText(EXECUTING_KEY)).toBeNull(); // 无转圈
    expect(screen.queryByLabelText(UNREAD_KEY)).toBeNull();
  });
});
