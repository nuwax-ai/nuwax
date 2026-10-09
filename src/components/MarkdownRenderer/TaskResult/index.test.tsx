/**
 * TaskResult 渲染防御测试
 *
 * 线上观测（1678881）：task-result 标签只包一个子节点时 children 为单个元素而非
 * 数组，`(children as React.ReactNode[])?.filter(...)` 抛 "c?.filter is not a
 * function"，该文件行整行丢失渲染。防御目标：任意 children 形态不抛错。
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({
  useModel: () => ({
    openPreviewView: vi.fn(),
    setTaskAgentSelectedFileId: vi.fn(),
    setTaskAgentSelectTrigger: vi.fn(),
  }),
}));

// 非 module less 在测试环境无类名映射，mock 为固定 key
vi.mock('./index.less', () => ({
  default: {
    'task-result': 'task-result',
    'task-result-icon': 'task-result-icon',
  },
}));

import TaskResult from './index';

describe('TaskResult', () => {
  it('children 为单个 file 元素（非数组）时正常渲染文件名', () => {
    const { container } = render(
      <TaskResult
        node={{ position: { start: { offset: 0 }, end: { offset: 5 } } }}
        conversationId="3001"
      >
        <file>report.pdf</file>
      </TaskResult>,
    );
    expect(container.textContent).toContain('report.pdf');
  });

  it('children 为数组时优先显示文件描述作为 title', () => {
    render(
      <TaskResult conversationId="3001">
        <description>年度统计报表</description>
        <file>/w/3001/report.xlsx</file>
      </TaskResult>,
    );
    expect(screen.getByTitle('年度统计报表')).toBeTruthy();
  });

  it('纯文本 children（无 file 标签）渲染为空', () => {
    const { container } = render(
      <TaskResult conversationId="3001">plain text</TaskResult>,
    );
    expect(container.textContent).toBe('');
  });
});
