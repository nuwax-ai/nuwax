interface SubArgs {
  key: string;
  name: string;
  description: string;
  dataType: string;
  require: boolean;
  systemVariable: boolean;
  bindValueType: string;
  bindValue: string;
}

export interface InputAndOutConfig {
  // 参数名称
  name: string;
  // 参数详细描述信息
  description: string;
  // 数据类型
  dataType: string;
  // 是否必须
  require: boolean;
  // 是否为系统内置变量参数
  systemVariable: boolean;
  // 值引用类型
  bindValueType: string;
  // 参数值
  bindValue: string;
  //  	下级参数
  subArgs?: SubArgs[];
  // 参数key，唯一标识
  key?: string | null;
}

// 技能列表配置
export interface SkillComponent {
  name: string;
  icon: string;
  description: string;
  type: string;
  typeId: number;
}
interface ConditionArgs {
  bindArg: string | null;
  compareType: string | null;
  bindValueType: string | null;
  bindValue: string | null;
}
export interface ConditionBranchConfigs {
  branchType: string | null;
  conditionType: string | null;
  nextNodeIds: number[];
  conditionArgs: ConditionArgs[];
  uuid?: number | string | null;
}

interface IntentConfigs {
  nextNodeIds: number[];
  description: string;
  uuid?: number | string;
}

interface Extension {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface QANodeOption {
  index: string;
  content: string;
  nextNodeIds?: number[];
}
// 节点内部的config
export interface NodeConfig {
  // 扩展信息，前端配置，设置节点的宽高，位置
  extension?: Extension | null;
  // 节点入参
  inputArgs?: InputAndOutConfig[] | null;
  // 节点出参
  outputArgs?: InputAndOutConfig[] | null;
  // 节点变量
  variableArgs?: InputAndOutConfig[] | null;
  // 条件分支
  conditionBranchConfigs?: ConditionBranchConfigs[] | null;
  // 出参类型
  outputType?: string;
  // 模型id
  modelId?: number;
  // 选定技能
  mode?: string;
  // 技能列表配置
  skillComponentConfigs?: SkillComponent[];
  // 系统提示词
  systemPrompt?: string;
  // 用户提示词
  userPrompt?: string;
  // 最大回复长度
  maxTokens?: number;
  // 生成随机性
  temperature?: number;
  //
  topP?: number;
  // 插件的id
  pluginId?: number;
  // 循环类型
  loopType?: string | null;

  intentConfigs?: IntentConfigs[];
  // 问答类型
  answers?: number;
  // 处理方式
  textHandleType?: string;
  // 文本
  text?: string;
  // 分割符
  splits?: string[];
  content?: string;
  code?: string;
  codeLanguage?: 'Python' | 'JavaScript';
  // http 节点
  // 请求方法
  method?: string;
  // 请求url
  url?: string;
  // 内容格式
  contentType?: string;
  // 超时事件
  timeout?: string;
  // 请求头
  headers?: InputAndOutConfig[];
  // 请求体
  body?: InputAndOutConfig[];
  // 请求体类型
  queries?: InputAndOutConfig[];

  // 问答节点
  question?: string;
  answerType?: string;
  extractField?: boolean;
  maxReplyCount?: number;
  options?: QANodeOption[];
}

export interface HttpNodeConfig extends NodeConfig {
  // 请求方法
  method: string;
  // 请求url
  url: string;
  // 内容格式
  contentType: string;
  // 超时事件
  timeout: string;
  // 请求头
  headers?: InputAndOutConfig[];
  // 请求体
  body?: InputAndOutConfig[];
  // 请求体类型
  queries?: InputAndOutConfig[];
}
