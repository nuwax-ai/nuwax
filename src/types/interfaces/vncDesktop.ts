/**
 * 静态文件相关类型定义
 */
export interface StaticFileInfo {
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
}

// 静态文件列表
export interface StaticFileListResponse {
  // 文件列表
  files: StaticFileInfo[];
}

// 静态文件修改参数
export interface IUpdateStaticFileParams {
  // 会话ID
  cId: number;
  // 文件列表
  files: {
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
  }[];
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
