/*
 * @Author: binxiaolin 18030705033
 * @Date: 2025-01-17 14:04:31
 * @LastEditors: binxiaolin 18030705033
 * @LastEditTime: 2025-01-20 18:37:59
 * @FilePath: \agent-platform-front\src\types\enums\common.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 卡片样式
export enum CardStyleEnum {
  ONE = 'one',
  TWO = 'two',
  THREE = 'three',
  FOUR = 'four',
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

// 创建、编辑智能体枚举
export enum CreateEditAgentEnum {
  // 创建
  Create,
  // 编辑
  Edit,
}

// 变量类型枚举
export enum VariableTypeEnum {
  String,
  Integer,
  Boolean,
  Number,
  Object,
  Array_String,
  Array_Integer,
  Array_Boolean,
  Array_Number,
  Array_Object,
}

// 参数类型枚举
export enum ParamsTypeEnum {
  String,
  Integer,
  Number,
  File,
  Boolean,
  Object,
  Array_String,
  Array_Integer,
  Array_Number,
  Array_Boolean,
  Array_Object,
  Array_File,
}

// 文件类型枚举
export enum FileTypeEnum {
  Doc,
  Excel,
  PPT,
  Txt,
  Image,
  Audio,
  Video,
  Other,
  Array_Doc,
  Array_Excel,
  Array_PPT,
  Array_Txt,
  Array_Image,
  Array_Audio,
  Array_Video,
  Array_Other,
}

// 插件，工作流，知识库，数据库的枚举
export enum PluginAndLibraryEnum {
  Plugin = 'Plugin',
  Workflow = 'Workflow',
  KnowledgeBase = 'KnowledgeBase',
  Database = 'Database',
}

// 插件参数设置默认值类型枚举
export enum PluginParamsSettingDefaultEnum {
  // 输入
  Input,
  // 引用
  Quote,
}

export enum NodeTypeEnum {
  // 数据库
  Database = 'Database',
  // 知识库
  KnowledgeBase = 'KnowledgeBase',
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
}
