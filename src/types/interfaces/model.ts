import type {
  ModelApiProtocolEnum,
  ModelFunctionCallEnum,
  ModelNetworkTypeEnum,
  ModelScopeEnum,
  ModelStrategyEnum,
  ModelTypeEnum,
  ModelUsageScenarioEnum,
} from '@/types/enums/modelConfig';
import { AccessControlEnum } from '@/types/enums/systemManage';
import type { CreatorInfo } from '@/types/interfaces/agent';
import type { ConversationChatResponse } from './conversationInfo';

// 定义模型列表
export interface ModelListItemProps {
  // 模型的图标
  icon: string;
  // 模型的名称
  name: string;
  // 生效范围
  scope: string;
  // 模型的简介
  description: string;
  // 值
  id: number;
  // 模型的表示
  model: string;
  // 模型的类型
  type: string;
  // 模型的标签
  tagList?: string[];
  // 模型接口协议
  apiProtocol: 'OpenAI' | 'Ollama';
  // 模型的大小
  size?: string | number;
  // 最大输出token数, token上限
  maxTokens?: number;
  // 可用范围
  usageScenarios?: ModelUsageScenarioEnum[];
}

export interface GroupModelItem {
  // 分组的名称
  label: string;
  options: ModelListItemProps[];
}

export interface ModelFormData {
  // 模型提供商ID
  pid?: string;
  // 模型名称
  name: string;
  // 模型描述
  description: string;
  // 模型标识,示例值(gpt-3.5-turbo)
  model: string;
  // 网络类型，可选值：Internet 公网; Intranet 内网,可用值:Internet,Intranet
  networkType: ModelNetworkTypeEnum;
  // 模型接口协议，可选值：OpenAI, Ollama
  apiProtocol: ModelApiProtocolEnum;
  // 接口调用策略，可选值：RoundRobin, WeightedRoundRobin, LeastConnections, WeightedLeastConnections, Random, ResponseTime
  strategy: ModelStrategyEnum;
  // 模型类型，可选值：Completions, Chat, Edits, Images, Embeddings, Audio, Other
  type?: ModelTypeEnum;
  // 最大输出token数, token上限
  maxTokens: number;
  // 最大上下文长度，默认128000
  maxContextTokens: number;
  // 管控状态
  accessControl?: AccessControlEnum;
  // 可用范围
  usageScenarios?: ModelUsageScenarioEnum[];
}

// 在空间中添加或更新模型配置输入参数
export interface ModelSaveParams extends ModelFormData {
  // 模型ID（可选，不传递为新增，传递了为更新）
  id: number;
  // 空间ID（可选，在空间中添加模型组件时传递该参数）
  spaceId: number;
  // 最大输出token数, token上限
  maxTokens: number;
  // 模型能力类型列表，可选值：Text-文本生成、Image-图像理解、Audio-语音识别、Video-视频理解、TextEmbedding-文本向量、MultiEmbedding-多模态向量、Reasoning-深度思考
  types?: string[];
  // API列表
  apiInfoList: {
    // 接口地址
    url: string;
    // 接口密钥
    key: string;
    // 权重
    weight: number;
  }[];
  // 向量维度
  dimension: string;
}

// 查询可使用模型列表输入参数
export interface ModelListParams {
  // 模型类型,可用值:Completions,Chat,Edits,Images,Embeddings,Audio,Other
  modelType: ModelTypeEnum;
  // 模型接口协议，可选值：OpenAI, Ollama
  apiProtocol?: ModelApiProtocolEnum;
  // 模型范围，不传则返回所有有权限的模型,可用值:Space,Tenant,Global
  scope?: ModelScopeEnum;
  // 空间ID，可选，传递后会返回当前空间管理的模型
  spaceId: number;
}

// 模型配置信息
export interface ModelConfigInfo extends ModelSaveParams {
  // 商户ID
  tenantId: number;
  // 模型生效范围，可选值：Space, Tenant, Global,可用值:Space,Tenant,Global
  scope: ModelScopeEnum;
  // 是否是推理模型，可选值：0,1,可用值:0,1
  isReasonModel: number;
  // 网络类型，可选值：Internet 公网; Intranet 内网,可用值:Internet,Intranet
  networkType: ModelNetworkTypeEnum;
  // 函数调用支持程度，可选值：Unsupported, CallSupported, StreamCallSupported
  functionCall: ModelFunctionCallEnum;
  // 修改时间
  modified: string;
  // 创建时间
  created: string;
  // 创建者信息
  creator: CreatorInfo;
}

// ============================= 模型供应商相关类型 =============================
export interface ModelProviderModalities {
  /** 支持的输入形态 */
  input: string[];
  /** 支持的输出形态 */
  output: string[];
}

/** 上下文与输出上限 */
export interface ModelProviderLimit {
  context: number;
  output: number;
}

/** ApiInfo.models 条目：单个可用模型描述 */
export interface ModelProviderModelInfo {
  id: string;
  name: string;
  releaseDate: string;
  attachment: boolean;
  reasoning: boolean;
  temperature: boolean;
  toolCall: boolean;
  structuredOutput: boolean;
  knowledge: string;
  interleaved?: {
    field: string;
  };
  limit?: ModelProviderLimit;
  modalities?: ModelProviderModalities;
}

/** 租户下模型供应商的单个 API 端点描述 */
export interface ModelProviderApiInfo {
  /** 接口地址 */
  url: string;
  /** 接口密钥 */
  key: string;
  /** 权重 */
  weight: number;
}

/** 模型供应商（租户维度）概要 */
export interface ModelProviderInfo {
  tenantId: number;
  pid: string;
  name: string;
  icon: string;
  /** 各协议对应的接口基地址，如 { openAI: "https://..." } */
  apiInfo: Record<string, string>;
  doc: string;
  /** 该端点可用的模型列表 */
  models: ModelProviderModelInfo[];
}

// 模型测试信息
export type ModelTestInfo = ConversationChatResponse;
