/**
 * V2 工作流类型定义
 * 完全独立，不依赖 v1 任何类型
 */

import { Graph, Markup, Node } from '@antv/x6';
import type { MessageInstance } from 'antd/es/message/interface';
import type { HookAPI as ModalHookAPI } from 'antd/es/modal/useModal';

// ==================== 枚举定义 ====================

/**
 * 节点类型枚举
 */
export enum NodeTypeEnumV2 {
  Knowledge = 'Knowledge', // 知识库
  HTTPRequest = 'HTTPRequest', // HTTP请求
  QA = 'QA', // 问答
  Code = 'Code', // 代码
  Plugin = 'Plugin', // 插件
  IntentRecognition = 'IntentRecognition', // 意图识别
  LLM = 'LLM', // 大语言模型
  Variable = 'Variable', // 变量
  Loop = 'Loop', // 循环
  LoopBreak = 'LoopBreak', // 终止循环
  LoopContinue = 'LoopContinue', // 继续循环
  LoopStart = 'LoopStart', // 循环开始
  LoopEnd = 'LoopEnd', // 循环结束
  LoopCondition = 'LoopCondition', // 循环条件
  Interval = 'Interval', // 间隔
  Start = 'Start', // 开始
  End = 'End', // 结束
  DocumentExtraction = 'DocumentExtraction', // 文档提取
  Output = 'Output', // 过程输出
  TextProcessing = 'TextProcessing', // 文本处理
  Workflow = 'Workflow', // 工作流
  LongTermMemory = 'LongTermMemory', // 长期记忆
  Condition = 'Condition', // 条件分支
  TableDataAdd = 'TableDataAdd', // 数据新增
  TableDataDelete = 'TableDataDelete', // 数据删除
  TableDataUpdate = 'TableDataUpdate', // 数据更新
  TableDataQuery = 'TableDataQuery', // 数据查询
  TableSQL = 'TableSQL', // SQL自定义
  MCP = 'Mcp', // MCP
}

/**
 * 节点形状枚举
 */
export enum NodeShapeEnumV2 {
  General = 'general-Node',
  Loop = 'loop-node',
}

/**
 * 数据类型枚举
 */
export enum DataTypeEnumV2 {
  String = 'String',
  Integer = 'Integer',
  Number = 'Number',
  Boolean = 'Boolean',
  File_Default = 'File_Default',
  File = 'File',
  File_Image = 'File_Image',
  File_PPT = 'File_PPT',
  File_Doc = 'File_Doc',
  File_PDF = 'File_PDF',
  File_Txt = 'File_Txt',
  File_Zip = 'File_Zip',
  File_Excel = 'File_Excel',
  File_Video = 'File_Video',
  File_Audio = 'File_Audio',
  File_Voice = 'File_Voice',
  File_Code = 'File_Code',
  File_Svg = 'File_Svg',
  Object = 'Object',
  Array_String = 'Array_String',
  Array_Integer = 'Array_Integer',
  Array_Number = 'Array_Number',
  Array_Boolean = 'Array_Boolean',
  Array_File_Default = 'Array_File_Default',
  Array_File = 'Array_File',
  Array_File_Image = 'Array_File_Image',
  Array_File_PPT = 'Array_File_PPT',
  Array_File_Doc = 'Array_File_Doc',
  Array_File_PDF = 'Array_File_PDF',
  Array_File_Txt = 'Array_File_Txt',
  Array_File_Zip = 'Array_File_Zip',
  Array_File_Excel = 'Array_File_Excel',
  Array_File_Video = 'Array_File_Video',
  Array_File_Audio = 'Array_File_Audio',
  Array_File_Voice = 'Array_File_Voice',
  Array_File_Svg = 'Array_File_Svg',
  Array_File_Code = 'Array_File_Code',
  Array_Object = 'Array_Object',
}

/**
 * 端口组枚举
 */
export enum PortGroupEnumV2 {
  in = 'in',
  out = 'out',
  special = 'special',
  exception = 'exception',
}

/**
 * 条件分支类型枚举
 */
export enum ConditionBranchTypeEnumV2 {
  IF = 'IF',
  ELSE_IF = 'ELSE_IF',
  ELSE = 'ELSE',
}

/**
 * 节点更新类型枚举
 */
export enum NodeUpdateEnumV2 {
  moved = 'moved',
}

/**
 * 边更新类型枚举
 */
