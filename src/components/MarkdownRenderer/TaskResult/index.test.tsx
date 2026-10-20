import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TaskResult from './index';

const openPreviewView = vi.fn();
const setTaskAgentSelectedFileId = vi.fn();
const setTaskAgentSelectTrigger = vi.fn();

vi.mock('@/modelScopes/usePageModel', () => ({
  usePageModel: () => ({
    openPreviewView,
    setTaskAgentSelectedFileId,
    setTaskAgentSelectTrigger,
  }),
}));

vi.mock('./index.less', () => ({
  default: {
    'task-result': 'task-result',
    'task-result-group': 'task-result-group',
    'task-result-summary': 'task-result-summary',
    'task-result-icon': 'task-result-icon',
    'task-result-action': 'task-result-action',
    'task-result-arrow': 'task-result-arrow',
  },
}));

const pptx = '女娲Nuwax AIOS的架构思考与生态实践_赵宇.pptx';
const pdf = '女娲Nuwax AIOS的架构思考与生态实践_赵宇.pdf';

describe('TaskResult', () => {
  beforeEach(() => {
    openPreviewView.mockReset().mockResolvedValue(undefined);
    setTaskAgentSelectedFileId.mockReset();
    setTaskAgentSelectTrigger.mockReset();
  });

  it('单个 file 仍用 description 作为一行，点击打开该文件', async () => {
    render(
      <TaskResult conversationId={1465924}>
        <description>月度报表页面</description>
        <file>1465924/report/index.html</file>
      </TaskResult>,
    );

    fireEvent.click(screen.getByText('月度报表页面'));

    expect(screen.queryByText('index.html')).toBeNull();
    await waitFor(() => {
      expect(setTaskAgentSelectedFileId).toHaveBeenCalledWith(
        'report/index.html',
      );
    });
    expect(openPreviewView).toHaveBeenCalledWith(1465924, {
      skipFileTreeRefresh: true,
    });
  });

  it('多个 file 分行展示文件名，点击各自打开，不再拼成一条路径', async () => {
    render(
      <TaskResult conversationId="1465924">
        <p>
          <description>
            删除第4页三条小点后的CNCC2026演示文稿（PPTX与PDF）
          </description>
          <file>{pptx}</file>
          <file>{pdf}</file>
        </p>
      </TaskResult>,
    );

    expect(
      screen.getByText('删除第4页三条小点后的CNCC2026演示文稿（PPTX与PDF）'),
    ).toBeTruthy();

    fireEvent.click(screen.getByText(pptx));
    fireEvent.click(screen.getByText(pdf));

    await waitFor(() => {
      expect(setTaskAgentSelectedFileId).toHaveBeenCalledTimes(2);
    });
    expect(setTaskAgentSelectedFileId).toHaveBeenNthCalledWith(1, pptx);
    expect(setTaskAgentSelectedFileId).toHaveBeenNthCalledWith(2, pdf);
    expect(setTaskAgentSelectedFileId).not.toHaveBeenCalledWith(pptx + pdf);
  });
});
