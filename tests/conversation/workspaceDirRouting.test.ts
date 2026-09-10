import { apiBrowseFsChildren, apiBrowseFsRoots } from '@/services/vncDesktop';
import { request } from 'umi';
import { describe, expect, it, vi } from 'vitest';
vi.mock('umi', () => ({
  request: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('@/utils/exportImportFile', () => ({
  exportFileViaBrowserDownload: vi.fn(),
}));
describe('目录浏览网关路由', () => {
  it('根目录与子目录都携带当前电脑 ID', async () => {
    await apiBrowseFsRoots('11');
    expect(request).toHaveBeenLastCalledWith('/api/computer/fs/roots', {
      method: 'GET',
      params: { sandboxId: '11' },
    });
    await apiBrowseFsChildren('/work', '22');
    expect(request).toHaveBeenLastCalledWith('/api/computer/fs/children', {
      method: 'GET',
      params: { path: '/work', sandboxId: '22' },
    });
  });
});
