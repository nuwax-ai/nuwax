import { SUCCESS_CODE } from '@/constants/codes.constants';
import { subscribeComputerServiceState } from '@/services/computerServiceState';
import type { UpdateFileInfo } from '@/types/interfaces/fileTree';
import type {
  HostLocalFilesBridge,
  LocalFileChange,
  LocalFilePreview,
  LocalFilesContext,
  LocalFilesContextInput,
  LocalFilesErrorCode,
  LocalFilesListOptions,
  LocalFilesResult,
  LocalFilesSearchOptions,
} from '@/types/interfaces/hostBridge';
import type { LocalFileReference } from '@/types/interfaces/localFile';
import type { RequestResponse } from '@/types/interfaces/request';
import type { StaticFileListResponse } from '@/types/interfaces/vncDesktop';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { hostBridge } from '@/utils/hostBridge';
import { useLayoutEffect, useSyncExternalStore } from 'react';
export type { LocalFileReference } from '@/types/interfaces/localFile';

type ContextRecord = {
  input: LocalFilesContextInput;
  api?: Partial<HostLocalFilesBridge>;
  context?: LocalFilesContext;
  pending: Promise<LocalFilesContext | null>;
  disposed: boolean;
  settled: boolean;
  generation: number;
  knownLocal: boolean;
  writable: boolean;
  owners: Set<symbol>;
  grants: Set<string>;
};
const contexts = new Map<string, ContextRecord>();
// Keep bounded provenance after UI disposal so a delayed autosave cannot become
// a cloud write merely because its local context has already been released.
const recentLocalSources = new Map<string, string>();
const MAX_RECENT_LOCAL_SOURCES = 256;
const listeners = new Set<() => void>();
let revision = 0;
const changed = () => {
  revision += 1;
  listeners.forEach((listener) => listener());
};
const safely = (task?: Promise<unknown>) => task?.catch(() => undefined);
const fallbackCodes = new Set<LocalFilesErrorCode>([
  'unavailable',
  'not-local',
  'context-unresolved',
]);

export class LocalFileAccessError extends Error {
  constructor(public readonly code: LocalFilesErrorCode, detail?: string) {
    super(detail || `本机文件访问失败（${code}）`);
    this.name = 'LocalFileAccessError';
  }
}
function value<T>(result: LocalFilesResult<T>): T {
  if (!result.success)
    throw new LocalFileAccessError(result.code, result.error);
  return result.data;
}

