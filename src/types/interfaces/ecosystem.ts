/**
 * 生态系统相关接口定义
 * 包含客户端配置查询、分页查询等相关类型定义
 */

import { AgentComponentTypeEnum } from '../enums/agent';

/**
 * 排序字段信息
 */
export interface OrderItem {
  /** 排序字段名 */
  column: string;
  /** 是否升序，true: 升序，false: 降序 */
  asc: boolean;
}

/**
 * 列的筛选条件
 */
export interface ComparisonExpression {
  /** 筛选字段名 */
  column: string;
  /** 操作符 */
  operator: string;
  /** 筛选值 */
  value: any;
}
export interface FetchPluginListParams {
  tabType: EcosystemTabTypeEnum;
  keyword: string;
  page: number;
  pageSize: number;
  shareStatus?: number;
  categoryCode?: string;
}
/**
 * 表格列扩展配置
 */
export interface ColumnExt {
  /** 列固定位置 */
  fixed?: string;
  /** 是否可见 */
  visible?: boolean;
  /** 子标签 */
  subLabel?: string;
  /** 列宽度 */
  width?: string;
  /** 最小宽度 */
  minWidth?: string;
  /** 是否可设置 */
  settable?: boolean;
  /** 对齐方式 */
  align?: string;
  /** 格式化器 */
  formatter?: string;
  /** 提示信息 */
  tips?: string;
  /** 是否省略 */
  ellipsis?: boolean;
}

/**
 * 表格列信息
 */
export interface SuperTableColumn {
  /** 序号 */
  serialNumber?: number;
  /** 列标签 */
  label?: string;
  /** 列名称 */
  name?: string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 提示信息 */
  tips?: string;
  /** 扩展配置 */
  ext?: ColumnExt;
}

/**
 * 客户端配置查询请求DTO
 */
export interface ClientConfigQueryRequest {
  /** 名称，模糊查询 */
  name?: string;
  /** 市场类型，1:插件;2:模板;3:MCP */
  dataType?: number;
  /** tab类型: 1: 全部; 2: 启用的;3:我的分享 */
  subTabType?: number;
  /** 细分类型，比如: 插件,智能体,工作流 */
  targetType?: string;
  /** 分类编码 */
  categoryCode?: string;
  /** 分享状态，1:草稿;2:审核中;3:已发布;4:已下线;5:驳回 */
  shareStatus?: number;
  /** 作者信息，模糊查询 */
  author?: string;
}

/**
 * 客户端配置详情请求DTO
 */
export interface ClientConfigDetailReqDTO {
  /** 配置UID */
  uid: string;
}

/**
 * 分页查询VO
 */
export interface PageQueryVoClientConfigQueryRequest {
  /** 查询过滤条件 */
  queryFilter?: ClientConfigQueryRequest;
  /** 当前页 */
  current?: number;
  /** 分页大小 */
  pageSize?: number;
  /** 排序字段信息，可空，一般没有默认为创建时间排序 */
  orders?: OrderItem[];
  /** 列的筛选条件，可空 */
  filters?: ComparisonExpression[];
  /** 表格的列信息，可空 */
  columns?: SuperTableColumn[];
}

/**
 * 客户端配置响应VO
 */
