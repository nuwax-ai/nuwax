import {
  apiBrowseFsChildren,
  apiBrowseFsRoots,
  apiFsMkdir,
  apiFsRename,
} from '@/services/vncDesktop';
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
    expect(request).toHaveBeenLastCalledWith('/api/computer/static/fs/roots', {
      method: 'GET',
      params: { sandboxId: '11' },
    });
    await apiBrowseFsChildren('/work', '22');
    expect(request).toHaveBeenLastCalledWith(
      '/api/computer/static/fs/children',
      {
        method: 'GET',
        params: { path: '/work', sandboxId: '22' },
      },
    );
  });

  it('新建目录与重命名打 POST 且 body 携带沙箱与路径', async () => {
    await apiFsMkdir({
      sandboxId: '11',
      parentPath: '/work',
      dirName: 'demo',
    });
    expect(request).toHaveBeenLastCalledWith('/api/computer/static/fs/mkdir', {
      method: 'POST',
      data: { sandboxId: 11, parentPath: '/work', dirName: 'demo' },
    });
    await apiFsRename({
      sandboxId: '22',
      path: '/work/demo',
      newName: 'demo2',
    });
    expect(request).toHaveBeenLastCalledWith('/api/computer/static/fs/rename', {
      method: 'POST',
      data: { sandboxId: 22, path: '/work/demo', newName: 'demo2' },
    });
  });
});
