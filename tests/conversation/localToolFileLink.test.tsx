import { LocalToolFileContext } from '@/features/conversation/presentation-v2/react/LocalToolFileContext';
import ProcessNodeRow from '@/features/conversation/presentation-v2/react/ProcessNodeRow';
import type { ConversationProcessNode } from '@/features/conversation/presentation-v2/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const path = '/Users/alice/project/report.md';
const adapter = vi.hoisted(() => ({ reference: vi.fn(), open: vi.fn() }));
vi.mock('@/features/client-shell/localFileService', () => ({
  useLocalFilesRevision: () => 0,
  getLocalFileReference: adapter.reference,
  openLocalFile: adapter.open,
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/MarkdownRenderer', () => ({
  PureMarkdownRenderer: ({ children }: { children: string }) => children,
}));
vi.mock('@/hooks/useUnifiedTheme', () => ({
  useUnifiedTheme: () => ({ data: { antdTheme: 'light' } }),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  adapter.reference.mockReturnValue({ contextId: 'ctx', cId: '9', path });
});

function checkToolFilePath(result: unknown, detailTexts: string[]) {
  const node: ConversationProcessNode = {
    id: 'tool-1',
    kind: 'tool',
    title: '调用工具',
    summary: '',
    status: 'finished',
    failed: false,
    processing: { result } as ConversationProcessNode['processing'],
  };
  const onOpenResource = vi.fn();

  function Row() {
    const [expanded, setExpanded] = useState(false);
    return (
      <LocalToolFileContext.Provider value="9">
        <ProcessNodeRow
          node={node}
          grouped
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          onOpenResource={onOpenResource}
        />
      </LocalToolFileContext.Provider>
    );
  }

  render(<Row />);
  const row = screen.getByRole('button');
  expect(row).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(screen.getByText('report.md'));
  expect(row).toHaveAttribute('aria-expanded', 'true');
  detailTexts.forEach((content) =>
    expect(screen.getByText(content)).toBeVisible(),
  );

  const [, detailPath] = screen.getAllByTitle(path);
  fireEvent.click(detailPath);
  expect(row).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getAllByRole('button')).toEqual([row]);
  expect(screen.queryByRole('link')).toBeNull();
  expect(onOpenResource).not.toHaveBeenCalled();
  expect(adapter.open).not.toHaveBeenCalled();
}

describe('工具文件路径交互', () => {
  it.each([
    { action: '新建', oldText: '', newText: 'after', visible: ['+ after'] },
    {
      action: '修改',
      oldText: 'before',
      newText: 'after',
      visible: ['- before', '+ after'],
    },
    { action: '删除', oldText: 'before', newText: '', visible: ['- before'] },
  ])('$action的文件名只随工具行展开，差异标题仅展示', (change) => {
    checkToolFilePath(
      {
        kind: 'edit',
        data: [
          {
            type: 'diff',
            path,
            oldText: change.oldText,
            newText: change.newText,
          },
        ],
      },
      change.visible,
    );
  });

  it('读取的文件名只随工具行展开，保留读取结果', () => {
    checkToolFilePath(
      { kind: 'read', input: { file_path: path }, data: '读取的内容' },
      ['读取的内容'],
    );
  });
});
