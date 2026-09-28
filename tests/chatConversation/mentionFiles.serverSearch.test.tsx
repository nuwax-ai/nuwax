import useConversationMentionFiles from '@/hooks/useConversationMentionFiles';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ fileList: vi.fn(), searchFiles: vi.fn() }));
vi.mock('@/services/vncDesktop', () => ({
  apiGetStaticFileList: mocks.fileList,
  apiSearchFiles: mocks.searchFiles,
}));

describe('@ 文件服务端搜索', () => {
  it('初始化从 file-list 获取文件，输入关键词后调用 search-files', async () => {
    mocks.fileList.mockResolvedValue({
      code: '0000',
      data: { files: [{ name: 'docs/first.md', isDir: false }] },
    });
    mocks.searchFiles.mockResolvedValue({
      code: '0000',
      data: { files: [{ name: 'docs/report.md', isDir: false }] },
    });
    const { result } = renderHook(() => useConversationMentionFiles(123));

    await act(async () => {
      expect(await result.current()).toEqual([
        { kind: 'file', relativePath: 'docs/first.md', name: 'first.md' },
      ]);
      expect(await result.current(' report ')).toEqual([
        { kind: 'file', relativePath: 'docs/report.md', name: 'report.md' },
      ]);
    });
    expect(mocks.fileList).toHaveBeenCalledWith(123, {
      relativePath: '',
      recursive: true,
      type: 'file',
      limit: 100,
    });
    expect(mocks.fileList).toHaveBeenCalledTimes(1);
    expect(mocks.searchFiles).toHaveBeenCalledWith({
      cId: 123,
      kw: 'report',
      limit: 100,
    });
  });
});
