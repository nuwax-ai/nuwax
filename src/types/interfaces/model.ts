import type { ModelApiProtocolEnum, ModelStrategyEnum, ModelTypeEnum } from '@/types/enums/modelConfig';
import {
  ModelEventTypeEnum,
  ModelFunctionCallEnum,
  ModelNetworkTypeEnum,
  ModelScopeEnum,
} from '@/types/enums/modelConfig';
import { CreatorInfo } from '@/types/interfaces/agent';

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
}

export interface GroupModelItem {
  // 分组的名称
  label: string;
  options: ModelListItemProps[];
}

// 在空间中添加或更新模型配置输入参数
export interface ModelSaveParams {
  // 模型ID（可选，不传递为新增，传递了为更新）
  id: string;
  // 空间ID（可选，在空间中添加模型组件时传递该参数）
  spaceId: string;
  // 模型名称
  name: string;
  // 模型描述
  description: string;
  // 模型标识,示例值(gpt-3.5-turbo)
  model: string;
  // 模型类型，可选值：Completions, Chat, Edits, Images, Embeddings, Audio, Other
  type: ModelTypeEnum;
  // 最大输出token数, token上限
  maxTokens: number;
  // 模型接口协议，可选值：OpenAI, Ollama
  apiProtocol: ModelApiProtocolEnum;
  // API列表
  apiInfoList: {
    // 接口地址
    url: string;
    // 接口密钥
    key: string;
    // 权重
    weight: number;
  }[];
  // 接口调用策略，可选值：RoundRobin, WeightedRoundRobin, LeastConnections, WeightedLeastConnections, Random, ResponseTime
  strategy: ModelStrategyEnum;
  // 向量维度
  dimension: string;
}

// 查询可使用模型列表输入参数
export interface ModelListParams {
  // 模型类型,可用值:Completions,Chat,Edits,Images,Embeddings,Audio,Other
  modelType: ModelTypeEnum;
  // 模型接口协议，可选值：OpenAI, Ollama
  apiProtocol: ModelApiProtocolEnum;
  // 模型范围，不传则返回所有有权限的模型,可用值:Space,Tenant,Global
  scope: ModelScopeEnum;
  // 空间ID，可选，传递后会返回当前空间管理的模型
  spaceId: string;
}

// 模型配置信息
export interface ModelConfigInfo extends ModelSaveParams {
  tenantId: string;
  // 模型生效范围，可选值：Space, Tenant, Global,可用值:Space,Tenant,Global
  scope: ModelScopeEnum;
  networkType: ModelNetworkTypeEnum;
  // 函数调用支持程度，可选值：Unsupported, CallSupported, StreamCallSupported
  functionCall: ModelFunctionCallEnum;
  modified: string;
  created: string;
  // 创建者信息
  creator: CreatorInfo;
}

// 模型测试信息
export interface ModelTestInfo {
  requestId: string;
  // 可用值:PROCESSING,MESSAGE,FINAL_RESULT
  eventType: ModelEventTypeEnum;
  data: object;
}