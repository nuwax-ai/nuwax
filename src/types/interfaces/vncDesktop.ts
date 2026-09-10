import { UpdateFileInfo } from './fileTree';

/**
 * 静态文件相关类型定义
 */
export interface StaticFileInfo {
  // 文件ID(自定义文件ID)
  fileId?: string;
  // 文件名称
  name: string;
  // 是否为二进制文件
  binary: boolean;
  // 文件大小是否超过限制
  sizeExceeded: boolean;
  // 文件内容
  contents: string;
  // 文件代理URL
  fileProxyUrl: string;
  // 是否为目录
  isDir: boolean;
  // 是否为链接文件(针对linux系统中的软链接文件，由会话过程由AI自动生成的文件, 此类型的文件不支持预览)
  isLink?: boolean;
}

// 静态文件列表
export interface StaticFileListResponse {
  // 文件列表
  files: StaticFileInfo[];
  // 本次实际执行的模式回显（file-server）：单层查询生效时为 false；
  // 缺省/为 true 表示返回的是全量递归列表（网关未透传或旧后端）
  recursive?: boolean;
}

/**
 * 目录选择弹窗（wiki「选择目录/弹框选目录」）：GET /api/computer/fs/roots、
 * GET /api/computer/fs/children，按绝对路径浏览本机目录，不锚定工作区、
 * 不带会话上下文（file-server v1.4.3 fsBrowserUtils）。
 */
export interface FsRootItem {
  // 展示名（如盘符 / 根名）
  name: string;
  // 绝对路径
  path: string;
  isDir: boolean;
}

export interface FsRootsResponse {
  roots: FsRootItem[];
  /** 用户主目录快捷入口（绝对路径），由前端并入根列表展示 */
  home?: string;
}

export interface FsEntryItem {
  name: string;
  // 子项绝对路径（file-server 直接回传，前端无需自行拼接）
  path: string;
  isDir: boolean;
  isSymlink?: boolean;
}

export interface FsChildrenResponse {
  path: string;
  entries: FsEntryItem[];
}

// 静态文件修改参数
export interface IUpdateStaticFileParams {
  // 会话ID
  cId: number;
  // 文件列表
  files: UpdateFileInfo[];
}

// 静态文件上传参数
export interface ISkillUploadFileParams {
  // 文件
  file: File;
  // 会话ID
  cId: number;
  // 文件路径
  filePath: string;
}

// 批量上传文件参数
export interface IUploadFilesParams {
  // 文件列表
  files: File[];
  // 会话ID
  cId: number;
  // 文件路径列表
  filePaths: string[];
}

// 容器信息
export interface VncDesktopContainerInfo {
  // 容器ID
  container_id: string;
  // 容器IP地址
  container_ip: string;
  // 容器名称
  container_name: string;
  // 服务URL
  service_url: string;
  // 容器状态
  status: string;
}

// 启动容器响应
export interface EnsurePodResponse {
  // 容器是否已存在
  existed: boolean;
  // 容器是否已创建
  created: boolean;
  current_activity_time: string;
  message: string;
  previous_activity_time: string;
  time_until_cleanup: number;
  // 远程桌面容器信息
  container_info: VncDesktopContainerInfo;
}

// 重启容器响应
export interface RestartPodResponse {
  // 远程桌面容器信息
  container_info: VncDesktopContainerInfo;
  // 容器是否已重启
  restarted: boolean;
  // 容器是否已存在
  was_existing: boolean;
  message: string;
}
