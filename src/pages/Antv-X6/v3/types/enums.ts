/**
 * V3 工作流枚举定义
 */

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