export enum UpdateEdgeTypeV2 {
  created = 'created',
  deleted = 'deleted',
}

/**
 * 节点尺寸获取类型枚举
 */
export enum NodeSizeGetTypeEnumV2 {
  create = 'create',
  update = 'update',
}

/**
 * 答案类型枚举
 */
export enum AnswerTypeEnumV2 {
  TEXT = 'TEXT',
  SELECT = 'SELECT',
}

/**
 * 异常处理类型枚举
 */
export enum ExceptionHandleTypeEnumV2 {
  INTERRUPT = 'INTERRUPT',
  SPECIFIC_CONTENT = 'SPECIFIC_CONTENT',
  EXECUTE_EXCEPTION_FLOW = 'EXECUTE_EXCEPTION_FLOW',
}

/**
 * 运行结果状态枚举
 */
export enum RunResultStatusEnumV2 {
  FINISHED = 'FINISHED',
  FAILED = 'FAILED',
  EXECUTING = 'EXECUTING',
  STOP_WAIT_ANSWER = 'STOP_WAIT_ANSWER',
}

/**
 * 表单ID枚举
 */
export enum FoldFormIdEnumV2 {
  empty = 0,
}

/**
 * 比较类型枚举
 */
export enum CompareTypeEnumV2 {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  MATCH_REGEX = 'MATCH_REGEX',
  IS_NULL = 'IS_NULL',
  NOT_NULL = 'NOT_NULL',
}

// ==================== 接口定义 ====================

/**
 * 端口元数据
 */
export interface PortMetadataV2 {
  markup?: Markup;
  attrs?: any;
  zIndex?: number | 'auto';
  position?: [number, number] | string | { name: string; args?: object };
  label?: {
    markup?: Markup;
    position?: {
      name: string;
      args?: object;
    };
  };
}

/**
 * 输入输出端口配置
 */
export interface OutputOrInputPortConfigV2 extends Partial<PortMetadataV2> {
  id: string;
  zIndex: number;
  magnet: boolean;
  group: PortGroupEnumV2;
  args: {
    x: number;
    y: number;
    offsetY: number;
    offsetX: number;
  };
}

/**
 * 端口配置
 */
export interface PortsConfigV2 {
  groups: any;
  items: OutputOrInputPortConfigV2[];
}

/**
 * 端口配置项
 */
export interface PortConfigV2 {
  group: PortGroupEnumV2;
  idSuffix: string;
  yHeight?: number;
  xWidth?: number;
  offsetY?: number;
  offsetX?: number;
  color?: string;
}

/**
 * 输入输出参数配置
 */
export interface InputAndOutConfigV2 {
  name: string;
  description: string | null;
  dataType: DataTypeEnumV2 | null;
  require: boolean;
  systemVariable: boolean;
  bindValueType?: 'Input' | 'Reference';
  bindValue: string;
  subArgs?: InputAndOutConfigV2[];
  children?: InputAndOutConfigV2[];
  key: string;
  enable?: boolean;
  inputType?: string;
}

/**
 * 条件参数
 */
export interface ConditionArgsV2 {
  secondArg: BindConfigWithSubV2 | null;
  compareType: string | null;
  firstArg: BindConfigWithSubV2 | null;
}

/**
 * 绑定配置（带子项）
 */
export interface BindConfigWithSubV2 {
  name?: string;
  bindValue?: string;
  bindValueType?: 'Input' | 'Reference';
  dataType?: DataTypeEnumV2 | null;
  subArgs?: InputAndOutConfigV2[];
}

/**
 * 条件分支配置
 */
export interface ConditionBranchConfigsV2 {
  branchType: ConditionBranchTypeEnumV2;
  conditionType: string | null;
  nextNodeIds?: number[];
  conditionArgs: ConditionArgsV2[];
  uuid: string;
}

/**
 * 意图配置
 */
export interface IntentConfigsV2 {
  nextNodeIds: number[];
  intent: string;
  uuid: string;
  intentType?: string;
}

/**
 * 扩展信息
 */
