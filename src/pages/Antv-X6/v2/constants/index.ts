/**
 * V2 工作流常量定义
 * 完全独立，不依赖 v1 任何常量
 */

import {
  AnswerTypeEnumV2,
  ChildNodeV2,
  CompareTypeEnumV2,
  ExceptionHandleTypeEnumV2,
  FoldFormIdEnumV2,
  NodeShapeEnumV2,
  NodeTypeEnumV2,
  PortGroupEnumV2,
} from '../types';

// ==================== 节点形状常量 ====================

export const GENERAL_NODE_V2 = NodeShapeEnumV2.General;
export const LOOP_NODE_V2 = NodeShapeEnumV2.Loop;

// ==================== 试运行支持的节点类型 ====================

export const TEST_RUN_LIST_V2 = [
  'Start',
  'LLM',
  'Plugin',
  'Code',
  'HTTPRequest',
  'TextProcessing',
  'Workflow',
  'DocumentExtraction',
  'Knowledge',
  'TableSQL',
  'TableDataQuery',
  'TableDataUpdate',
  'TableDataDelete',
  'TableDataAdd',
];

// ==================== 分支类型映射 ====================

export const BRANCH_TYPE_MAP_V2 = {
  IF: '如果',
  ELSE_IF: '否则如果',
  ELSE: '否则',
};

// ==================== 异常处理配置 ====================

/**
 * 异常处理类型选项
 */
export const EXCEPTION_HANDLE_OPTIONS_V2 = [
  {
    label: '中断流程',
    value: ExceptionHandleTypeEnumV2.INTERRUPT,
  },
  {
    label: '返回特定内容',
    value: ExceptionHandleTypeEnumV2.SPECIFIC_CONTENT,
  },
  {
    label: '执行异常流程',
    value: ExceptionHandleTypeEnumV2.EXECUTE_EXCEPTION_FLOW,
  },
];

/**
 * 支持异常处理的节点类型
 * 包括：大模型、插件、工作流、MCP、代码、意图识别、知识库、数据表、问答、文档提取、HTTP请求
 */
export const EXCEPTION_NODES_TYPE_V2 = [
  NodeTypeEnumV2.LLM,
  NodeTypeEnumV2.Plugin,
  NodeTypeEnumV2.Workflow,
  NodeTypeEnumV2.MCP,
  NodeTypeEnumV2.Code,
  NodeTypeEnumV2.IntentRecognition,
  NodeTypeEnumV2.Knowledge,
  NodeTypeEnumV2.TableDataQuery,
  NodeTypeEnumV2.TableDataUpdate,
  NodeTypeEnumV2.TableDataDelete,
  NodeTypeEnumV2.TableDataAdd,
  NodeTypeEnumV2.TableSQL,
  NodeTypeEnumV2.QA,
  NodeTypeEnumV2.DocumentExtraction,
  NodeTypeEnumV2.HTTPRequest,
];

/**
 * 重试次数选项
 */
export const RETRY_COUNT_OPTIONS_V2 = [
  { label: '不重试', value: 0 },
  { label: '1次', value: 1 },
  { label: '2次', value: 2 },
  { label: '3次', value: 3 },
];

// ==================== 比较类型映射 ====================

export const COMPARE_TYPE_MAP_V2 = {
  [CompareTypeEnumV2.EQUAL]: '=',
  [CompareTypeEnumV2.NOT_EQUAL]: '≠',
  [CompareTypeEnumV2.GREATER_THAN]: '>',
  [CompareTypeEnumV2.GREATER_THAN_OR_EQUAL]: '≥',
  [CompareTypeEnumV2.LESS_THAN]: '<',
  [CompareTypeEnumV2.LESS_THAN_OR_EQUAL]: '≤',
  [CompareTypeEnumV2.CONTAINS]: '⊃',
  [CompareTypeEnumV2.NOT_CONTAINS]: '⊅',
  [CompareTypeEnumV2.MATCH_REGEX]: '~',
  [CompareTypeEnumV2.IS_NULL]: '∅',
  [CompareTypeEnumV2.NOT_NULL]: '!∅',
};

