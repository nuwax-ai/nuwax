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
}

// 虚拟桌面（会话）更新文件信息
export interface VncDesktopUpdateFileInfo {
  // 文件名称
  name: string;
  // 是否为二进制文件
  binary: boolean;
  // 文件大小是否超过限制
  sizeExceeded: boolean;
  // 文件内容
  contents: string;
  // 重命名之前的文件名
  renameFrom: string;
  // 操作类型
  operation: string;
  // 是否目录
  isDir: boolean;
}

// 静态文件修改参数
export interface IUpdateStaticFileParams {
  // 会话ID
  cId: number;
  // 文件列表
  files: VncDesktopUpdateFileInfo[];
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
