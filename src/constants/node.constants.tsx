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
];

export const branchTypeMap = {
  IF: '如果',
  ELSE_IF: '否则如果',
  ELSE: '否则',
};

export const compareTypeMap = {
  EQUAL: '=',
  NOT_EQUAL: '≠',
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUAL: '≥',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUAL: '≤',
  CONTAINS: '⊃',
  NOT_CONTAINS: '⊅',
  MATCH_REGEX: '~',
  IS_NULL: '∅',
  NOT_NULL: '!∅',
};
export const ansewerTypeMap = {
  TEXT: '直接回答',
  SELECT: '选项回答',
};
export const optionsMap = ['A', 'B', 'C', 'D', 'E'];