// ==================== 答案类型映射 ====================

export const ANSWER_TYPE_MAP_V2 = {
  [AnswerTypeEnumV2.TEXT]: '直接回答',
  [AnswerTypeEnumV2.SELECT]: '选项回答',
};

// ==================== 节点配置常量 ====================

/**
 * 默认节点配置
 */
export const DEFAULT_NODE_CONFIG_V2 = {
  newNodeOffsetX: 100, // 新增节点时，x轴的间距
  newNodeOffsetY: 100, // 新增节点时，y轴的间距
  offsetGapX: 15, // 新增节点时，x轴的偏移量
  offsetGapY: 15, // 新增节点时，y轴的偏移量
};

/**
 * 节点尺寸配置映射
 */
export const DEFAULT_NODE_SIZE_MAP_V2: Record<
  | NodeTypeEnumV2.Loop
  | NodeTypeEnumV2.Condition
  | NodeTypeEnumV2.QA
  | NodeTypeEnumV2.IntentRecognition
  | 'default',
  { defaultWidth: number; defaultHeight: number }
> = {
  [NodeTypeEnumV2.Loop]: {
    defaultWidth: 860, // 循环节点宽度（660 + 内部开始/结束节点宽度 200）
    defaultHeight: 240, // 循环节点高度
  },
  [NodeTypeEnumV2.Condition]: {
    defaultWidth: 300, // 条件节点宽度
    defaultHeight: 120, // 条件节点高度
  },
  [NodeTypeEnumV2.QA]: {
    defaultWidth: 300, // 问答节点宽度
    defaultHeight: 110, // 问答节点高度
  },
  [NodeTypeEnumV2.IntentRecognition]: {
    defaultWidth: 300, // 意图识别节点宽度
    defaultHeight: 78, // 意图识别节点高度
  },
  default: {
    defaultWidth: 220, // 通用节点宽度
    defaultHeight: 44, // 通用节点高度 (32 + 10 + 2)
  },
};

// ==================== 选项映射 ====================

/**
 * 选项字母映射（A-Z）
 */
export const OPTIONS_MAP_V2 = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

// ==================== 默认表单数据 ====================

/**
 * 默认抽屉表单数据
 */
export const DEFAULT_DRAWER_FORM_V2: ChildNodeV2 = {
  type: NodeTypeEnumV2.Start,
  shape: NodeShapeEnumV2.General,
  nodeConfig: {
    inputArgs: [],
  },
  id: FoldFormIdEnumV2.empty,
  name: '测试',
  description: '测试',
  workflowId: 0,
  icon: '',
};

// ==================== 表单字段键 ====================

export const SKILL_FORM_KEY_V2 = 'skillComponentConfigs';

// ==================== 变量配置类型选项 ====================

export const VARIABLE_CONFIG_TYPE_OPTIONS_V2 = [
  { label: '设置变量值', value: 'SET_VARIABLE' },
  { label: '获取变量值', value: 'GET_VARIABLE' },
];

// ==================== 端口配置常量 ====================

/**
 * 端口组配置
 */