function releaseRecordResources(record: ContextRecord) {
  for (const grantId of record.grants)
    safely(record.api?.releasePreview?.(grantId));
  record.grants.clear();
  if (record.context)
    safely(record.api?.releaseContext?.(record.context.contextId));
  record.context = undefined;
}
function disposeRecord(cId: string, record: ContextRecord) {
  record.disposed = true;
  record.generation += 1;
  releaseRecordResources(record);
  if (contexts.get(cId) === record) contexts.delete(cId);
  changed();
}
function releaseOwner(cId: string, owner: symbol) {
  const record = contexts.get(cId);
  if (!record || !record.owners.has(owner)) return;
  record.owners.delete(owner);
  if (!record.owners.size) disposeRecord(cId, record);
}
function resolveRecord(cId: string, record: ContextRecord) {
  const generation = ++record.generation;
  record.pending = (async () => {
    const api = hostBridge.localFiles?.getApi();
    if (
      !api?.getCapabilities ||
      !api.resolveContext ||
      !api.listFiles ||
      !api.searchFiles ||
      !api.preparePreview ||
      !api.saveFile ||
      !api.exportWorkspace ||
      !api.openPath ||
      !api.revealInFolder ||
      typeof api.updateFiles !== 'function'
    ) {
      if (record.knownLocal) throw new LocalFileAccessError('unavailable');
      return null;
    }
    record.api = api;
    let capabilities;
    try {
      capabilities = await api.getCapabilities();
    } catch {
      if (record.knownLocal) throw new LocalFileAccessError('unavailable');
      return null;
    }
    if (
      record.disposed ||
      record.generation !== generation ||
      contexts.get(cId) !== record
    ) {
      throw new LocalFileAccessError('expired');
    }
    if (
      !capabilities.available ||
      !Number.isInteger(capabilities.apiVersion) ||
      capabilities.apiVersion < 2 ||
      capabilities.writable !== true ||
      !capabilities.sandboxId
    ) {
      if (record.knownLocal) throw new LocalFileAccessError('unavailable');
      return null;
    }
    if (capabilities.sandboxId !== record.input.sandboxId) {
      if (record.knownLocal) throw new LocalFileAccessError('not-local');
      return null;
    }
    const result = await api.resolveContext(record.input);
    if (!result.success) {
      if (!record.knownLocal && fallbackCodes.has(result.code)) return null;
      throw new LocalFileAccessError(result.code, result.error);
    }
    if (
      record.disposed ||
      record.generation !== generation ||
      contexts.get(cId) !== record
    ) {
      safely(api.releaseContext?.(result.data.contextId));
      throw new LocalFileAccessError('expired');
    }
    // direct 页面可先于客户端升级。完整读写能力才切换整条路线，
    // 避免旧只读桥接管列表后又阻止原本可用的保存。
    record.knownLocal = true;
    recentLocalSources.delete(cId);
    recentLocalSources.set(cId, record.input.sandboxId);
    if (recentLocalSources.size > MAX_RECENT_LOCAL_SOURCES)
      recentLocalSources.delete(recentLocalSources.keys().next().value!);
    record.writable =
      capabilities.apiVersion >= 2 && capabilities.writable === true;
    record.context = result.data;
    changed();
    return result.data;
  })().finally(() => {
    if (record.generation === generation) {
      record.settled = true;
      changed();
    }
  });
  // 页面注册本身不显示错误；实际文件操作消费同一个拒绝。
  safely(record.pending);
  changed();
}
/** 页面明确注册会话与电脑绑定；禁止以全局电脑选择推断另一个 cId。 */
export function registerLocalFilesContext(
  input: LocalFilesContextInput,
): () => void {
  const cId = String(input.cId);
  const owner = Symbol('local-files-context');
  const previous = contexts.get(cId);
  // 后端 DTO 的可选字段可能为 null/空串；原生桥的可选 scalar 只接受值或 undefined。
  const optional = <T extends string | number>(value: T | null | undefined) =>
    value === null || value === '' ? undefined : value;
  const normalizedInput = {
    ...input,
    cId,
    workspacePath: optional(input.workspacePath),
    projectId: optional(input.projectId),
    serviceType: optional(input.serviceType),
    userId: optional(input.userId),
  };
  if (
    previous &&
    JSON.stringify(previous.input) === JSON.stringify(normalizedInput)
  ) {
    previous.owners.add(owner);
    return () => releaseOwner(cId, owner);
  }
  if (previous) disposeRecord(cId, previous);
  const record: ContextRecord = {
    input: normalizedInput,
    pending: Promise.resolve(null),
    disposed: false,
    settled: false,
    generation: 0,
    knownLocal: false,
    writable: false,
    owners: new Set([owner]),
    grants: new Set(),
  };
  contexts.set(cId, record);
  resolveRecord(cId, record);
  return () => releaseOwner(cId, owner);
}
export function clearLocalFilesContexts(): void {
  for (const [cId, record] of contexts) disposeRecord(cId, record);
}

/** 登出、失效及顶层文档销毁立即释放，宿主仍做最终会话代次校验。 */
export function initLocalFilesLifecycle(): () => void {
  eventBus.on(EVENT_NAMES.AUTH_SESSION_CLEARED, clearLocalFilesContexts);
  window.addEventListener('pagehide', clearLocalFilesContexts);
  const disposeComputerState = subscribeComputerServiceState((state) => {
    const online =
      ['starting', 'ready'].includes(state.phase) && !!state.sandboxId;
    for (const [cId, record] of contexts) {
      if (state.sandboxId && record.input.sandboxId !== state.sandboxId)
        continue;
      if (online) {
        // starting → ready 不撤销已可用的媒体授权；真实停服会先令旧代次失效。
        if (record.context) continue;
        releaseRecordResources(record);
        record.settled = false;
        resolveRecord(cId, record);
      } else if (record.knownLocal) {
        releaseRecordResources(record);
        record.generation += 1;
        record.settled = true;
        record.pending = Promise.reject(
          new LocalFileAccessError('unavailable', '本机文件服务未就绪'),
        );
        safely(record.pending);
        changed();
      }
    }
  });
  return () => {
    disposeComputerState();
    eventBus.off(EVENT_NAMES.AUTH_SESSION_CLEARED, clearLocalFilesContexts);
    window.removeEventListener('pagehide', clearLocalFilesContexts);
    clearLocalFilesContexts();
  };
}

