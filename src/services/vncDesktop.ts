import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
import { RequestResponse } from '@/types/interfaces/request';
import type {
  EnsurePodResponse,
  FsChildrenResponse,
  FsRootsResponse,
  ISkillUploadFileParams,
  IUpdateStaticFileParams,
  IUploadFilesParams,
  RestartPodResponse,
  StaticFileListResponse,
} from '@/types/interfaces/vncDesktop';
import { exportFileViaBrowserDownload } from '@/utils/exportImportFile';
import { message } from 'antd';
import { request } from 'umi';

// 查询文件列表
export async function apiGetStaticFileList(
  cId: number,
  options?: {
    relativePath?: string;
    recursive?: boolean;
  },
): Promise<RequestResponse<StaticFileListResponse>> {
  return request('/api/computer/static/file-list', {
    method: 'GET',
    params: {
      cId,
      ...(options
        ? {
            relativePath: options.relativePath || '',
            recursive: options.recursive ?? false,
          }
        : {}),
    },
  });
}

// 有界实时搜索（服务端限时限量递归，limit/maxVisit/timeoutMs 为 file-server 必填项；
// 若网关未透传该端点会失败，调用方需准备本地过滤兜底）
export interface ISearchFilesParams {
  cId: number;
  kw: string;
  relativePath?: string;
  limit?: number;
  maxVisit?: number;
  timeoutMs?: number;
}

export interface SearchFilesResponse extends StaticFileListResponse {
  truncated?: boolean;
  visited?: number;
}

export async function apiSearchFiles(
  params: ISearchFilesParams,
): Promise<RequestResponse<SearchFilesResponse>> {
  const {
    cId,
    kw,
    relativePath = '',
    limit = 200,
    maxVisit = 20000,
    timeoutMs = 2000,
  } = params;
  return request('/api/computer/static/search-files', {
    method: 'GET',
    params: {
      cId,
      kw,
      relativePath,
      limit,
      maxVisit,
      timeoutMs,
    },
  });
}

// 静态文件访问
/**
 * @deprecated 占位实现，路径中的 `**` 为字面量、不可用（历史遗留）。
 * 单文件存在性检查请用 `apiGetStaticFileList(cId, { relativePath: 父目录,
 * recursive: false })`；文件内容请用 `fetchContentFromUrl(静态预览 URL)`。
 */
export async function apiGetStaticFileDetail(
  cId: number,
): Promise<RequestResponse<any>> {
  return request(`/api/computer/static/${cId}/**`, {
    method: 'GET',
  });
}

// 文件修改
export async function apiUpdateStaticFile(
  data: IUpdateStaticFileParams,
): Promise<RequestResponse<null>> {
  return request('/api/computer/static/files-update', {
    method: 'POST',
    data,
  });
}

// 上传技能文件
export async function apiUploadFile(
  params: ISkillUploadFileParams,
): Promise<RequestResponse<null>> {
  const { file, cId, filePath } = params;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cId', cId.toString());
  formData.append('filePath', filePath);

  return request('/api/computer/static/upload-file', {
    method: 'POST',
    data: formData,
  });
}

// 批量文件上传
export async function apiUploadFiles(
  params: IUploadFilesParams,
): Promise<RequestResponse<number>> {
  const { files, cId, filePaths } = params;
  const formData = new FormData();

  // 批量上传文件：将每个文件 append 到 FormData
  // 注意：多个文件使用相同的 key 'files'，后端会以数组形式接收
  files.forEach((file) => {
    formData.append('files', file);
  });

  // 添加技能ID
  formData.append('cId', cId.toString());

  // 批量添加文件路径：将每个路径 append 到 FormData
  // 注意：多个路径使用相同的 key 'filePaths'，后端会以数组形式接收
  filePaths.forEach((filePath) => {
    formData.append('filePaths', filePath);
  });

  return request('/api/computer/static/upload-files', {
    method: 'POST',
    data: formData,
  });
}

// 下载全部文件
export async function apiDownloadAllFiles(cId: number): Promise<void> {
  try {
    // 获取导出文件链接地址
    const linkUrl = `${process.env.BASE_URL}/api/computer/static/download-all-files?cId=${cId}`;
    // 通过浏览器下载文件
    exportFileViaBrowserDownload(linkUrl);
    message.success(t('PC.Pages.Chat.exportSuccess'));
  } catch (error) {
    console.error('Failed to export project:', error);
  }
}

/** 全栈应用环境，仅 AppDevPro 调用 computer/pod 老接口时传入 */
export type ComputerPodAppStage = 'dev' | 'prod';

const ENSURE_POD_THROTTLE_MS = 5000;
let lastSuccessfulEnsurePod: { key: string; time: number } | null = null;
const ensurePodInFlightMap = new Map<
  string,
  Promise<RequestResponse<EnsurePodResponse>>
>();

/**
 * 组装 computer/pod 请求参数：仅在传入 appStage 时附加，避免老页面带上空字段。
 * @param cId 会话 ID
 * @param appStage 全栈应用环境，仅 AppDevPro 传入
 */
