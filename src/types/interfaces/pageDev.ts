import { CustomPopoverItem } from './common';

// 自定义页面项目信息
export interface CustomPageDto {
  projectId: number;
  // 项目名称
  projectName: string;
  // 项目描述
  projectDesc: string;
  // 空间ID
  spaceId: number;
  // 用户ID
  userId: number;
  // 构建运行状态
  buildRunning: number;
  // 创建时间
  created: string;
}

// 上传前端项目压缩包并启动开发服务器参数
export interface PageUploadAndStartParams {
  // 项目名称
  projectName: string;
  // 项目描述
  projectDesc: string;
  // 项目基础路径
  basePath: string;
  // 项目压缩包文件
  file: string;
}

// 在线创建用户前端页面项目参数
export type CustomPageCreateParams = CustomPageDto;

// 上传前端项目压缩包并启动开发服务器返回值
export interface CreateCustomPageInfo {
  // 项目ID
  projectId: number;
  // 开发服务器URL
  devServerUrl: string;
}

// 单个页面开发组件
export interface PageDevelopCardItemProps {
  componentInfo: CustomPageDto | any;
  onClick: () => void;
  onClickMore: (item: CustomPopoverItem) => void;
}