/** layout effect 先于文件面板的数据加载 effect 注册，首个请求也能等待解析。 */
export function useLocalFilesContext(
  input?: LocalFilesContextInput | null,
): void {
  const cId = input?.cId;
  const sandboxId = input?.sandboxId;
  const workspacePath = input?.workspacePath;
  const projectId = input?.projectId;
  const serviceType = input?.serviceType;
  const userId = input?.userId;
  useLayoutEffect(() => {
    if (cId === undefined || cId === null || !sandboxId) return;
    return registerLocalFilesContext({
      cId,
      sandboxId,
      workspacePath,
      projectId,
      serviceType,
      userId,
    });
  }, [cId, sandboxId, workspacePath, projectId, serviceType, userId]);
}
export function getLocalFilesContextKey(cId?: string | number): string {
  const record = cId === undefined ? undefined : contexts.get(String(cId));
  return record
    ? `${record.input.sandboxId}:${record.generation}:${
        record.settled ? record.context?.contextId || 'remote' : 'pending'
      }`
    : '';
}
export function assertLocalFilesContextUnchanged(
  cId: string | number,
  key: string,
): void {
  if (getLocalFilesContextKey(cId) !== key)
    throw new LocalFileAccessError('expired');
}
export function getLocalFilesWorkspaceRoot(
  cId: string | number,
): string | undefined {
  return contexts.get(String(cId))?.context?.root;
}

/** 同一来源一旦成功访问本机，恢复中的失败也必须继续留在本机路线。 */
export function getLocalFilesContextKnownLocal(cId: string | number): boolean {
  return !!contexts.get(String(cId))?.knownLocal;
}

export function getLocalFilesContextPending(cId: string | number): boolean {
  const record = contexts.get(String(cId));
  return !!record && !record.disposed && !record.settled;
}
export function useLocalFilesRevision(): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => revision,
    () => 0,
  );
}

export const isAbsoluteFileUrl = (url: string): boolean =>
  /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
export const isLocalPreviewUrl = (url: string): boolean =>
  /^nuwax-local:\/\//i.test(url);

function parseStaticUrl(
  url: string,
): { cId: string; path: string } | undefined {
  try {
    const parsedUrl = new URL(url, 'https://file.invalid');
    const path = parsedUrl.pathname;
    const match = /^\/api\/computer\/static\/([^/]+)\/(.+)$/.exec(path);
    if (!match) return;
    // 控制端点不能被误认成文件路径。
    if (!/^\d+$/.test(match[1])) return;
    const customRoot = parsedUrl.searchParams.get('customTargetDir');
    const relative = decodeURIComponent(match[2]);
    return {
      cId: decodeURIComponent(match[1]),
      path: customRoot
        ? `${customRoot.replace(/[\\/]+$/, '')}/${relative}`
        : relative,
    };
  } catch {
    return;
  }
}

type ReferenceInput =
  | string
  | { localFile?: LocalFileReference; fileProxyUrl?: string; path?: string };
