// 卡片样式枚举
export enum CardStyleEnum {
  ONE = 'template-1',
  TWO = 'template-2',
  THREE = 'template-3',
  FOUR = 'template-4',
}

// Tooltip title样式
export enum TooltipTitleTypeEnum {
  Blank,
  White,
}

// 创建智能体枚举
export enum CreateAgentEnum {
  Standard,
  AI,
}

// 新建、更新枚举
export enum CreateUpdateModeEnum {
  // 创建
  Create,
  // 编辑
  Update,
}

export enum NodeTypeEnum {
  // 数据库
  // Database = 'Database',
  // 知识库
  Knowledge = 'Knowledge',
  // http
  HTTPRequest = 'HTTPRequest',
  // 问答
  QA = 'QA',
  // 代码
  Code = 'Code',
  // 插件
  Plugin = 'Plugin',
  // 意图识别
  IntentRecognition = 'IntentRecognition',
  // 节点
  LLM = 'LLM',
  // 变量
  Variable = 'Variable',
  // 循环
  Loop = 'Loop',
  // 终止循环
  LoopBreak = 'LoopBreak',
  // 继续循环
  LoopContinue = 'LoopContinue',
  // 循环开始
  LoopStart = 'LoopStart',
  // 循环结束
  LoopEnd = 'LoopEnd',
  // 循环条件
  LoopCondition = 'LoopCondition',
  // 间隔
  Interval = 'Interval',
  // 开始
  Start = 'Start',
  // 结束
  End = 'End',
  // 文档提取
  DocumentExtraction = 'DocumentExtraction',
  // 过程输出
  Output = 'Output',
  // 文本处理
  TextProcessing = 'TextProcessing',
  // 工作流
  Workflow = 'Workflow',
  // 长期记忆
  LongTermMemory = 'LongTermMemory',
  // 条件分支
  Condition = 'Condition',
  // 数据新增
  TableDataAdd = 'TableDataAdd',
  // 数据删除
  TableDataDelete = 'TableDataDelete',
  TableDataUpdate = 'TableDataUpdate',
  TableDataQuery = 'TableDataQuery',
  // sql自定义
  TableSQL = 'TableSQL',
  // mcp
  MCP = 'Mcp',
}

export enum DataTypeEnum {
  String = 'String', // 文本
  Integer = 'Integer', // 整型数字
  Number = 'Number', // 数字
  Boolean = 'Boolean', // 布尔
  File_Default = 'File_Default', // 默认文件
  File = 'File', // 默认文件
  File_Image = 'File_Image', // 图像文件
  File_PPT = 'File_PPT', // PPT 文件
  File_Doc = 'File_Doc', // DOC 文件
  File_PDF = 'File_PDF', // PDF 文件
  File_Txt = 'File_Txt', // TXT 文件
  File_Zip = 'File_Zip', // ZIP 文件
  File_Excel = 'File_Excel', // Excel 文件
  File_Video = 'File_Video', // 视频文件
  File_Audio = 'File_Audio', // 音频文件
  File_Voice = 'File_Voice', // 语音文件
  File_Code = 'File_Code', // 语音文件
  File_Svg = 'File_Svg',
  Object = 'Object', // 对象
  Array_String = 'Array_String', // String 数组
  Array_Integer = 'Array_Integer', // Integer 数组
  Array_Number = 'Array_Number', // Number 数组
  Array_Boolean = 'Array_Boolean', // Boolean 数组
  Array_File_Default = 'Array_File_Default', // 默认文件数组
  Array_File = 'Array_File', // 默认文件数组
  Array_File_Image = 'Array_File_Image', // 图像文件数组
  Array_File_PPT = 'Array_File_PPT', // PPT 文件数组
  Array_File_Doc = 'Array_File_Doc', // DOC 文件数组
  Array_File_PDF = 'Array_File_PDF', // PDF 文件数组
  Array_File_Txt = 'Array_File_Txt', // TXT 文件数组
  Array_File_Zip = 'Array_File_Zip', // ZIP 文件数组
  Array_File_Excel = 'Array_File_Excel', // Excel 文件数组
  Array_File_Video = 'Array_File_Video', // 视频文件数组
  Array_File_Audio = 'Array_File_Audio', // 音频文件数组
  Array_File_Voice = 'Array_File_Voice', // 语音文件数组
  Array_File_Svg = 'Array_File_Svg', // 语音文件数组
  Array_File_Code = 'Array_File_Code', // 语音文件数组
  Array_Object = 'Array_Object', // 对象数组
}

// 角色类型
export enum RoleEnum {
  Owner = 'Owner',
  Admin = 'Admin',
  User = 'User',
}

// 用户状态,可用值:Enabled,Disabled
export enum UserStatus {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}

// 发布状态
export enum PublishStatusEnum {
  Developing = 'Developing',
  // 审核中
  Applying = 'Applying',
  // 已发布
  Published = 'Published',
  // 已拒绝
  Rejected = 'Rejected',
}

// 请求方法,可用值:POST,GET,PUT,DELETE
export enum HttpMethodEnum {
  POST = 'POST',
  GET = 'GET',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

// 请求内容格式,可用值:JSON,FORM_DATA,X_WWW_FORM_URLENCODED,OTHER
export enum HttpContentTypeEnum {
  JSON = 'JSON',
  FORM_DATA = 'FORM_DATA',
  X_WWW_FORM_URLENCODED = 'X_WWW_FORM_URLENCODED',
  OTHER = 'OTHER',
}

// 消息状态枚举
export enum MessageStatusEnum {
  Loading = 'loading',
  // 不完整的
  Incomplete = 'incomplete',
  Complete = 'complete',
  Error = 'error',
}

// 消息loading时，调用状态
export enum ProcessingEnum {
  EXECUTING = 'EXECUTING',
  FINISHED = 'FINISHED',
  FAILED = 'FAILED',
}

export enum NodeShapeEnum {
  General = 'general-Node',
  Loop = 'loop-node',
}

export enum CompareTypeEnum {
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

export enum AnswerTypeEnum {
  TEXT = 'TEXT',
  SELECT = 'SELECT',
}

export enum ExceptionHandleTypeEnum {
  INTERRUPT = 'INTERRUPT',
  SPECIFIC_CONTENT = 'SPECIFIC_CONTENT',
  EXECUTE_EXCEPTION_FLOW = 'EXECUTE_EXCEPTION_FLOW',
}

// 权限枚举
export enum PermissionsEnum {
  // 复制
  Copy = 'Copy',
  // 迁移
  Transfer = 'Transfer',
  // 删除
  Delete = 'Delete',
  // 发布
  Publish = 'Publish',
  // 临时会话
  TempChat = 'TempChat',
  // API Key
  AgentApi = 'AgentApi',
  // 导出配置
  Export = 'Export',
}

// 输入类型, Http插件有用,可用值:Query,Body,Header,Path
export enum InputTypeEnum {
  Query = 'Query',
  Body = 'Body',
  Header = 'Header',
  Path = 'Path',
}

// 值引用类型，Input 输入；Reference 变量引用,可用值:Input,Reference
export enum BindValueType {
  // 输入
  Input = 'Input',
  // 引用
  Reference = 'Reference',
}

export enum RunResultStatusEnum { // 工作流节点运行结果状态
  FINISHED = 'FINISHED',
  FAILED = 'FAILED',
  EXECUTING = 'EXECUTING',
  STOP_WAIT_ANSWER = 'STOP_WAIT_ANSWER',
}

export enum UploadFileStatus {
  error = 'error',
  done = 'done',
  uploading = 'uploading',
  removed = 'removed',
}
