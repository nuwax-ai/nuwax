import { CreateUpdateModeEnum, DataTypeEnum } from '../enums/common';
import {
  BuildRunningEnum,
  PageDevelopCreateTypeEnum,
  PageProjectTypeEnum,
  ReverseProxyEnum,
} from '../enums/pageDev';
import { CustomPopoverItem } from './common';

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
  pageUri: string;
  name: string;
  description: string;
  args: {
    key: string;
    name: string;
    description: string;
    // 可用值:String,Integer,Number,Boolean,Object,Array_String,Array_Integer,Array_Number,Array_Boolean,Array_Object
    dataType: DataTypeEnum;
    require: boolean;
  }[];
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
  creatorAvatar: number;
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
  componentInfo: CustomPageDto | any;
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
  spaceId: number;
  defaultPageArgConfigs?: PageArgConfig[];
  open: boolean;
  onCancel: () => void;
}

/**
 * 添加（修改）路径参数弹窗Props
 */
export interface AddPathModalProps {
  mode: CreateUpdateModeEnum;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
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
