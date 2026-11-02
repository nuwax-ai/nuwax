import { File as NativeFile } from 'node:buffer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { transferLocalPanelFiles } from './filePanelTransfers';
import {
  clearLocalFilesContexts,
  registerLocalFilesContext,
} from './localFileService';

const mocks = vi.hoisted(() => ({ getApi: vi.fn() }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { localFiles: { getApi: mocks.getApi } },
}));
const file = (contents: Uint8Array | string, name = 'file.bin') =>
  new NativeFile(
    [typeof contents === 'string' ? contents : Uint8Array.from(contents)],
    name,
  ) as unknown as File;
let api: ReturnType<typeof makeApi>;
function makeApi() {
  return {
    getCapabilities: vi.fn().mockResolvedValue({
      apiVersion: 3,
      available: true,
      writable: true,
      sandboxId: 'local',
    }),
    resolveContext: vi.fn().mockResolvedValue({
      success: true,
      data: {
        cId: '881020',
        contextId: 'ctx',
        root: '/work',
        sandboxId: 'local',
      },
    }),
    listFiles: vi.fn(),
    searchFiles: vi.fn(),
    preparePreview: vi.fn(),
    saveFile: vi.fn(),
    exportWorkspace: vi.fn(),
    openPath: vi.fn(),
    revealInFolder: vi.fn(),
    updateFiles: vi.fn(),
    releaseContext: vi.fn().mockResolvedValue(undefined),
    beginTransfer: vi
      .fn()
      .mockResolvedValue({ success: true, data: { transferId: 'transfer' } }),
    writeTransferChunk: vi.fn().mockResolvedValue({ success: true }),
    commitTransfer: vi
      .fn()
      .mockResolvedValue({ success: true, data: { count: 1 } }),
    cancel: vi.fn().mockResolvedValue(undefined),
  };
}
beforeEach(() => {
  clearLocalFilesContexts();
  api = makeApi();
  mocks.getApi.mockReturnValue(api);
});
afterEach(clearLocalFilesContexts);
const bind = (sandboxId = 'local') =>
  registerLocalFilesContext({ cId: 881020, sandboxId });

it('keeps a large binary bounded to one-MiB IPC chunks with exact offsets and bytes', async () => {
  bind();
  const bytes = new Uint8Array(2 * 1024 * 1024 + 3).fill(0xad);
  expect(
    await transferLocalPanelFiles(881020, [file(bytes)], ['assets/file.bin']),
  ).toBe(1);
  expect(api.beginTransfer).toHaveBeenCalledWith('ctx', {
    kind: 'files',
    files: [{ path: 'assets/file.bin', size: bytes.length }],
    customTargetDir: undefined,
  });
  expect(
    api.writeTransferChunk.mock.calls.map((call) => [
      call[1],
      call[2],
      call[3].byteLength,
    ]),
  ).toEqual([
    [0, 0, 1024 * 1024],
    [0, 1024 * 1024, 1024 * 1024],
    [0, 2 * 1024 * 1024, 3],
  ]);
  expect(api.writeTransferChunk.mock.calls[2][3]).toEqual(
    new Uint8Array([0xad, 0xad, 0xad]),
  );
  expect(api.cancel).toHaveBeenCalledWith('transfer');
});

it('preserves ZIP import intent and custom workspace root', async () => {
  bind();
  await transferLocalPanelFiles(
    881020,
    [file('zip', 'project.zip')],
    ['project.zip'],
    'project',
    '/work',
  );
  expect(api.beginTransfer).toHaveBeenCalledWith(
    'ctx',
    expect.objectContaining({ kind: 'project', customTargetDir: '/work' }),
  );
});

it('only an explicitly remote or absent bridge can return null', async () => {
  bind('remote');
  expect(await transferLocalPanelFiles(881020, [file('a')], ['a'])).toBeNull();
  bind();
  api.commitTransfer.mockResolvedValue({
    success: false,
    code: 'permission-denied',
  });
  await expect(
    transferLocalPanelFiles(881020, [file('a')], ['a']),
  ).rejects.toMatchObject({ code: 'permission-denied' });
  expect(api.cancel).toHaveBeenCalledOnce();
});

it('cancels a late transfer grant after switching conversations before any byte is written', async () => {
  const release = bind();
  api.beginTransfer.mockImplementationOnce(async () => {
    release();
    return { success: true, data: { transferId: 'late' } };
  });
  await expect(
    transferLocalPanelFiles(881020, [file('a')], ['a']),
  ).rejects.toMatchObject({ code: 'expired' });
  expect(api.writeTransferChunk).not.toHaveBeenCalled();
  expect(api.commitTransfer).not.toHaveBeenCalled();
  expect(api.cancel).toHaveBeenCalledWith('late');
});