export interface ClientConfigVo {
  /** 主键id */
  id?: number;
  /** 唯一ID，分布式唯一UUID */
  uid?: string;
  /** 名称 */
  name?: string;
  /** 描述 */
  description?: string;
  /** 市场类型，默认插件，1:插件;2:模板;3:MCP */
  dataType?: EcosystemDataTypeEnum;
  /** 细分类型，比如: 插件,智能体,工作流 */
  targetType?: AgentComponentTypeEnum;
  /** 具体目标的id，可以智能体,工作流,插件,还有mcp等 */
  targetId?: number;
  /** 分类编码，商业服务等，通过接口获取 */
  categoryCode?: string;
  /** 分类名称，商业服务等，通过接口获取 */
  categoryName?: string;
  /** 是否我的分享，0:否(生态市场获取的);1:是(我的分享) */
  ownedFlag?: number;
  /** 分享状态，1:草稿;2:审核中;3:已发布;4:已下线;5:驳回 */
  shareStatus?: EcosystemShareStatusEnum;
  /** 使用状态，1:启用;2:禁用 */
  useStatus?: number;
  /** 发布时间 */
  publishTime?: string;
  /** 下线时间 */
  offlineTime?: string;
  /** 版本号，自增，发布一次增加1，初始值为1 */
  versionNumber?: number;
  /** 作者信息 */
  author?: string;
  /** 发布文档 */
  publishDoc?: string;
  /** 服务器端最新版本号 */
  serverConfigParamJson?: any;
  /** 请求参数配置json */
  configParamJson?: any;
  /** 本地配置参数json */
  localConfigParamJson?: any;
  serverConfigJson?: any;
  /** 配置json，存储插件的配置信息如果有其他额外的信息保存放这里 */
  configJson?: any;
  /** 图标图片地址 */
  icon?: string;
  /** 租户ID */
  tenantId?: number;
  /** 所属空间ID */
  spaceId?: number;
  /** 创建者的客户端ID */
  createClientId?: string;
  /** 创建时间 */
  created?: string;
  /** 创建人id */
  creatorId?: number;
  /** 创建人 */
  creatorName?: string;
  /** 更新时间 */
  modified?: string;
  /** 最后修改人id */
  modifiedId?: number;
  /** 最后修改人 */
  modifiedName?: string;
  /** 是否有新版本，true:是;false:否 */
  isNewVersion?: boolean;
  /** 服务器端最新版本号 */
  serverVersionNumber?: number;
}

/**
 * 分页响应数据
 */
export interface IPageClientConfigVo {
  /** 分页大小 */
  size?: number;
  /** 客户端配置响应VO列表 */
  records?: ClientConfigVo[];
  /** 总记录数 */
  total?: number;
  /** 当前页 */
  current?: number;
  /** 总页数 */
  pages?: number;
}

/**
 * 客户端配置列表查询响应
 */
export interface ClientConfigListResponse {
  /** 业务状态码，0000 表示成功，其余失败 */
  code: string;
  /** 源系统状态码，用于问题跟踪 */
  displayCode: string;
  /** 错误描述信息 */
  message: string;
  /** 响应数据 */
  data: IPageClientConfigVo;
  /** 跟踪唯一标识 */
  tid: string;
  /** 是否成功 */
  success: boolean;
}

/**
 * 客户端配置详情查询响应
 */
export interface ClientConfigDetailResponse {
  /** 业务状态码，0000 表示成功，其余失败 */
  code: string;
  /** 源系统状态码，用于问题跟踪 */
  displayCode: string;
  /** 错误描述信息 */
  message: string;
  /** 响应数据 */
  data: ClientConfigVo;
  /** 跟踪唯一标识 */
  tid: string;
  /** 是否成功 */
  success: boolean;
}

/**
 * 数据类型枚举
 */
export enum EcosystemDataTypeEnum {
  /** 插件 */
  PLUGIN = 1,
  /** 模板 */
  TEMPLATE = 2,
  /** MCP */
  MCP = 3,
}

/**
 * Tab类型枚举
 */
export enum EcosystemSubTabTypeEnum {
  /** 全部 */
  ALL = 1,
  /** 启用的 */
  ENABLED = 2,
  /** 我的分享 */
  MY_SHARE = 3,
}

/**
 * Tab类型枚举
 */
export enum EcosystemTabTypeEnum {
  ALL = 'all',
  ENABLED = 'enabled',
  SHARED = 'shared',
}

/**
 * 分享状态枚举
 */
export enum EcosystemShareStatusEnum {
  /** 草稿 */
  DRAFT = 1,
  /** 审核中 */
  REVIEWING = 2,
  /** 已发布 */
  PUBLISHED = 3,
  /** 已下线 */
  OFFLINE = 4,
  /** 驳回 */
  REJECTED = 5,
}

