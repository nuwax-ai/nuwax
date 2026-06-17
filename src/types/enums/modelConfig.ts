// 模型类型，可选值：Completions, Chat, Edits, Images, Embeddings, Multi, Audio, Video, Other
export enum ModelTypeEnum {
  Completions = 'Completions',
  Chat = 'Chat',
  Edits = 'Edits',
  Images = 'Images',
  Embeddings = 'Embeddings',
  Multi = 'Multi',
  Audio = 'Audio',
  Video = 'Video',
  Other = 'Other',
}

/**
 * 模型能力类型（与后台/协议约定字符串一致）
 * Text-文本生成、Image-图像理解、Audio-语音识别、Video-视频理解、
 * TextEmbedding-文本向量、MultiEmbedding-多模态向量、Reasoning-深度思考
 */
export enum ModelCapabilityTypeEnum {
  Text = 'Text',
  Image = 'Image',
  Audio = 'Audio',
  Video = 'Video',
  TextEmbedding = 'TextEmbedding',
  MultiEmbedding = 'MultiEmbedding',
  Reasoning = 'Reasoning',
}

// 模型接口协议，可选值：OpenAI, Ollama, Zhipu, Anthropic 可用值:OpenAI,Ollama,Zhipu,Anthropic
export enum ModelApiProtocolEnum {
  OpenAI = 'OpenAI',
  Ollama = 'Ollama',
  Zhipu = 'Zhipu',
  Anthropic = 'Anthropic',
}

// 接口调用策略，可选值：RoundRobin, WeightedRoundRobin, LeastConnections, WeightedLeastConnections, Random, ResponseTime
export enum ModelStrategyEnum {
  // 轮询
  RoundRobin = 'RoundRobin',
  // 加权轮询
  WeightedRoundRobin = 'WeightedRoundRobin',
  // 最少连接
  LeastConnections = 'LeastConnections',
  // 加权最少连接
  WeightedLeastConnections = 'WeightedLeastConnections',
  // 随机
  Random = 'Random',
  // 响应时间
  ResponseTime = 'ResponseTime',
}

// 模型范围，不传则返回所有有权限的模型,可用值:Space,Tenant,Global
export enum ModelScopeEnum {
  Space = 'Space',
  Tenant = 'Tenant',
  Global = 'Global',
}

// 网络类型，可选值：Internet 公网; Intranet 内网,可用值:Internet,Intranet
export enum ModelNetworkTypeEnum {
  Internet = 'Internet',
  Intranet = 'Intranet',
}

// 函数调用支持程度，可选值：Unsupported, StreamCallSupported
export enum ModelFunctionCallEnum {
  Unsupported = 'Unsupported',
  StreamCallSupported = 'StreamCallSupported',
}

// Model apiInfo 的表单列表名称
export enum ModelApiInfoColumnNameEnum {
  Url = 'url',
  Apikey = 'apikey',
  Weight = 'weight',
}

// 模型可用范围枚举
export enum ModelUsageScenarioEnum {
  // 网页应用
  PageApp = 'PageApp',
  // 通用智能体
  TaskAgent = 'TaskAgent',
  // 问答智能体
  ChatBot = 'ChatBot',
  // 工作流
  Workflow = 'Workflow',
  // 外部API调用
  OpenApi = 'OpenApi',
}
