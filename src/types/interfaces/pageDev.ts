import { CreateUpdateModeEnum } from '../enums/common';
import {
  BuildRunningEnum,
  PageDevelopCreateTypeEnum,
  PageProjectTypeEnum,
  ReverseProxyEnum,
} from '../enums/pageDev';
import { BindConfigWithSub, CustomPopoverItem } from './common';

/**
 * 反向代理配置
 */
export interface ProxyConfig {
  // 唯一标识
  key: string;
  // 可用值:dev,prod
  env: ReverseProxyEnum;
  path: string;
  backends: {
    backend: string;
    weight: number;
  }[];
  healthCheckPath: string;
  requireAuth: boolean;
}

// 页面参数配置
export interface PageArgConfig {
  /** 页面ID */
  pageId?: number;
  /** 页面基础路径 */
  basePath?: string;
  // 页面路径，例如 /view
  pageUri: string;
  // 页面名称
  name: string;
  // 页面描述
  description: string;
  // 参数配置
  args: BindConfigWithSub[];
}

// 自定义页面项目信息
export interface CustomPageDto {
  // 项目ID
  projectId: number;
  // 项目ID字符串（因为后端接口返回的projectId太大时，精度丢失了）
  projectIdStr: string;
  // 调试关联智能体ID
  devAgentId?: number;
  // 项目名称
  name: string;
  // 项目描述
  description: string;
  // 项目图标
  icon: string;
  // 项目基础路径
  basePath: string;
  // 发布状态,1:已发布;-1:未发布
  buildRunning: BuildRunningEnum;
  // 项目类型,可用值:REVERSE_PROXY,ONLINE_DEPLOY
  projectType: PageProjectTypeEnum;
  // 代理配置
  proxyConfigs: ProxyConfig[];
  // 页面参数配置
  pageArgConfigs: PageArgConfig[];
  // 扩展字段
  ext: any;
  // 租户ID
  tenantId: number;
  // 空间ID
  spaceId: number;
  // 创建时间
  created: string;
  // 创建者ID
  creatorId: number;
  // 创建者名称
  creatorName: string;
  // 创建者昵称
  creatorNickName: string;
  // 创建者头像
  creatorAvatar: string;
  // 页面URL
  pageUrl: string;
}

// 上传前端项目压缩包并启动开发服务器参数
export interface PageUploadAndStartParams {
  // 项目名称
  projectName: string;
  // 项目描述
  projectDesc: string;
  // 项目压缩包文件
  file?: any;
  // 空间ID
  spaceId: number;
  // 项目图标
  icon: string;
}

// 绑定开发智能体参数
export interface CustomPageBindDevAgentParams {
  // 项目ID
  projectId: number;
  // 开发智能体ID
  devAgentId: number;
  // 空间ID
  spaceId: number;
}

// 配置反向代理参数
export interface PageBatchConfigProxyParams {
  // 项目ID
  projectId: number;
  // 反向代理配置
  proxyConfigs: ProxyConfig[];
}

// 添加路径配置参数
export interface PageAddPathParams {
  // 项目ID
  projectId: number;
  // 页面路径,示例值(/view)
  pageUri: string;
  // 页面名称,示例值(查看页面)
  name: string;
  // 页面描述,示例值(用于查看数据的页面)
  description: string;
  // 页面参数配置
  args: BindConfigWithSub[];
}

export interface PageDeletePathParams {
  // 项目ID
  projectId: number;
  // 页面路径,示例值(/view)
  pageUri: string;
}

// 上传前端项目压缩包并启动开发服务器返回值
export interface CreateCustomPageInfo {
  // 项目ID
  projectId: number;
  // 项目ID字符串（因为后端接口返回的projectId太大时，精度丢失了）
  projectIdStr: string;
  // 开发服务器URL
  devServerUrl: string;
}

// 单个页面开发组件
export interface PageDevelopCardItemProps {
  componentInfo: CustomPageDto;
  onClick: () => void;
  onClickMore: (item: CustomPopoverItem) => void;
}

/**
 * 调试智能体绑定弹窗Props
 */
export interface DebugAgentBindModalProps {
  spaceId: number;
  defaultDevAgentId?: number;
  // 项目ID
  projectId: string;
  open: boolean;
  onCancel: () => void;
}

/**
 * 页面创建弹窗Props
 */
export interface PageCreateModalProps {
  spaceId: number;
  type: PageDevelopCreateTypeEnum;
  open: boolean;
  onCancel: () => void;
  onConfirm: (info: CreateCustomPageInfo) => void;
}

/**
 * 路径参数配置弹窗Props
 */
export interface PathParamsConfigModalProps {
  projectId: string;
  defaultPageArgConfigs?: PageArgConfig[];
  open: boolean;
  onCancel: () => void;
}

/**
 * 添加（修改）路径参数弹窗Props
 */
export interface AddPathModalProps {
  projectId: string;
  mode: CreateUpdateModeEnum;
  // 编辑路径参数信息
  editPathInfo: PageArgConfig | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (
    info: PageAddPathParams,
    editPathInfo: PageArgConfig | null,
  ) => void;
}

/**
 * 反向代理弹窗Props
 */
export interface ReverseProxyModalProps {
  open: boolean;
  projectId: string;
  defaultProxyConfigs?: ProxyConfig[];
  onCancel: () => void;
}

/**
 * 反向代理内容配置Props
 */
export interface ReverseProxyContentConfigProps {
  projectId: string;
  // 当前反向代理类型 可用值:dev,prod
  reverseProxyType: ReverseProxyEnum;
  // 所有的反向代理配置（包括开发环境和生产环境）
  proxyConfigs?: ProxyConfig[];
  onConfirm: (proxyConfigs: ProxyConfig[]) => void;
}
