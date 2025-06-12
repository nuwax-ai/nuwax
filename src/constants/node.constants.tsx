import { AnswerTypeEnum, CompareTypeEnum } from '@/types/interfaces/graph';

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
export const GENERAL_NODE = 'general-Node';
export const LOOP_NODE = 'loop-node';

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
