// 模型类型，可选值：Completions, Chat, Edits, Images, Embeddings, Audio, Other
export enum ModelTypeEnum {
  Completions = 'Completions',
  Chat = 'Chat',
  Edits = 'Edits',
  Images = 'Images',
  Embeddings = 'Embeddings',
  Audio = 'Audio',
  Other = 'Other',
}

// 模型接口协议，可选值：OpenAI, Ollama,可用值:OpenAI,Ollama
export enum ModelApiProtocolEnum {
  OpenAI = 'OpenAI',
  Ollama = 'Ollama',
}

// 接口调用策略，可选值：RoundRobin, WeightedRoundRobin, LeastConnections, WeightedLeastConnections, Random, ResponseTime
export enum ModelStrategyEnum {
  RoundRobin = 'RoundRobin',
  WeightedRoundRobin = 'WeightedRoundRobin',
  LeastConnections = 'LeastConnections',
  WeightedLeastConnections = 'WeightedLeastConnections',
  Random = 'Random',
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

// 可用值:PROCESSING,MESSAGE,FINAL_RESULT
export enum ModelEventTypeEnum {
  PROCESSING = 'PROCESSING',
  MESSAGE = 'MESSAGE',
  FINAL_RESULT = 'FINAL_RESULT',
}