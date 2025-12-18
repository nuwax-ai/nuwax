import {
  AnswerTypeEnum,
  DataTypeEnum,
  ExceptionHandleTypeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { ConditionBranchTypeEnum, PortGroupEnum } from '@/types/enums/node';
import { BindConfigWithSub, CreatedNodeItem } from '@/types/interfaces/common';
import { Markup } from '@antv/x6';

export interface PortMetadata {
  markup?: Markup; // 连接桩 DOM 结构定义。
  attrs?: any; // 属性和样式。
  zIndex?: number | 'auto'; // 连接桩的 DOM 层级，值越大层级越高。
  // 群组中连接桩的布局。
  position?: [number, number] | string | { name: string; args?: object };
  label?: {
    // 连接桩标签
    markup?: Markup;
    position?: {
      // 连接桩标签布局
      name: string; // 布局名称
      args?: object; // 布局参数
    };
  };
}
export interface outputOrInputPortConfig extends Partial<PortMetadata> {
  id: string;
  zIndex: number;
  magnet: boolean;
  group: PortGroupEnum;
  args: {
    x: number;
    y: number;
    offsetY: number;
    offsetX: number;
  };
}
// X6 端口配置格式
export interface PortsConfig {
  groups: any; // 端口组配置
  items: outputOrInputPortConfig[]; // 端口项数组
}

export interface PortConfig {
  group: PortGroupEnum;
  idSuffix: string;
  yHeight?: number;
  xWidth?: number;
  offsetY?: number;
  offsetX?: number;
  color?: string;
}

export interface InputAndOutConfig {
  // 参数名称
  name: string;
  // 参数详细描述信息
  description: string | null;
  // 数据类型
  dataType: DataTypeEnum | null;
  // 是否必须
  require: boolean;
  // 是否为系统内置变量参数
  systemVariable: boolean;
  // 值引用类型
  bindValueType?: 'Input' | 'Reference';
  // 参数值
  bindValue: string;
  //  	下级参数
  subArgs?: InputAndOutConfig[];
  // 有可能有children
  children?: InputAndOutConfig[];
  // 参数key，唯一标识
  key: string;
  // 是否开启
  enable?: boolean;
  // 输入类型
  inputType?: string;
}

// 变量聚合分组
export interface VariableGroup {
  id: string;
  name: string;
  dataType: DataTypeEnum;
  inputs: InputAndOutConfig[];
}

export interface ConditionArgs {
  secondArg: BindConfigWithSub | null;
  compareType: string | null;
  firstArg: BindConfigWithSub | null;
}
export interface ConditionBranchConfigs {
  branchType: ConditionBranchTypeEnum;
  conditionType: string | null;
  nextNodeIds?: number[];
  conditionArgs: ConditionArgs[];
  uuid: string;
}

export interface IntentConfigs {
  nextNodeIds: number[];
  intent: string;
  uuid: string;
  intentType?: string;
}

export interface Extension {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface QANodeOption {
  index: number;
  content: string;
  nextNodeIds?: number[];
  uuid: string;
  disabled?: boolean;
}

export interface TestRunParams {
  question: string;
  options: QANodeOption[];
}
export interface ExceptionHandleConfig {
  exceptionHandleType: ExceptionHandleTypeEnum;
  timeout: number;
  retryCount: number;
  specificContent?: string;
  exceptionHandleNodeIds?: number[];
}

// 节点内部的config
export interface NodeConfig {
  // 扩展信息，前端配置，设置节点的宽高，位置
  extension?: Extension | null;
  // 节点入参
  inputArgs?: InputAndOutConfig[];
  // 节点出参
  outputArgs?: InputAndOutConfig[];
  // 节点变量
  variableArgs?: InputAndOutConfig[];
  // 变量聚合配置
  aggregationStrategy?: string;
  variableGroups?: VariableGroup[];
  // 技能列表
  // 条件分支
  conditionBranchConfigs?: ConditionBranchConfigs[];
  // 结束节点的
  returnType?: 'VARIABLE' | 'TEXT';

  // 出参类型
  outputType?: string;
  // 模型id
  modelId?: number;
  // 选定技能
  mode?: string;
  // 技能列表配置
  skillComponentConfigs?: CreatedNodeItem[];
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
  // 循环次数
  loopTimes?: number;
  // 变量类型
  configType?: 'SET_VARIABLE' | 'GET_VARIABLE';
  // 文本处理的类型
  textHandleType?: 'CONCAT' | 'SPLIT';
  intentConfigs?: IntentConfigs[];
  // 问答类型
  answers?: number;
  // 文本
  text?: string;
  // 连接符
  join?: string;
  // 分割符
  splits?: string[];
  content?: string;
  code?: string;
  codeLanguage?: 'Python' | 'JavaScript';
  codeJavaScript?: string;
  codePython?: string;
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
  answerType?: AnswerTypeEnum;
  extractField?: boolean;
  maxReplyCount?: number;
  options?: QANodeOption[];

  // 知识库节点
  knowledgeBaseConfigs?: CreatedNodeItem[];
  // 搜索策略
  searchStrategy?: string;
  // 最大召回数量
  maxRecallCount?: number;
  // 最小匹配度
  matchingDegree?: number;

  // 数据表的配置
  tableId?: number;
  name?: string;
  description?: string;
  icon?: string;
  tableFields?: CreatedNodeItem[];
  conditionType?: string;
  conditionArgs?: InputAndOutConfig[];
  modelConfig?: {
    id?: number;
    maxTokens?: number;
  };
  // 异常处理配置
  exceptionHandleConfig?: ExceptionHandleConfig;
  toolName?: string;
  mcpId?: number;
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

// 节点的上级节点的出参列表
export interface PreviousList {
  // 节点id
  id: number;
  // 节点名称
  name: string;
  // 节点id
  type: NodeTypeEnum;
  // 节点名称
  icon: string | number;
  // 节点的出参列表
  outputArgs: InputAndOutConfig[];
}

// 引用类型的map
export interface ArgMap {
  [key: string]: InputAndOutConfig;
}

export interface NodePreviousAndArgMap {
  previousNodes: PreviousList[];
  innerPreviousNodes: PreviousList[];
  argMap: ArgMap;
}

export interface NodeDrawerRef {
  // 新增节点
  getFormValues: () => NodeConfig;
  onFinish: () => void;
}

export type CurrentNodeRefKey =
  | 'sourceNode'
  | 'portId'
  | 'targetNode'
  | 'edgeId';