const buildPodRequestParams = (cId: number, appStage?: ComputerPodAppStage) =>
  appStage ? { cId, appStage } : { cId };

/** ensure 限流/并发去重 key：同一会话的 dev/prod 互不影响 */
const getEnsurePodCacheKey = (cId: number, appStage?: ComputerPodAppStage) =>
  appStage ? `${cId}:${appStage}` : String(cId);

/** ensure 请求被 5s 限流（通常因 VNC/终端等刚调过 ensure，容器已在运行） */
export const isEnsurePodThrottledError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('too frequent');
};

// 启动容器
export async function apiEnsurePod(
  cId: number,
  appStage?: ComputerPodAppStage,
): Promise<RequestResponse<EnsurePodResponse>> {
  const now = Date.now();
  const cacheKey = getEnsurePodCacheKey(cId, appStage);
  const inFlightRequest = ensurePodInFlightMap.get(cacheKey);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  if (
    lastSuccessfulEnsurePod?.key === cacheKey &&
    now - lastSuccessfulEnsurePod.time < ENSURE_POD_THROTTLE_MS
  ) {
    console.log('Requests are too frequent. Please retry after 5s');
    return Promise.reject(
      new Error('Requests are too frequent. Please retry after 5s'),
    );
  }

  const ensureRequest = request('/api/computer/pod/ensure', {
    method: 'POST',
    params: buildPodRequestParams(cId, appStage),
  })
    .then((result: RequestResponse<EnsurePodResponse>) => {
      if (result.code === SUCCESS_CODE) {
        lastSuccessfulEnsurePod = { key: cacheKey, time: Date.now() };
      }
      return result;
    })
    .finally(() => {
      ensurePodInFlightMap.delete(cacheKey);
    });

  ensurePodInFlightMap.set(cacheKey, ensureRequest);
  return ensureRequest;
}

// 重启容器(销毁后重建)
export async function apiRestartPod(
  cId: number,
  appStage?: ComputerPodAppStage,
): Promise<RequestResponse<RestartPodResponse>> {
  return request('/api/computer/pod/restart', {
    method: 'POST',
    params: buildPodRequestParams(cId, appStage),
  });
}

// 重启智能体
export async function apiRestartAgent(
  cId: number,
  appStage?: ComputerPodAppStage,
): Promise<RequestResponse<null>> {
  return request(`/api/computer/agent/stop/${cId}`, {
    method: 'POST',
    params: appStage ? { appStage } : undefined,
  });
}

// 容器保活
export async function apiKeepalivePod(
  cId: number,
  appStage?: ComputerPodAppStage,
): Promise<RequestResponse<EnsurePodResponse>> {
  return request('/api/computer/pod/keepalive', {
    method: 'POST',
    params: buildPodRequestParams(cId, appStage),
  });
}

/**
 * 检测 VNC 桌面是否就绪
 * 通过后端代理请求，绕过 CORS 限制
 */
export interface VncStatusResponse {
  vnc_ready: boolean;
  novnc_ready: boolean;
  message: string;
  uptime_seconds?: number;
  container_id?: string;
}

export async function apiCheckVncStatus(
  cId: number,
  appStage?: ComputerPodAppStage,
): Promise<RequestResponse<VncStatusResponse>> {
  return request('/api/computer/pod/vnc-status', {
    method: 'GET',
    params: buildPodRequestParams(cId, appStage),
  });
}

export interface IImportProjectParams {
  // 会话ID
  cId: number;
  // 文件
  file: File;
  // 自定义目标目录
  customTargetDir?: string;
}

/**
 * 导入项目
 * 上传 zip 包替换工作空间文件，保留 .git/.agents/.claude/.codex/.opencode/.tmp/.logs
 */
export async function apiImportProject(
  params: IImportProjectParams,
): Promise<RequestResponse<null>> {
  const { file, cId, customTargetDir } = params;
  const formData = new FormData();
  formData.append('cId', cId.toString());
  formData.append('file', file);

  if (customTargetDir) {
    formData.append('customTargetDir', customTargetDir);
  }

  return request('/api/computer/static/import-project', {
    method: 'POST',
    data: formData,
  });
}

/**
 * 目录选择弹窗数据源（wiki「选择目录/弹框选目录」，2026-09-10 契约）：
 * 按绝对路径浏览个人电脑目录，不锚定工作区、不带会话上下文。
 *
 * 网关要求 sandboxId，必须指向当前选中的个人电脑。
 */

/** 根列表（包含根目录和用户 home），目录选择弹窗入口 */
export async function apiBrowseFsRoots(
  sandboxId: string,
): Promise<RequestResponse<FsRootsResponse>> {
  return request('/api/computer/fs/roots', {
    method: 'GET',
    params: { sandboxId },
  });
}

/** 列出指定绝对路径下的一层子项 */
export async function apiBrowseFsChildren(
  path: string,
  sandboxId: string,
): Promise<RequestResponse<FsChildrenResponse>> {
  return request('/api/computer/fs/children', {
    method: 'GET',
    params: { path, sandboxId },
  });
}
