import type {
  HttpContentTypeEnum,
  HttpMethodEnum,
  PublishStatusEnum,
} from '@/types/enums/common';
import type {
  CodeLangEnum,
  PluginPublishScopeEnum,
  PluginTypeEnum,
} from '@/types/enums/plugin';
import type { BindConfigWithSub, CreatorInfo } from '@/types/interfaces/agent';

// 插件试运行输入参数
export interface PluginTestParams {
  // 请求ID
  requestId: string;
  // 插件ID
  pluginId: number;
  // 插件参数
  params: object;
}

// 插件试运行输出结果
export interface PluginTestResult {
  // 	执行结果状态
  success: boolean;
  // 执行结果
  result: object;
  // 执行日志
  logs: string[];
  // 执行错误信息
  error: string;
  // 请求ID
  requestId: string;
  // 请求耗时
  costTime: number;
}

// 插件发布输入参数
export interface PluginPublishParams {
  // 插件ID
  pluginId: number;
  // 发布范围，Space 空间；Tenant 租户全局；Global 系统全局。目前UI上的"全局"指的是租户全局
  scope: PluginPublishScopeEnum;
  remark: string;
}

// 插件请求配置
export interface PluginRequestConfig {
  // 请求方法,可用值:POST,GET,PUT,DELETE
  method: HttpMethodEnum;
  // 请求地址
  url: string;
  // 请求内容格式,可用值:JSON,FORM_DATA,X_WWW_FORM_URLENCODED,OTHER
  contentType: HttpContentTypeEnum;
  // 请求超时时间
  timeout: number;
}

// 更新HTTP插件配置接口
export interface PluginHttpUpdateParams {
  // 插件ID
  id: number;
  // 插件名称
  name: string;
  // 插件描述
  description: string;
  // 插件图标
  icon: string;
  // 插件配置
  config: PluginRequestConfig & {
    // 节点入参
    inputArgs: BindConfigWithSub[];
    // 节点出参
    outputArgs: BindConfigWithSub[];
  };
}

// 更新代码插件配置输入参数
export interface PluginCopyUpdateParams {
  // 插件ID
  id: number;
  // 插件名称
  name: string;
  // 插件描述
  description: string;
  // 插件图标
  icon: string;
  // 插件配置
  config: {
    // 节点入参
    inputArgs: BindConfigWithSub[];
    // 节点出参
    outputArgs: BindConfigWithSub[];
    // 代码
    code: string;
  };
}

// 新增插件输入参数
export interface PluginAddParams {
  // 空间ID
  spaceId: number;
  // 创建人ID
  creatorId: number;
  // 插件名称
  name: string;
  // 插件描述
  description: string;
  // 插件图标
  icon: string;
  // 插件类型,可用值:HTTP,CODE
  type: PluginTypeEnum;
  // 插件代码语言,可用值:Python,JavaScript
  codeLang: CodeLangEnum;
}

// 插件信息
export interface PluginInfo {
  id: number;
  spaceId: number;
  creatorId: number;
  name: string;
  description: string;
  icon: string;
  // 插件类型,可用值:HTTP,CODE
  type: PluginTypeEnum;
  // 插件代码语言,可用值:Python,JavaScript
  codeLang: CodeLangEnum;
  // 插件发布状态,可用值:Developing,Applying,Published,Rejected
  publishStatus: PublishStatusEnum;
  config: object;
  modified: string;
  created: string;
  // 创建者信息
  creator: CreatorInfo;
}

export interface PluginHeaderProps {
  pluginInfo: PluginInfo;
  onEdit: () => void;
  onToggleHistory: () => void;
  onSave: () => void;
  onTryRun: () => void;
  onPublish: () => void;
}
