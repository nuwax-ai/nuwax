/**
 * 数据资源相关类型定义
 * 支持工作流、插件、反向代理等类型的资源管理
 */

/**
 * 数据资源类型枚举
 */
export enum DataResourceType {
  /** 工作流 */
  WORKFLOW = 'workflow',
  /** 插件 */
  PLUGIN = 'plugin',
  /** 反向代理 */
  REVERSE_PROXY = 'reverse_proxy',
}

/**
 * 数据资源状态枚举
 */
export enum DataResourceStatus {
  /** 活跃 */
  ACTIVE = 'active',
  /** 停用 */
  INACTIVE = 'inactive',
  /** 错误 */
  ERROR = 'error',
  /** 配置中 */
  CONFIGURING = 'configuring',
}

/**
 * 数据资源基础接口
 */
export interface DataResource {
  /** 是否选中 */
  isSelected?: boolean;
  /** 资源唯一标识 */
  id: number | string;
  /** 资源名称 */
  name: string;
  /** 资源描述 */
  description?: string;
  /** 资源类型 */
  type: DataResourceType;
  /** 资源状态 */
  status: DataResourceStatus;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 配置信息 */
  config?: Record<string, any>;
  /** 标签 */
  tags?: string[];
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 工作流资源配置
 */
export interface WorkflowConfig {
  /** 工作流文件路径 */
  filePath: string;
  /** 触发器类型 */
  triggerType: 'manual' | 'scheduled' | 'event';
  /** 调度配置 */
  schedule?: {
    cron: string;
    timezone: string;
  };
  /** 输入参数 */
  inputs?: Record<string, any>;
  /** 输出参数 */
  outputs?: Record<string, any>;
}

/**
 * 插件资源配置
 */
export interface PluginConfig {
  /** 插件包路径 */
  packagePath: string;
  /** 插件版本 */
  version: string;
  /** 插件入口 */
  entry: string;
  /** 插件配置 */
  settings: Record<string, any>;
  /** 依赖项 */
  dependencies?: string[];
}

/**
 * 反向代理资源配置
 */
export interface ReverseProxyConfig {
  /** 代理目标URL */
  targetUrl: string;
  /** 代理路径 */
  proxyPath: string;
  /** 请求头配置 */
  headers?: Record<string, string>;
  /** 超时设置 */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 认证配置 */
  auth?: {
    type: 'basic' | 'bearer' | 'api_key';
    credentials: Record<string, string>;
  };
}

/**
 * 创建数据资源请求参数
 */
export interface CreateDataResourceRequest {
  /** 资源名称 */
  name: string;
  /** 资源描述 */
  description?: string;
  /** 资源类型 */
  type: DataResourceType;
  /** 配置信息 */
  config: Record<string, any>;
  /** 标签 */
  tags?: string[];
}

/**
 * 更新数据资源请求参数
 */
export interface UpdateDataResourceRequest {
  /** 资源ID */
  id: string;
  /** 资源名称 */
  name?: string;
  /** 资源描述 */
  description?: string;
  /** 配置信息 */
  config?: Record<string, any>;
  /** 标签 */
  tags?: string[];
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 数据资源列表查询参数
 */
export interface DataResourceQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 资源类型 */
  type?: DataResourceType;
  /** 资源状态 */
  status?: DataResourceStatus;
  /** 搜索关键词 */
  keyword?: string;
  /** 标签 */
  tags?: string[];
}

/**
 * 数据资源列表响应
 */
export interface DataResourceListResponse {
  /** 资源列表 */
  data: DataResource[];
  /** 总数 */
  total: number;
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 数据资源操作结果
 */
export interface DataResourceOperationResult {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 数据 */
  data?: any;
}

/**
 * 数据资源类型配置
 */
export interface DataResourceTypeConfig {
  /** 类型标识 */
  type: DataResourceType;
  /** 显示名称 */
  displayName: string;
  /** 描述 */
  description: string;
  /** 图标 */
  icon: string;
  /** 颜色 */
  color: string;
  /** 配置表单字段 */
  formFields: FormField[];
}

/**
 * 表单字段配置
 */
export interface FormField {
  /** 字段名称 */
  name: string;
  /** 字段标签 */
  label: string;
  /** 字段类型 */
  type:
    | 'text'
    | 'password'
    | 'number'
    | 'select'
    | 'textarea'
    | 'switch'
    | 'upload';
  /** 是否必填 */
  required: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 默认值 */
  defaultValue?: any;
  /** 选项（用于select类型） */
  options?: { label: string; value: any }[];
  /** 验证规则 */
  rules?: any[];
  /** 帮助文本 */
  helpText?: string;
}
