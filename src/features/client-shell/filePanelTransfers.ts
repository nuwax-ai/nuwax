import {
  LocalFileAccessError,
  resolveLocalFilesAccess,
} from './localFileService';

const CHUNK_BYTES = 1024 * 1024;

/** 消费文件树已选择的文件；消息附件不会调用此适配器。 */
export async function transferLocalPanelFiles(
  cId: string | number,
  files: File[],
  paths: string[],
  kind: 'files' | 'project' = 'files',
  customTargetDir?: string,
): Promise<number | null> {
  const access = await resolveLocalFilesAccess(cId);
  if (!access) return null;
  const { api, context, assertCurrent } = access;
  if (
    !api.beginTransfer ||
    !api.writeTransferChunk ||
    !api.commitTransfer ||
    !api.cancel
  )
    throw new LocalFileAccessError('unavailable');
  if (!files.length || files.length !== paths.length)
    throw new LocalFileAccessError('invalid-argument');
  const started = await api.beginTransfer(context.contextId, {
    kind,
    files: files.map((file, index) => ({
      path: paths[index],
      size: file.size,
    })),
    customTargetDir,
  });
  if (!started.success)
    throw new LocalFileAccessError(started.code, started.error);
  const id = started.data.transferId;
  try {
    for (let index = 0; index < files.length; index++) {
      for (let offset = 0; offset < files[index].size; offset += CHUNK_BYTES) {
        assertCurrent();
        const bytes = new Uint8Array(
          await files[index].slice(offset, offset + CHUNK_BYTES).arrayBuffer(),
        );
        assertCurrent();
        const result = await api.writeTransferChunk(id, index, offset, bytes);
        if (!result.success)
          throw new LocalFileAccessError(result.code, result.error);
      }
    }
    assertCurrent();
    const result = await api.commitTransfer(id);
    assertCurrent();
    if (!result.success)
      throw new LocalFileAccessError(result.code, result.error);
    return result.data.count;
  } finally {
    await api.cancel(id).catch(() => undefined);
  }
}
