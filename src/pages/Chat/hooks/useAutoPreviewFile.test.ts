/**
 * useAutoPreviewFile 单元测试（#5a 懒加载收尾）
 *
 * 覆盖：
 * - 存在性检查走父目录单层查询（relativePath=父目录、recursive=false），
 *   不再全量递归拉整树
 * - 文件存在时打开预览并选中；不存在时不动作
 */
import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseModel, mockApiGetStaticFileList, mockExtract } = vi.hoisted(
  () => ({
    mockUseModel: vi.fn(),
    mockApiGetStaticFileList: vi.fn(),
    mockExtract: vi.fn(),
  }),
);

vi.mock('umi', () => ({
  useModel: () => mockUseModel(),
}));

vi.mock('@/services/vncDesktop', () => ({
  apiGetStaticFileList: mockApiGetStaticFileList,
}));

vi.mock('@/utils', () => ({
  extractLastTaskResultFile: (text: string) => mockExtract(text),
}));

import { useAutoPreviewFile } from './useAutoPreviewFile';

describe('useAutoPreviewFile', () => {
  const mockOpenPreviewView = vi.fn();
  const mockSetTaskAgentSelectedFileId = vi.fn();
  const mockSetTaskAgentSelectTrigger = vi.fn();

  const buildList = (text: string) => [
    { messageType: 'ASSISTANT', text } as any,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseModel.mockReturnValue({
      openPreviewView: mockOpenPreviewView,
      setTaskAgentSelectedFileId: mockSetTaskAgentSelectedFileId,
      setTaskAgentSelectTrigger: mockSetTaskAgentSelectTrigger,
    });
  });

  it('存在性检查走父目录单层查询并选中存在的文件', async () => {
    mockExtract.mockReturnValue('/static/1001/docs/readme.md');
    mockApiGetStaticFileList.mockResolvedValue({
      code: '0000',
      data: {
        files: [{ name: 'docs/readme.md', isDir: false }],
        recursive: false,
      },
    });

    const { handleAutoPreviewLastFile } = useAutoPreviewFile();
    await act(async () => {
      handleAutoPreviewLastFile(buildList('whatever'), 1001);
    });
    await waitFor(() => {
      expect(mockOpenPreviewView).toHaveBeenCalled();
    });

    expect(mockApiGetStaticFileList).toHaveBeenCalledWith(1001, {
      relativePath: 'docs',
      recursive: false,
    });
    expect(mockSetTaskAgentSelectedFileId).toHaveBeenCalledWith(
      'docs/readme.md',
    );
    expect(mockSetTaskAgentSelectTrigger).toHaveBeenCalled();
  });

  it('根目录文件：父目录为空字符串；不存在时不打开预览', async () => {
    mockExtract.mockReturnValue('/static/1001/report.md');
    mockApiGetStaticFileList.mockResolvedValue({
      code: '0000',
      data: { files: [], recursive: false },
    });

    const { handleAutoPreviewLastFile } = useAutoPreviewFile();
    await act(async () => {
      handleAutoPreviewLastFile(buildList('x'), 1001);
    });
    await waitFor(() => {
      expect(mockApiGetStaticFileList).toHaveBeenCalled();
    });

    expect(mockApiGetStaticFileList).toHaveBeenCalledWith(1001, {
      relativePath: '',
      recursive: false,
    });
    expect(mockOpenPreviewView).not.toHaveBeenCalled();
  });

  it('文件不在父目录列表中时不打开预览', async () => {
    mockExtract.mockReturnValue('/static/1001/docs/missing.md');
    mockApiGetStaticFileList.mockResolvedValue({
      code: '0000',
      data: {
        files: [{ name: 'docs/other.md', isDir: false }],
        recursive: false,
      },
    });

    const { handleAutoPreviewLastFile } = useAutoPreviewFile();
    await act(async () => {
      handleAutoPreviewLastFile(buildList('x'), 1001);
    });
    await waitFor(() => {
      expect(mockApiGetStaticFileList).toHaveBeenCalled();
    });

    expect(mockOpenPreviewView).not.toHaveBeenCalled();
    expect(mockSetTaskAgentSelectedFileId).not.toHaveBeenCalled();
  });
});