export const PORT_GROUPS_V2 = {
  [PortGroupEnumV2.in]: {
    position: { name: 'left' },
    attrs: {
      circle: {
        r: 3,
        magnet: true,
        magnetRadius: 30,
        stroke: '#5147FF',
        strokeWidth: 1,
        fill: '#5147FF',
      },
    },
  },
  [PortGroupEnumV2.out]: {
    position: { name: 'absolute' },
    attrs: {
      circle: {
        r: 3,
        magnet: true,
        magnetRadius: 30,
        stroke: '#5147FF',
        strokeWidth: 1,
        fill: '#5147FF',
      },
    },
  },
  [PortGroupEnumV2.special]: {
    position: { name: 'absolute' },
    attrs: {
      circle: {
        r: 3,
        magnet: true,
        magnetRadius: 30,
        stroke: '#5147FF',
        strokeWidth: 1,
        fill: '#5147FF',
      },
    },
  },
  [PortGroupEnumV2.exception]: {
    position: { name: 'absolute' },
    attrs: {
      circle: {
        r: 3,
        magnet: true,
        magnetRadius: 30,
        stroke: '#e67e22',
        strokeWidth: 1,
        fill: '#e67e22',
      },
    },
  },
};

// ==================== 边样式常量 ====================

/**
 * 默认边样式
 */
export const DEFAULT_EDGE_STYLE_V2 = {
  strokeWidth: 1,
  stroke: '#5147FF',
  strokeDasharray: '',
};

/**
 * 选中边样式
 */
export const SELECTED_EDGE_STYLE_V2 = {
  strokeWidth: 2,
  stroke: '#37D0FF',
};

/**
 * 运行中边样式
 */
export const RUNNING_EDGE_STYLE_V2 = {
  strokeWidth: 2,
  stroke: '#52c41a',
  strokeDasharray: '5 5',
};

// ==================== 图形配置常量 ====================

/**
 * 图形配置
 */
export const GRAPH_CONFIG_V2 = {
  grid: {
    visible: true,
    type: 'dot' as const,
    size: 22,
    args: {
      color: '#606060',
      thickness: 1,
    },
  },
  background: {
    color: '#f2f2f2',
  },
  mousewheel: {
    enabled: true,
    zoomAtMousePosition: true,
    minScale: 0.2,
    maxScale: 3,
    modifiers: ['ctrl', 'meta'] as ('ctrl' | 'meta' | 'shift' | 'alt')[],
  },
  connecting: {
    allowBlank: false,
    allowMulti: true,
    allowNode: false,
    allowLoop: false,
    allowEdge: false,
    highlight: true,
    snap: {
      radius: 22,
      anchor: 'bbox' as const,
    },
  },
};

// ==================== 历史记录配置 ====================

/**
 * 历史记录配置
 */
export const HISTORY_CONFIG_V2 = {
  enabled: true,
  stackSize: 50, // 最大撤销/重做步数
  ignoreChange: true, // 忽略属性变化（仅记录结构变化）
  ignoreAdd: false,
  ignoreRemove: false,
};

// ==================== 保存配置 ====================

/**
 * 自动保存配置
 */
export const AUTO_SAVE_CONFIG_V2 = {
  enabled: true, // 启用自动保存（节点修改后延迟保存）
  debounceTime: 2000, // 防抖时间（毫秒）- 用于输入等频繁操作，增加到2秒减少触发频率
  throttleTime: 10000, // 节流时间（毫秒）- 用于节点添加/删除等操作，增加到10秒减少触发频率
  maxRetries: 3, // 最大重试次数
  retryDelay: 1000, // 重试延迟（毫秒）
};

// ==================== 动画配置 ====================

/**
 * 节点动画配置
 */
export const NODE_ANIMATION_CONFIG_V2 = {
  highlight: {
    duration: 300,
    color: '#52c41a',
  },
  flash: {
    duration: 500,
    color: '#faad14',
  },
  pulse: {
    duration: 1000,
    color: '#1890ff',
  },
  running: {
    duration: 800,
    color: '#52c41a',
  },
  error: {
    duration: 500,
    color: '#ff4d4f',
  },
};

/**
 * 边动画配置
 */
export const EDGE_ANIMATION_CONFIG_V2 = {
  flow: {
    duration: 30,
    enabled: true,
  },
};

// ==================== 不可删除的节点类型 ====================

/**
 * 不可删除的节点类型
 */