export interface ExtensionV2 {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * 问答节点选项
 */
export interface QANodeOptionV2 {
  index: number;
  content: string;
  nextNodeIds?: number[];
  uuid: string;
  disabled?: boolean;
}

/**
 * 异常处理配置
 */
export interface ExceptionHandleConfigV2 {
  exceptionHandleType: ExceptionHandleTypeEnumV2;
  timeout: number;
  retryCount: number;
  specificContent?: string;
  exceptionHandleNodeIds?: number[];
}

/**
 * 创建的节点项（用于知识库、技能等）
 */
export interface CreatedNodeItemV2 {
  targetId: number;
  targetType?: string;
  name?: string;
  description?: string;
  type?: string;
  knowledgeBaseId?: number;
  toolName?: string;
}

/**
 * 节点配置
 */
export interface NodeConfigV2 {
  // 扩展信息
  extension?: ExtensionV2 | null;
  // 节点入参
  inputArgs?: InputAndOutConfigV2[];
  // 节点出参
  outputArgs?: InputAndOutConfigV2[];
  // 节点变量
  variableArgs?: InputAndOutConfigV2[];
  // 条件分支
  conditionBranchConfigs?: ConditionBranchConfigsV2[];
  // 结束节点返回类型
  returnType?: 'VARIABLE' | 'TEXT';
  // 出参类型
  outputType?: string;
  // 模型id
  modelId?: number;
  // 模式
  mode?: string;
  // 技能列表配置
  skillComponentConfigs?: CreatedNodeItemV2[];
  // 系统提示词
  systemPrompt?: string;
  // 用户提示词
  userPrompt?: string;
  // 最大回复长度
  maxTokens?: number;
  // 生成随机性
  temperature?: number;
  // topP
  topP?: number;
  // 插件id
  pluginId?: number;
  // 循环类型
  loopType?: string | null;
  // 循环次数
  loopTimes?: number;
  // 变量类型
  configType?: 'SET_VARIABLE' | 'GET_VARIABLE';
  // 文本处理类型
  textHandleType?: 'CONCAT' | 'SPLIT';
  // 意图配置
  intentConfigs?: IntentConfigsV2[];
  // 问答数量
  answers?: number;
  // 文本
  text?: string;
  // 连接符
  join?: string;
  // 分割符
  splits?: string[];
  // 内容
  content?: string;
  // 代码
  code?: string;
  // 代码语言
  codeLanguage?: 'Python' | 'JavaScript';
  codeJavaScript?: string;
  codePython?: string;
  // HTTP节点配置
  method?: string;
  url?: string;
  contentType?: string;
  timeout?: string;
  headers?: InputAndOutConfigV2[];
  body?: InputAndOutConfigV2[];
  queries?: InputAndOutConfigV2[];
  // 问答节点配置
  question?: string;
  answerType?: AnswerTypeEnumV2;
  extractField?: boolean;
  maxReplyCount?: number;
  options?: QANodeOptionV2[];
  // 知识库配置
  knowledgeBaseConfigs?: CreatedNodeItemV2[];
  searchStrategy?: string;
  maxRecallCount?: number;
  matchingDegree?: number;
  // 数据表配置
  tableId?: number;
  name?: string;
  description?: string;
  icon?: string;
  tableFields?: CreatedNodeItemV2[];
  conditionType?: string;
  conditionArgs?: InputAndOutConfigV2[];
  modelConfig?: {
    id?: number;
    maxTokens?: number;
  };
  // 异常处理配置
  exceptionHandleConfig?: ExceptionHandleConfigV2;
  // MCP配置
  toolName?: string;
  mcpId?: number;
}

/**
 * 运行结果项
 */
export interface RunResultItemV2 {
  options: {
    data: object | null;
    nodeName: string;
    nodeId: number;
    startTime: number;
    input: any[];
    endTime: number;
    error: object | null;
    success: boolean;
  };
  requestId: string;
  status: RunResultStatusEnumV2;
}

/**
 * 子节点（核心节点数据结构）
 */
export interface ChildNodeV2 {
  id: number;
  name: string;
  description: string;
  workflowId: number;
  type: NodeTypeEnumV2;
  preNodes?: number[] | null;
  nodeConfig: NodeConfigV2;
  nextNodes?: number[] | null;
  nextNodeIds?: number[] | null;
  innerNodes?: ChildNodeV2[] | null;
  innerStartNodeId?: number | null;
  innerEndNodeId?: number | null;
  unreachableNextNodeIds?: number[] | null;
  modified?: string;
  created?: string;
  shape: NodeShapeEnumV2;
  icon: string | React.ReactNode;
  loopNodeId?: number;
  isEditingName?: boolean;
  isFocus?: boolean;
  runResults?: RunResultItemV2[];
  typeId?: number;
}

/**
 * 模板子节点
 */
export interface StencilChildNodeV2 extends Partial<ChildNodeV2> {
  bgIcon: string;
  type: NodeTypeEnumV2;
}

/**
 * 边
 */
export interface EdgeV2 {
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  zIndex?: number;
}

/**
 * 图形矩形
 */
export interface GraphRectV2 {
  x: number;
  y: number;
  height?: number;
  width?: number;
}

/**
 * 视图图形属性
 */
export interface ViewGraphPropsV2 {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 改变节点属性
 */
export interface ChangeNodePropsV2 {
  nodeData: ChildNodeV2;
  targetNodeId?: string;
  update?: NodeUpdateEnumV2 | undefined;
}

/**
 * 改变边属性
 */
export interface ChangeEdgePropsV2 {
  type: UpdateEdgeTypeV2;
  targetId: string;
  sourceNode: ChildNodeV2;
  id?: string;
}

/**
 * 通过端口或边创建节点属性
 */
export interface CreateNodeByPortOrEdgePropsV2 {
  child: StencilChildNodeV2;
  sourceNode: ChildNodeV2;
  portId: string;
  position: { x: number; y: number };
  targetNode?: ChildNodeV2;
  edgeId?: string;
}

/**
 * 工作流元数据（保存初始化时的工作流信息，用于全量保存）
 */
export interface WorkflowMetadataV2 {
  name: string;
  description: string;
  spaceId: number;
  startNode?: ChildNodeV2;
  extension?: {
    size?: number;
  };
  category?: string;
  version?: string;
}

/**
 * 工作流数据（V2核心数据结构）
 */
export interface WorkflowDataV2 {
  nodeList: ChildNodeV2[];
  edgeList: EdgeV2[];
  lastSavedVersion: string;
  isDirty: boolean;
  metadata?: WorkflowMetadataV2;
}

/**
 * 图形容器属性
 */
export interface GraphContainerPropsV2 {
  workflowData: WorkflowDataV2;
  onNodeChange: (node: ChildNodeV2) => void;
  onEdgeChange: (edges: EdgeV2[]) => void;
  onNodeAdd: (node: ChildNodeV2) => void;
  onNodeDelete: (nodeId: number) => void;
  onNodeSelect: (node: ChildNodeV2 | null) => void;
  onZoomChange: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * 图形容器引用
 */
export interface GraphContainerRefV2 {
  getCurrentViewPort: () => ViewGraphPropsV2;
  graphAddNode: (e: GraphRectV2, child: ChildNodeV2) => void;
  graphUpdateNode: (nodeId: string, newData: ChildNodeV2 | null) => void;
  graphUpdateByFormData: (
    changedValues: any,
    fullFormValues: any,
    nodeId: string,
  ) => void;
  graphDeleteNode: (id: string) => void;
  graphSelectNode: (id: string) => void;
  graphDeleteEdge: (id: string) => void;
  graphCreateNewEdge: (
    source: string,
    target: string,
    isLoop?: boolean,
    sourcePort?: string,
    targetPort?: string,
  ) => void;
  graphChangeZoom: (val: number) => void;
  graphChangeZoomToFit: () => void;
  drawGraph: () => void;
  getGraphRef: () => Graph;
  graphTriggerBlankClick: () => void;
  graphResetRunResult: () => void;
  graphActiveNodeRunResult: (id: string, runResult: RunResultItemV2) => void;
  // V2新增：撤销/重做
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
}

/**
 * 绑定事件处理器
 */
export interface BindEventHandlersV2 {
  graph: Graph;
  onNodeChange: (node: ChildNodeV2) => void;
  onEdgeAdd: (edge: EdgeV2) => void;
  onEdgeDelete: (edgeId: string) => void;
  onNodeCopy: (node: ChildNodeV2) => void;
  onNodeDelete: (nodeId: number) => void;
  modal: ModalHookAPI;
  message: MessageInstance;
}

/**
 * 图形属性
 */
export interface GraphPropV2 {
  containerId: string;
  onNodeSelect: (node: ChildNodeV2 | null) => void;
  onNodeChange: (node: ChildNodeV2) => void;
  onEdgeAdd: (edge: EdgeV2) => void;
  onEdgeDelete: (edgeId: string) => void;
  onZoomChange: (zoom: number) => void;
  createNodeByPortOrEdge: (config: CreateNodeByPortOrEdgePropsV2) => void;
  onClickBlank: () => void;
}

/**
 * 节点上级节点列表
 */
export interface PreviousListV2 {
  id: number;
  name: string;
  type: NodeTypeEnumV2;
  icon: string | number;
  outputArgs: InputAndOutConfigV2[];
}

/**
 * 参数映射
 */
export interface ArgMapV2 {
  [key: string]: InputAndOutConfigV2;
}

/**
 * 节点上级节点和参数映射
 */
export interface NodePreviousAndArgMapV2 {
  previousNodes: PreviousListV2[];
  innerPreviousNodes: PreviousListV2[];
  argMap: ArgMapV2;
}

/**
 * 节点抽屉引用
 */
export interface NodeDrawerRefV2 {
  getFormValues: () => NodeConfigV2;
  onFinish: () => void;
}

/**
 * 当前节点引用键
 */
export type CurrentNodeRefKeyV2 =
  | 'sourceNode'
  | 'portId'
  | 'targetNode'
  | 'edgeId';

/**
 * 当前节点引用属性
 */
export interface CurrentNodeRefPropsV2 {
  sourceNode: ChildNodeV2;
  portId: string;
  targetNode?: ChildNodeV2;
  edgeId?: string;
}

/**
 * 图形节点尺寸获取参数
 */
export interface GraphNodeSizeGetParamsV2 {
  data: ChildNodeV2;
  ports: OutputOrInputPortConfigV2[];
  type: NodeSizeGetTypeEnumV2;
}

/**
 * 图形节点尺寸
 */
export interface GraphNodeSizeV2 {
  type: NodeSizeGetTypeEnumV2;
  width: number;
  height: number;
}

/**
 * 节点元数据
 */
export interface NodeMetadataV2 extends Node.Metadata {
  shape: NodeShapeEnumV2;
  data: ChildNodeV2 & {
    nodeConfig: NodeConfigV2;
    parentId: string | null;
  };
  ports: PortsConfigV2;
}

/**
 * 异常项属性
 */
export interface ExceptionItemPropsV2 extends ExceptionHandleConfigV2 {
  name: string;
  disabled?: boolean;
}

/**
 * 试运行参数
 */
export interface TestRunParamsV2 {
  question: string;
  options: QANodeOptionV2[];
}

/**
 * 工作流详情响应
 */
export interface WorkflowDetailsV2 {
  id: number;
  name: string;
  description: string;
  spaceId: number;
  nodes: ChildNodeV2[];
  startNode: ChildNodeV2;
  extension?: {
    size?: number;
  };
  modified?: string;
  publishDate?: string;
  publishStatus?: string;
  category?: string;
  permissions?: string[];
  version?: string;
}

/**
 * 验证结果
 */
export interface ValidationResultV2 {
  nodeId: number;
  success: boolean;
  messages: string[];
}

/**
 * 保存工作流请求
 * 数据结构与 WorkflowDetailsV2 基本一致（全量保存）
 */
export interface SaveWorkflowRequestV2 {
  workflowId: number;
  name?: string;
  description?: string;
  spaceId?: number;
  nodes: ChildNodeV2[];
  startNode?: ChildNodeV2;
  extension?: {
    size?: number;
  };
  category?: string;
  version?: string;
}

/**
 * 保存工作流响应
 */
export interface SaveWorkflowResponseV2 {
  success: boolean;
  message?: string;
  version?: string;
}

/**
 * 历史操作类型
 */
export enum HistoryActionTypeV2 {
  ADD_NODE = 'ADD_NODE',
  DELETE_NODE = 'DELETE_NODE',
  UPDATE_NODE = 'UPDATE_NODE',
  ADD_EDGE = 'ADD_EDGE',
  DELETE_EDGE = 'DELETE_EDGE',
  MOVE_NODE = 'MOVE_NODE',
  BATCH = 'BATCH',
}

/**
 * 历史记录项
 */
export interface HistoryItemV2 {
  id: string;
  type: HistoryActionTypeV2;
  timestamp: number;
  data: {
    before: WorkflowDataV2;
    after: WorkflowDataV2;
  };
}

/**
 * 节点动画配置
 */
export interface NodeAnimationConfigV2 {
  type: 'highlight' | 'flash' | 'pulse';
  duration: number;
  color?: string;
}
