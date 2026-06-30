import { t } from '@/services/i18nRuntime';
import {
  AnswerTypeEnum,
  CompareTypeEnum,
  ExceptionHandleTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { FoldFormIdEnum, VariableConfigTypeEnum } from '@/types/enums/node';
import { ChildNode } from '@/types/interfaces/graph';
import { HitlAnswerTypeEnum } from '../agentFlow/enums/hitlAnswerType';

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
  'KnowledgeInsert',
  'TableSQL',
  'TableDataQuery',
  'TableDataUpdate',
  'TableDataDelete',
  'TableDataAdd',
];

export const branchTypeMap = {
  IF: t('PC.Pages.AntvX6Condition.if'),
  ELSE_IF: t('PC.Pages.AntvX6Condition.elseIf'),
  ELSE: t('PC.Pages.AntvX6Condition.else'),
};
export const GENERAL_NODE = NodeShapeEnum.General;
export const LOOP_NODE = NodeShapeEnum.Loop;

// 异常处理类型 label 映射
export const EXCEPTION_HANDLE_OPTIONS = [
  {
    label: t('PC.Pages.AntvX6ExceptionItem.interruptFlow'),
    value: ExceptionHandleTypeEnum.INTERRUPT,
  },
  {
    label: t('PC.Pages.AntvX6ExceptionItem.returnSpecificContent'),
    value: ExceptionHandleTypeEnum.SPECIFIC_CONTENT,
  },
  {
    label: t('PC.Pages.AntvX6ExceptionItem.executeExceptionFlow'),
    value: ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW,
  },
];
//  异常处理，支持节点包括：大模型、插件、工作流、MCP、代码、意图识别、知识库、数据表（相关五个节点）、问答、文档提取、HTTP请求、AgentFlow 节点
export const EXCEPTION_NODES_TYPE = [
  NodeTypeEnum.LLM,
  NodeTypeEnum.Plugin,
  NodeTypeEnum.Workflow,
  NodeTypeEnum.MCP,
  NodeTypeEnum.Code,
  NodeTypeEnum.IntentRecognition,
  NodeTypeEnum.RouteDecision,
  NodeTypeEnum.Knowledge,
  NodeTypeEnum.KnowledgeInsert,
  NodeTypeEnum.TableDataQuery,
  NodeTypeEnum.TableDataUpdate,
  NodeTypeEnum.TableDataDelete,
  NodeTypeEnum.TableDataAdd,
  NodeTypeEnum.TableSQL,
  NodeTypeEnum.QA,
  NodeTypeEnum.DocumentExtraction,
  NodeTypeEnum.HTTPRequest,
  // AgentFlow 专用节点
  NodeTypeEnum.Agent,
  NodeTypeEnum.HumanInteraction,
];

// AgentFlow 中不展示「异常处理」配置的节点：路由决策 / 询问用户。
// 这两类仍保留在 EXCEPTION_NODES_TYPE 中以维持端口更新（needUpdateNodes）逻辑，
// 仅在 showExceptionHandle / 异常端口 / 节点高度计算时排除其异常项。
export const EXCEPTION_HANDLE_HIDDEN_TYPES = [
  NodeTypeEnum.RouteDecision,
  NodeTypeEnum.HumanInteraction,
];

export const RETRY_COUNT_OPTIONS = [
  { label: t('PC.Pages.AntvX6ExceptionItem.noRetry'), value: 0 },
  { label: t('PC.Pages.AntvX6ExceptionItem.retryOnce'), value: 1 },
  { label: t('PC.Pages.AntvX6ExceptionItem.retryTwice'), value: 2 },
  { label: t('PC.Pages.AntvX6ExceptionItem.retryThrice'), value: 3 },
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

/** 含 Workflow QA（TEXT/SELECT）与 AgentFlow 表单回复（FORM） */
export const answerTypeMap: Record<string, string> = {
  [AnswerTypeEnum.TEXT]: t('PC.Pages.AntvX6ComplexNode.answerTypeText'),
  [AnswerTypeEnum.SELECT]: t('PC.Pages.AntvX6ComplexNode.answerTypeSelect'),
  [HitlAnswerTypeEnum.FORM]: t('PC.Pages.AgentFlowNode.replyModeFormReply'),
};
export const DEFAULT_NODE_CONFIG = {
  newNodeOffsetX: 100, // 新增节点时，x轴的间距
  newNodeOffsetY: 100, // 新增节点时，y轴的间距
  offsetGapX: 15, // 新增节点时，x轴的偏移量
  offsetGapY: 15, // 新增节点时，y轴的偏移量
};

export const DEFAULT_NODE_CONFIG_MAP: Record<
  | NodeTypeEnum.Loop
  | NodeTypeEnum.Condition
  | NodeTypeEnum.QA
  | NodeTypeEnum.IntentRecognition
  | 'default',
  { defaultWidth: number; defaultHeight: number }
> = {
  [NodeTypeEnum.Loop]: {
    defaultWidth: 860, // 初始 循环节点宽度
    defaultHeight: 240, // 循环节点高度
  },
  [NodeTypeEnum.Condition]: {
    defaultWidth: 300, // 条件节点宽度
    defaultHeight: 120, // 条件节点高度
  },
  [NodeTypeEnum.QA]: {
    defaultWidth: 300, // 问答节点宽度
    defaultHeight: 110, // 问答节点高度
  },
  [NodeTypeEnum.IntentRecognition]: {
    defaultWidth: 300, // 意图识别节点宽度
    defaultHeight: 78, // 意图识别节点高度
  },
  default: {
    defaultWidth: 220, // 通用节点宽度
    defaultHeight: 32 + 10 + 2, // 通用节点高度
  },
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

export const DEFAULT_DRAWER_FORM: ChildNode = {
  type: NodeTypeEnum.Start,
  shape: NodeShapeEnum.General,
  nodeConfig: {
    inputArgs: [],
  },
  id: FoldFormIdEnum.empty,
  name: t('PC.Pages.AntvX6NodeConstants.defaultNodeName'),
  description: t('PC.Pages.AntvX6NodeConstants.defaultNodeDescription'),
  workflowId: 0,
  icon: '',
};

export const SKILL_FORM_KEY = 'skillComponentConfigs';

export const VARIABLE_CONFIG_TYPE_OPTIONS = [
  {
    label: t('PC.Pages.AntvX6NodeItem.setVariable'),
    value: VariableConfigTypeEnum.SET_VARIABLE,
  },
  {
    label: t('PC.Pages.AntvX6NodeItem.getVariable'),
    value: VariableConfigTypeEnum.GET_VARIABLE,
  },
];
