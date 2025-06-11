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