export function getLocalFileReference(
  input: ReferenceInput,
  cId?: string | number,
  path?: string,
): LocalFileReference | undefined {
  if (typeof input !== 'string' && input.localFile) {
    return contexts.get(input.localFile.cId)?.context?.contextId ===
      input.localFile.contextId
      ? input.localFile
      : undefined;
  }
  const target = parseStaticUrl(
    typeof input === 'string' ? input : input.fileProxyUrl || '',
  );
  const id = target?.cId || (cId === undefined ? undefined : String(cId));
  const filePath =
    path || target?.path || (typeof input === 'string' ? input : input.path);
  const context = id ? contexts.get(id)?.context : undefined;
  return context && filePath
    ? { contextId: context.contextId, cId: context.cId, path: filePath }
    : undefined;
}
export function useLocalFileReference(
  input: ReferenceInput,
  cId?: string | number,
  path?: string,
): LocalFileReference | undefined {
  useLocalFilesRevision();
  return getLocalFileReference(input, cId, path);
}

async function resolveTarget(input: string | LocalFileReference): Promise<{
  ref: LocalFileReference;
  api: Partial<HostLocalFilesBridge>;
} | null> {
  if (typeof input !== 'string') {
    const record = contexts.get(input.cId);
    if (
      !record ||
      record.disposed ||
      record.context?.contextId !== input.contextId
    )
      throw new LocalFileAccessError('expired');
    return { ref: input, api: record.api! };
  }
  if (isLocalPreviewUrl(input)) return null;
  const parsed = parseStaticUrl(input);
  if (!parsed) return null;
  const record = contexts.get(parsed.cId);
  if (!record) return null;
  const generation = record.generation;
  const context = await record.pending;
  if (
    record.disposed ||
    record.generation !== generation ||
    contexts.get(parsed.cId) !== record
  )
    throw new LocalFileAccessError('expired');
  if (!context) return null;
  return {
    ref: { contextId: context.contextId, cId: context.cId, path: parsed.path },
    api: record.api!,
  };
}

export async function getLocalFileList(
  cId: string | number,
  options: LocalFilesListOptions = {},
  search?: LocalFilesSearchOptions,
): Promise<RequestResponse<StaticFileListResponse> | null> {
  const record = contexts.get(String(cId));
  if (!record) return null;
  const generation = record.generation;
  const context = await record.pending;
  if (
    record.disposed ||
    record.generation !== generation ||
    contexts.get(String(cId)) !== record
  )
    throw new LocalFileAccessError('expired');
  if (!context) return null;
  const result = search
    ? await record.api!.searchFiles!(context.contextId, search)
    : await record.api!.listFiles!(context.contextId, options);
  const data = value(result);
  if (record.disposed || record.generation !== generation)
    throw new LocalFileAccessError('expired');
  const files = data.files.map((file) => ({
    binary: false,
    contents: '',
    sizeExceeded: false,
    ...file,
    // 兼容 URL 保持业务会话文件身份，不能把本机 file-server 地址泄漏给页面。
    fileProxyUrl:
      file.fileProxyUrl &&
      parseStaticUrl(file.fileProxyUrl)?.cId === context.cId
        ? file.fileProxyUrl
        : `/api/computer/static/${context.cId}/${file.name
            .split('/')
            .map(encodeURIComponent)
            .join('/')}${
            options.customTargetDir || search?.customTargetDir
              ? `?customTargetDir=${encodeURIComponent(
                  (options.customTargetDir || search?.customTargetDir)!,
                )}`
              : ''
          }`,
    localFile: {
      contextId: context.contextId,
      cId: context.cId,
      path:
        options.customTargetDir || search?.customTargetDir
          ? `${(options.customTargetDir || search?.customTargetDir)!.replace(
              /[\\/]+$/,
              '',
            )}/${file.name}`
          : file.name,
    },
  }));
  return {
    code: SUCCESS_CODE,
    displayCode: SUCCESS_CODE,
    message: '',
    data: { ...data, files },
    debugInfo: {},
    success: true,
    tid: '',
  };
}

export function assertLocalFileReferenceCurrent(ref: LocalFileReference): void {
  const record = contexts.get(ref.cId);
  if (!record || record.disposed || record.context?.contextId !== ref.contextId)
    throw new LocalFileAccessError('expired');
}

