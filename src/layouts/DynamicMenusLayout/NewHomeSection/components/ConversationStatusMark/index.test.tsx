/**
 * ConversationStatusMark 行首状态标记组件测试。
 *
 * 守卫三态互斥契约：EXECUTING → 转圈（含「执行中」aria-label）；
 * 结束未读 → 蓝点（含「未查看」aria-label）；执行中抑制蓝点；其余不渲染。
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskStatus } from '@/types/enums/agent';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

// vitest 下 plain .less 非 CSS Modules、默认导出 undefined（仓内既有坑）：
// Proxy 回显 key 本身，保住按字面类名的断言
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

import ConversationStatusMark from './index';

const EXECUTING_KEY = 'PC.Layouts.DynamicMenusLayout.ConversationItem.executing';
const UNREAD_KEY =
  'PC.Layouts.DynamicMenusLayout.ConversationItem.unreadFinished';

describe('ConversationStatusMark', () => {
  it('执行中：渲染转圈（aria-label=执行中）', () => {
    const { container } = render(
      <ConversationStatusMark taskStatus={TaskStatus.EXECUTING} />,
    );
    expect(screen.getByLabelText(EXECUTING_KEY)).toBeTruthy();
    expect(container.querySelector('.anticon')).toBeTruthy();
  });

  it('结束未读：渲染蓝点（aria-label=未查看）', () => {
    const { container } = render(<ConversationStatusMark unread />);
    expect(screen.getByLabelText(UNREAD_KEY)).toBeTruthy();
    expect(container.querySelector('.mark-dot')).toBeTruthy();
  });

  it('执行中抑制蓝点：双条件只出转圈', () => {
    const { container } = render(
      <ConversationStatusMark
        taskStatus={TaskStatus.EXECUTING}
        unread
      />,
    );
    expect(screen.getByLabelText(EXECUTING_KEY)).toBeTruthy();
    expect(screen.queryByLabelText(UNREAD_KEY)).toBeNull();
    expect(container.querySelector('.mark-dot')).toBeNull();
  });

  it('空闲态：不渲染任何节点', () => {
    const { container } = render(
      <ConversationStatusMark taskStatus={TaskStatus.COMPLETE} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
