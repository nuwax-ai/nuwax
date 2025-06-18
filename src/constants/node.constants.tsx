import {
  AnswerTypeEnum,
  CompareTypeEnum,
  ExceptionHandleTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';

// 有试运行的节点
export const testRunList = [
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

export const branchTypeMap = {
  IF: '如果',
  ELSE_IF: '否则如果',
  ELSE: '否则',
};
export const GENERAL_NODE = NodeShapeEnum.General;
export const LOOP_NODE = NodeShapeEnum.Loop;

// 异常处理类型 label 映射
export const EXCEPTION_HANDLE_OPTIONS = [
  {
    label: '中断流程',
    value: ExceptionHandleTypeEnum.INTERRUPT,
  },
  {
    label: '返回特定内容',
    value: ExceptionHandleTypeEnum.SPECIFIC_CONTENT,
  },
  {
    label: '执行异常流程',
    value: ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW,
  },
];
//  异常处理，支持节点包括：大模型、插件、工作流、MCP、代码、意图识别、知识库、数据表（相关五个节点）、问答、文档提取、HTTP请求
export const EXCEPTION_NODES_TYPE = [
  NodeTypeEnum.LLM,
  NodeTypeEnum.Plugin,
  NodeTypeEnum.Workflow,
  NodeTypeEnum.MCP,
  NodeTypeEnum.Code,
  NodeTypeEnum.IntentRecognition,
  NodeTypeEnum.Knowledge,
  NodeTypeEnum.TableDataQuery,
  NodeTypeEnum.TableDataUpdate,
  NodeTypeEnum.TableDataDelete,
  NodeTypeEnum.TableDataAdd,
  NodeTypeEnum.TableSQL,
  NodeTypeEnum.QA,
  NodeTypeEnum.DocumentExtraction,
  NodeTypeEnum.HTTPRequest,
];

export const RETRY_COUNT_OPTIONS = [
  { label: '不重试', value: 0 },
  { label: '1次', value: 1 },
  { label: '2次', value: 2 },
  { label: '3次', value: 3 },
];

export const compareTypeMap = {
  [CompareTypeEnum.EQUAL]: '=',
  [CompareTypeEnum.NOT_EQUAL]: '≠',
  [CompareTypeEnum.GREATER_THAN]: '>',
  [CompareTypeEnum.GREATER_THAN_OR_EQUAL]: '≥',
  [CompareTypeEnum.LESS_THAN]: '<',
  [CompareTypeEnum.LESS_THAN_OR_EQUAL]: '≤',
  [CompareTypeEnum.CONTAINS]: '⊃',
  [CompareTypeEnum.NOT_CONTAINS]: '⊅',
  [CompareTypeEnum.MATCH_REGEX]: '~',
  [CompareTypeEnum.IS_NULL]: '∅',
  [CompareTypeEnum.NOT_NULL]: '!∅',
};

export const answerTypeMap = {
  [AnswerTypeEnum.TEXT]: '直接回答',
  [AnswerTypeEnum.SELECT]: '选项回答',
};

export const DEFAULT_NODE_CONFIG = {
  generalNode: {
    defaultWidth: 220, // 通用节点宽度
    defaultHeight: 42, // 通用节点高度
  },
  loopNode: {
    defaultWidth: 600, // 循环节点宽度
    defaultHeight: 240, // 循环节点高度
  },
  conditionNode: {
    defaultWidth: 300, // 条件节点宽度
    defaultHeight: 120, // 条件节点高度
  },
  qaNode: {
    defaultWidth: 300, // 问答节点宽度
    defaultHeight: 110, // 问答节点高度
  },
  intentRecognitionNode: {
    defaultWidth: 300, // 意图识别节点宽度
    defaultHeight: 74, // 意图识别节点高度
  },
  newNodeOffsetX: 100, // 新增节点时，x轴的间距
  newNodeOffsetY: 100, // 新增节点时，y轴的间距
  offsetGapX: 15, // 新增节点时，x轴的偏移量
  offsetGapY: 15, // 新增节点时，y轴的偏移量
};

export const optionsMap = [
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

// export const StatusMap={
//   Developing:"",
//   Applying:"",
//   Published:"发布",
//   Rejected:'拒绝'
// }
