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
