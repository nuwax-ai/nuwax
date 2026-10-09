/**
 * ConversationStatusMark 行首状态标记组件测试。
 *
 * 守卫状态优先级：执行中 > 失败 > fallback。
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

const EXECUTING_KEY =
  'PC.Layouts.DynamicMenusLayout.ConversationItem.executing';
const FAILED_KEY = 'PC.Layouts.DynamicMenusLayout.NewHomeSection.failedTask';

describe('ConversationStatusMark', () => {
  it('执行中：渲染转圈（aria-label=执行中）', () => {
    const { container } = render(
      <ConversationStatusMark taskStatus={TaskStatus.EXECUTING} />,
    );
    expect(screen.getByLabelText(EXECUTING_KEY)).toBeTruthy();
    expect(container.querySelector('.anticon')).toBeTruthy();
  });

  it('执行中优先于业务图标：只出转圈', () => {
    render(
      <ConversationStatusMark
        taskStatus={TaskStatus.EXECUTING}
        fallback={<span aria-label="fallback" />}
      />,
    );
    expect(screen.getByLabelText(EXECUTING_KEY)).toBeTruthy();
    expect(screen.queryByLabelText('fallback')).toBeNull();
  });

  it('失败优先于业务图标：渲染失败状态', () => {
    render(
      <ConversationStatusMark
        taskStatus={TaskStatus.FAILED}
        fallback={<span aria-label="fallback" />}
      />,
    );
    expect(screen.getByLabelText(FAILED_KEY)).toBeTruthy();
    expect(screen.queryByLabelText('fallback')).toBeNull();
  });

  it('无运行态状态时渲染 fallback', () => {
    render(
      <ConversationStatusMark
        taskStatus={TaskStatus.COMPLETE}
        fallback={<span aria-label="fallback" />}
      />,
    );
    expect(screen.getByLabelText('fallback')).toBeTruthy();
  });

  it('空闲态：不渲染任何节点', () => {
    const { container } = render(
      <ConversationStatusMark taskStatus={TaskStatus.COMPLETE} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
