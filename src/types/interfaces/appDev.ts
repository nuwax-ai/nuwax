/**
 * AppDev 相关类型定义
 * 基于OpenAPI规范的用户前端页面项目内容接口
 */

import type { RequestResponse } from '@/types/interfaces/request';

/**
 * 项目文件信息接口
 */
export interface ProjectFileInfo {
  /** 文件名 */
  name: string;
  /** 文件内容 */
  contents?: string;
  /** 是否为二进制文件 */
  binary: boolean;
  /** 文件大小 */
  size: number;
}

/**
 * 查询项目文件内容响应接口
 */
export interface ProjectContentRes {
  /** 项目文件内容对象 */
  files: Record<string, any> | ProjectFileInfo[];
}

/**
 * 查询项目文件内容请求参数接口
 */
export interface GetProjectContentParams {
  /** 项目ID */
  projectId: number;
}

/**
 * 查询项目文件内容API响应类型
 */
export type GetProjectContentResponse = RequestResponse<ProjectContentRes>;

/**
 * 开发环境状态枚举
 */
export enum DevServerStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  STARTING = 'starting',
  ERROR = 'error',
}

/**
 * 开发服务器信息接口
 */
export interface DevServerInfo {
  /** 项目ID */
  projectId: string | number;
  /** 服务器状态 */
  status: DevServerStatus;
  /** 服务器URL */
  devServerUrl?: string;
  /** 端口号 */
  port?: number;
}

/**
 * 项目构建信息接口
 */
export interface BuildInfo {
  /** 项目ID */
  projectId: string | number;
  /** 构建ID */
  buildId: string;
  /** 构建状态 */
  status: 'running' | 'completed' | 'failed';
  /** 构建耗时（秒） */
  buildTime?: number;
}

/**
 * 创建项目参数接口
 */
export interface CreateProjectParams {
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description?: string;
  /** 项目模板 */
  template?: string;
  /** 项目框架 */
  framework?: string;
}

/**
 * 上传并启动项目参数接口
 */
export interface UploadAndStartProjectParams {
  /** 项目压缩包文件 */
  file: File;
  /** 项目名称 */
  projectName: string;
}

/**
 * 页面文件信息接口（用于提交文件修改）
 */
export interface PageFileInfo {
  /** 文件名 */
  name: string;
  /** 文件内容 */
  contents?: string;
  /** 是否为二进制文件 */
  binary: boolean;
  /** 文件大小是否超限 */
  sizeExceeded?: boolean;
}

/**
 * 提交项目修改请求参数接口
 */
export interface SubmitFilesParams {
  /** 项目ID */
  projectId: number;
  /** 文件列表 */
  files: PageFileInfo[];
}

/**
 * 提交项目修改API响应类型
 */
export type SubmitFilesResponse = RequestResponse<Record<string, any>>;