export const NON_DELETABLE_NODE_TYPES_V2 = [
  NodeTypeEnumV2.Start,
  NodeTypeEnumV2.End,
  NodeTypeEnumV2.LoopStart,
  NodeTypeEnumV2.LoopEnd,
];

// ==================== 循环相关节点类型 ====================

/**
 * 循环相关节点类型
 */
export const LOOP_RELATED_NODE_TYPES_V2 = [
  NodeTypeEnumV2.Loop,
  NodeTypeEnumV2.LoopStart,
  NodeTypeEnumV2.LoopEnd,
  NodeTypeEnumV2.LoopBreak,
  NodeTypeEnumV2.LoopContinue,
];

// ==================== 特殊节点类型（有多个输出端口）====================

/**
 * 特殊节点类型（条件分支、意图识别、选项问答）
 */
export const SPECIAL_NODE_TYPES_V2 = [
  NodeTypeEnumV2.Condition,
  NodeTypeEnumV2.IntentRecognition,
  NodeTypeEnumV2.QA,
];

// ==================== 节点图标映射 ====================

/**
 * 节点类型对应的图标路径（需要根据实际项目调整）
 */
export const NODE_ICON_MAP_V2: Record<string, string> = {
  [NodeTypeEnumV2.Start]: 'start',
  [NodeTypeEnumV2.End]: 'end',
  [NodeTypeEnumV2.LLM]: 'llm',
  [NodeTypeEnumV2.Knowledge]: 'knowledge',
  [NodeTypeEnumV2.Plugin]: 'plugin',
  [NodeTypeEnumV2.Workflow]: 'workflow',
  [NodeTypeEnumV2.Code]: 'code',
  [NodeTypeEnumV2.HTTPRequest]: 'http',
  [NodeTypeEnumV2.Variable]: 'variable',
  [NodeTypeEnumV2.Condition]: 'condition',
  [NodeTypeEnumV2.Loop]: 'loop',
  [NodeTypeEnumV2.QA]: 'qa',
  [NodeTypeEnumV2.IntentRecognition]: 'intent',
  [NodeTypeEnumV2.TextProcessing]: 'text',
  [NodeTypeEnumV2.Output]: 'output',
  [NodeTypeEnumV2.DocumentExtraction]: 'document',
  [NodeTypeEnumV2.LongTermMemory]: 'memory',
  [NodeTypeEnumV2.TableDataQuery]: 'database',
  [NodeTypeEnumV2.TableDataAdd]: 'database',
  [NodeTypeEnumV2.TableDataUpdate]: 'database',
  [NodeTypeEnumV2.TableDataDelete]: 'database',
  [NodeTypeEnumV2.TableSQL]: 'database',
  [NodeTypeEnumV2.MCP]: 'mcp',
};

// ==================== 节点背景色映射 ====================

/**
 * 节点类型对应的背景色
 */
export const NODE_BACKGROUND_COLOR_MAP_V2: Record<string, string> = {
  [NodeTypeEnumV2.Start]: '#E6F7FF',
  [NodeTypeEnumV2.End]: '#F6FFED',
  [NodeTypeEnumV2.LLM]: '#F9F0FF',
  [NodeTypeEnumV2.Knowledge]: '#FFF7E6',
  [NodeTypeEnumV2.Plugin]: '#E6FFFB',
  [NodeTypeEnumV2.Workflow]: '#FFF0F6',
  [NodeTypeEnumV2.Code]: '#F0F5FF',
  [NodeTypeEnumV2.HTTPRequest]: '#FFFBE6',
  [NodeTypeEnumV2.Variable]: '#FCF4FF',
  [NodeTypeEnumV2.Condition]: '#E6F7FF',
  [NodeTypeEnumV2.Loop]: '#F0FFF4',
  [NodeTypeEnumV2.QA]: '#FFF2E8',
  [NodeTypeEnumV2.IntentRecognition]: '#E6FFFB',
  default: '#FFFFFF',
};
