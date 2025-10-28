// 模型类型，可选值：Completions, Chat, Edits, Images, Embeddings, Audio, Other
export enum ModelTypeEnum {
  Completions = 'Completions',
  Chat = 'Chat',
  Edits = 'Edits',
  Images = 'Images',
  Embeddings = 'Embeddings',
  Multi = 'Multi',
  Audio = 'Audio',
  Other = 'Other',
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

// 函数调用支持程度，可选值：Unsupported, CallSupported, StreamCallSupported
export enum ModelFunctionCallEnum {
  Unsupported = 'Unsupported',
  CallSupported = 'CallSupported',
  StreamCallSupported = 'StreamCallSupported',
}

// Model apiInfo 的表单列表名称
export enum ModelApiInfoColumnNameEnum {
  Url = 'url',
  Apikey = 'apikey',
  Weight = 'weight',
}