/** 本机读写共用会话身份；已识别本机后，旧桥/停服/权限失败不得回云端写入。 */
export async function updateLocalFiles(
  cId: string | number,
  files: UpdateFileInfo[],
): Promise<RequestResponse<null> | null> {
  for (const file of files) {
    if (file.localFile) {
      if (file.localFile.cId !== String(cId))
        throw new LocalFileAccessError('expired');
      assertLocalFileReferenceCurrent(file.localFile);
    }
  }
  const record = contexts.get(String(cId));
  if (!record) {
    if (recentLocalSources.has(String(cId)))
      throw new LocalFileAccessError('expired');
    return null;
  }
  const generation = record.generation;
  const context = await record.pending;
  if (
    record.disposed ||
    record.generation !== generation ||
    contexts.get(String(cId)) !== record
  )
    throw new LocalFileAccessError('expired');
  if (!context) {
    if (recentLocalSources.get(String(cId)) === record.input.sandboxId)
      throw new LocalFileAccessError('unavailable');
    return null;
  }
  if (!record.writable || !record.api?.updateFiles)
    throw new LocalFileAccessError('unavailable');
  const changes: LocalFileChange[] = files.map((file) => {
    if (!file.operation) throw new LocalFileAccessError('invalid-argument');
    return {
      name: file.name,
      operation: file.operation,
      contents: file.contents,
      isDir: file.isDir,
      binary: file.binary,
      renameFrom: file.renameFrom,
    };
  });
  value(await record.api.updateFiles(context.contextId, changes));
  if (
    record.disposed ||
    record.generation !== generation ||
    contexts.get(String(cId)) !== record
  )
    throw new LocalFileAccessError('expired');
  changed();
  return {
    code: SUCCESS_CODE,
    displayCode: SUCCESS_CODE,
    message: '',
    data: null,
    debugInfo: {},
    success: true,
    tid: '',
  };
}

export async function prepareLocalFilePreview(
  input: string | LocalFileReference,
): Promise<(LocalFilePreview & { release(): void }) | null> {
  const target = await resolveTarget(input);
  if (!target) return null;
  const preview = value(await target.api.preparePreview!(target.ref));
  const record = contexts.get(target.ref.cId);
  if (
    !record ||
    record.disposed ||
    record.context?.contextId !== target.ref.contextId
  ) {
    safely(target.api.releasePreview?.(preview.grantId));
    throw new LocalFileAccessError('expired');
  }
  record.grants.add(preview.grantId);
  let released = false;
  return {
    ...preview,
    release() {
      if (released) return;
      released = true;
      record.grants.delete(preview.grantId);
      safely(target.api.releasePreview?.(preview.grantId));
    },
  };
}
export async function saveLocalFile(
  input: string | LocalFileReference,
  fileName?: string,
): Promise<boolean | undefined> {
  const target = await resolveTarget(input);
  if (!target) return undefined;
  const result = await target.api.saveFile!(target.ref, { fileName });
  assertLocalFileReferenceCurrent(target.ref);
  if (!result.success && result.code === 'canceled') return false;
  return !value(result).canceled;
}
export async function exportLocalWorkspace(
  cId: string | number,
): Promise<boolean | undefined> {
  const record = contexts.get(String(cId));
  if (!record) return undefined;
  const generation = record.generation;
  const context = await record.pending;
  if (record.disposed || record.generation !== generation)
    throw new LocalFileAccessError('expired');
  if (!context) return undefined;
  const result = await record.api!.exportWorkspace!(context.contextId);
  if (record.disposed || record.generation !== generation)
    throw new LocalFileAccessError('expired');
  if (!result.success && result.code === 'canceled') return false;
  return !value(result).canceled;
}
async function nativeFileAction(
  input: string | LocalFileReference,
  action: 'openPath' | 'revealInFolder',
): Promise<boolean | undefined> {
  const target = await resolveTarget(input);
  if (!target) return undefined;
  value(await target.api[action]!(target.ref));
  assertLocalFileReferenceCurrent(target.ref);
  return true;
}
export const openLocalFile = (input: string | LocalFileReference) =>
  nativeFileAction(input, 'openPath');
export const revealLocalFile = (input: string | LocalFileReference) =>
  nativeFileAction(input, 'revealInFolder');