/**
 * 使用状态枚举
 */
export enum EcosystemUseStatusEnum {
  /** 启用 */
  ENABLED = 1,
  /** 禁用 */
  DISABLED = 2,
}

/**
 * 拥有标识枚举
 */
export enum EcosystemOwnedFlagEnum {
  /** 否(生态市场获取的) */
  NO = 0,
  /** 是(我的分享) */
  YES = 1,
}

/**
 * 客户端配置保存请求DTO
 */
export interface ClientConfigSaveReqDTO {
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 市场类型，1:插件;2:模板;3:MCP */
  dataType: number;
  /** 细分类型，比如: 插件,智能体,工作流 */
  targetType?: string;
  /** 具体目标的id，可以智能体,工作流,插件,还有mcp等 */
  targetId?: number;
  /** 分类编码，商业服务等，通过接口获取 */
  categoryCode?: string;
  /** 分类名称，商业服务等，通过接口获取 */
  categoryName?: string;
  /** 使用状态，1:启用;2:禁用 */
  useStatus?: number;
  /** 作者信息 */
  author?: string;
  /** 发布文档 */
  publishDoc?: string;
  /** 请求参数配置json */
  configParamJson?: string;
  /** 配置json，存储插件的配置信息如果有其他额外的信息保存放这里 */
  // configJson?: string;
  /** 图标图片地址 */
  icon?: string;
  /** 配置唯一标识 */
  uid?: string;
}

/**
 * 客户端配置更新草稿请求DTO
 */
export interface ClientConfigUpdateDraftReqDTO {
  /** 配置唯一标识 */
  uid: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 市场类型，1:插件;2:模板;3:MCP */
  dataType: number;
  /** 细分类型，比如: 插件,智能体,工作流 */
  targetType?: string;
  /** 具体目标的id，可以智能体,工作流,插件,还有mcp等 */
  targetId?: number;
  /** 分类编码，商业服务等，通过接口获取 */
  categoryCode?: string;
  /** 分类名称，商业服务等，通过接口获取 */
  categoryName?: string;
  /** 使用状态，1:启用;2:禁用 */
  useStatus?: number;
  /** 作者信息 */
  author?: string;
  /** 发布文档 */
  publishDoc?: string;
  /** 请求参数配置json */
  configParamJson?: string;
  /** 配置json，存储插件的配置信息如果有其他额外的信息保存放这里 */
  configJson?: string;
  /** 图标图片地址 */
  icon?: string;
}

// 生态市场详情抽屉组件props
export interface EcosystemDetailDrawerProps {
  /** 是否显示抽屉 */
  visible: boolean;
  /** 插件详情数据 */
  data?: EcosystemDetailDrawerData;
  /** 关闭抽屉回调 */
  onClose: () => void;
  /** 更新配置并启用回调 */
  onUpdateAndEnable?: (values: any[], configJson?: string) => Promise<boolean>;
  /** 停用回调 */
  onDisable?: () => Promise<boolean>;
}

// 生态市场详情信息
export interface EcosystemDetailDrawerData {
  /** 插件图标URL */
  icon: string;
  /** 插件作者 */
  author: string;
  /** 插件标题 */
  title: string;
  /** 插件描述 */
  description: string;
  /** 自定义类名 */
  className?: string;
  /** 是否启用 */
  isEnabled?: boolean;
  /** 使用文档 */
  publishDoc?: string;
  /** 是否是新版本 */
  isNewVersion?: boolean;
  /** 数据类型 */
  dataType?: EcosystemDataTypeEnum;
  /** 服务端MCP配置信息 */
  serverConfigJson?: string;
  /** 配置信息 */
  configJson?: string;
  /** 配置参数信息 */
  configParamJson: string;
  /** 本地配置信息(之前 版本) */
  localConfigParamJson?: string;
  /** 是否我的分享,0:否(生态市场获取的);1:是(我的分享)*/
  ownedFlag?: EcosystemOwnedFlagEnum;
  /** 组件类型 */
  targetType: AgentComponentTypeEnum;
}
