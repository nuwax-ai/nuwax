/**
 * 节点默认配置工厂
 *
 * 用于离线模式下生成节点的默认配置
 */

import {
  AnswerTypeEnum,
  DataTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { ChildNode } from '@/types/interfaces/graph';
import { Extension, NodeConfig } from '@/types/interfaces/node';

import {
  LOOP_END_NODE_X_OFFSET,
  LOOP_INNER_NODE_Y_OFFSET,
  LOOP_NODE_DEFAULT_HEIGHT,
  LOOP_NODE_DEFAULT_WIDTH,
  LOOP_START_NODE_X_OFFSET,
} from '../constants/loopNodeConstants';
import { generateFallbackNodeId } from './nodeUtils';

/**
 * 节点类型默认名称映射
 */
export const NODE_DEFAULT_NAMES: Partial<Record<NodeTypeEnum, string>> = {
  [NodeTypeEnum.Start]: 'Start',
  [NodeTypeEnum.End]: 'End',
  [NodeTypeEnum.LLM]: 'LLM',
  [NodeTypeEnum.Code]: 'Code',
  [NodeTypeEnum.Condition]: 'Condition',
  [NodeTypeEnum.IntentRecognition]: 'Intent Recognition',
  [NodeTypeEnum.Loop]: 'Loop',
  [NodeTypeEnum.LoopStart]: 'Loop Start',
  [NodeTypeEnum.LoopEnd]: 'Loop End',
  [NodeTypeEnum.LoopBreak]: 'Break Loop',
  [NodeTypeEnum.LoopContinue]: 'Continue Loop',
  [NodeTypeEnum.QA]: 'QA',
  [NodeTypeEnum.Variable]: 'Variable',
  [NodeTypeEnum.VariableAggregation]: 'Variable Aggregation',
  [NodeTypeEnum.DocumentExtraction]: 'Document Extraction',
  [NodeTypeEnum.Knowledge]: 'Knowledge Base',
  [NodeTypeEnum.HTTPRequest]: 'HTTP Request',
  [NodeTypeEnum.Plugin]: 'Plugin',
  [NodeTypeEnum.Workflow]: 'Workflow',
  [NodeTypeEnum.LongTermMemory]: 'Long-term Memory',
  [NodeTypeEnum.MCP]: 'MCP',
  [NodeTypeEnum.TableDataAdd]: 'Table Data Add',
  [NodeTypeEnum.TableDataDelete]: 'Table Data Delete',
  [NodeTypeEnum.TableDataUpdate]: 'Table Data Update',
  [NodeTypeEnum.TableDataQuery]: 'Table Data Query',
  [NodeTypeEnum.TableSQL]: 'SQL Execution',
  [NodeTypeEnum.Output]: 'Output',
  [NodeTypeEnum.LoopCondition]: 'Loop Condition',
  [NodeTypeEnum.Interval]: 'Interval',
  [NodeTypeEnum.TextProcessing]: 'Text Processing',
};

/**
 * 生成唯一 ID
 */
function generateUuid(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建默认参数对象
 * 与后端返回的 inputArgs/outputArgs 结构对齐
 */
interface DefaultArgOptions {
  key: string;
  name: string;
  description?: string;
  dataType: DataTypeEnum;
  require?: boolean;
  systemVariable?: boolean;
  bindValueType?: string | null;
  bindValue?: string | null;
  subArgs?: any[] | null;
}

function createDefaultArg(options: DefaultArgOptions): any {
  return {
    key: options.key,
    name: options.name,
    displayName: null,
    description: options.description || '',
    dataType: options.dataType,
    originDataType: null,
    require: options.require ?? false,
    enable: true,
    systemVariable: options.systemVariable ?? false,
    bindValueType: options.bindValueType ?? null,
    bindValue: options.bindValue ?? null,
    subArgs: options.subArgs ?? null,
    inputType: null,
    selectConfig: null,
    loopId: null,
    children: options.subArgs ?? null, // 与 subArgs 保持同步
  };
}

/**
 * 创建默认异常处理配置
 * 与后端返回的 exceptionHandleConfig 结构对齐
 */
function createDefaultExceptionHandleConfig(): any {
  return {
    retryCount: 0,
    timeout: 180,
    exceptionHandleType: 'INTERRUPT',
    specificContent: {},
    exceptionHandleNodeIds: [],
  };
}

/**
 * 创建默认条件分支配置
 */
function createDefaultConditionBranches(): any[] {
  return [
    {
      uuid: `branch-${generateUuid()}`,
      branchType: 'IF',
      conditionType: 'AND',
      conditionArgs: [],
      nextNodeIds: [],
    },
    {
      uuid: `branch-else-${generateUuid()}`,
      branchType: 'ELSE',
      conditionType: 'AND',
      conditionArgs: [],
      nextNodeIds: [],
    },
  ];
}

/**
 * 创建默认意图配置
 */
function createDefaultIntentConfig(): any[] {
  return [
    {
      uuid: `intent-${generateUuid()}`,
      intent: 'Intent 1',
      description: '',
      nextNodeIds: [],
    },
  ];
}

/**
 * 创建默认问答选项
 */
function createDefaultQAOptions(): any[] {
  return [
    {
      uuid: `option-${generateUuid()}`,
      index: 0,
      content: 'Option 1',
      nextNodeIds: [],
    },
  ];
}

/**
 * 根据节点类型创建默认配置
 */
export function createDefaultNodeConfig(
  type: NodeTypeEnum,
  extension?: Extension,
): NodeConfig {
  const baseConfig: NodeConfig = {
    extension: extension || { x: 0, y: 0 },
    exceptionHandleConfig: createDefaultExceptionHandleConfig(),
  };

  switch (type) {
    case NodeTypeEnum.Start:
      return {
        ...baseConfig,
        inputArgs: [],
      };

    case NodeTypeEnum.End:
    case NodeTypeEnum.Output:
      return {
        ...baseConfig,
        outputArgs: [],
        returnType: 'VARIABLE',
      };

    case NodeTypeEnum.LLM:
      return {
        ...baseConfig,
        modelId: undefined,
        skillComponentConfigs: [],
        inputArgs: [],
        outputArgs: [
          createDefaultArg({
            key: 'text',
            name: 'text',
            dataType: DataTypeEnum.String,
            description: 'Model output text',
            require: true,
            systemVariable: true,
          }),
        ],
      };

    case NodeTypeEnum.Code:
      return {
        ...baseConfig,
        inputArgs: [],
        outputArgs: [],
      };

    case NodeTypeEnum.Condition:
      return {
        ...baseConfig,
        conditionBranchConfigs: createDefaultConditionBranches(),
      };

    case NodeTypeEnum.IntentRecognition:
      return {
        ...baseConfig,
        intentConfigs: createDefaultIntentConfig(),
        inputArgs: [],
        outputArgs: [
          createDefaultArg({
            key: 'matchedIntent',
            name: 'matchedIntent',
            dataType: DataTypeEnum.String,
            description: 'Matched intent',
            require: true,
            systemVariable: true,
          }),
        ],
      };

    case NodeTypeEnum.Loop:
      return {
        ...baseConfig,
        loopType: 'SPECIFY_TIMES_LOOP',
        inputArgs: [],
        outputArgs: [],
        variableArgs: [],
        extension: {
          ...baseConfig.extension,
          width: LOOP_NODE_DEFAULT_WIDTH,
          height: LOOP_NODE_DEFAULT_HEIGHT,
        },
      };

    case NodeTypeEnum.LoopStart:
      return {
        ...baseConfig,
        inputArgs: [],
        outputArgs: [
          createDefaultArg({
            key: 'INDEX',
            name: 'INDEX',
            dataType: DataTypeEnum.Integer,
            description: 'Loop index',
            require: true,
            systemVariable: true,
          }),
        ],
      };

    case NodeTypeEnum.LoopEnd:
      return {
        ...baseConfig,
        inputArgs: [],
        outputArgs: [],
      };

    case NodeTypeEnum.LoopBreak:
    case NodeTypeEnum.LoopContinue:
      return {
        ...baseConfig,
      };

    case NodeTypeEnum.QA:
      return {
        ...baseConfig,
        answerType: AnswerTypeEnum.SELECT,
        options: createDefaultQAOptions(),
        inputArgs: [],
        outputArgs: [
          createDefaultArg({
            key: 'answer',
            name: 'answer',
            dataType: DataTypeEnum.String,
            description: 'User answer',
            require: true,
            systemVariable: true,
          }),
        ],
      };

    case NodeTypeEnum.Variable:
      return {
        ...baseConfig,
        configType: 'SET_VARIABLE',
        inputArgs: [],
        outputArgs: [
          createDefaultArg({
            key: 'isSuccess',
            name: 'isSuccess',
            dataType: DataTypeEnum.Boolean,
            description: 'Operation succeeded',
            require: true,
            systemVariable: true,
          }),
        ],
      };

    case NodeTypeEnum.VariableAggregation:
      return {
        ...baseConfig,
        aggregationStrategy: 'FIRST',
        variableGroups: [],
        inputArgs: [],
        outputArgs: [],
      };

    case NodeTypeEnum.DocumentExtraction:
      return {
        ...baseConfig,
        inputArgs: [],
        outputArgs: [
          createDefaultArg({
            key: 'content',
            name: 'content',
            dataType: DataTypeEnum.String,
            description: 'Extracted document content',
            require: true,
            systemVariable: true,
          }),
        ],
      };

    case NodeTypeEnum.Knowledge:
      return {
        ...baseConfig,
        knowledgeBaseConfigs: [],
        searchStrategy: 'MIXED',
        maxRecallCount: 5,
        matchingDegree: 0.5,
        inputArgs: [],
        outputArgs: [
          createDefaultArg({
            key: 'result',
            name: 'result',
            dataType: DataTypeEnum.Array_String,
            description: 'Retrieved knowledge content',
            require: true,
            systemVariable: true,
          }),
        ],
      };

    case NodeTypeEnum.HTTPRequest:
      return {
        ...baseConfig,
        inputArgs: [],
        outputArgs: [
          createDefaultArg({
            key: 'response',
            name: 'response',
            dataType: DataTypeEnum.Object,
            description: 'HTTP response',
            require: true,
            systemVariable: true,
          }),
        ],
      };

    case NodeTypeEnum.Plugin:
    case NodeTypeEnum.Workflow:
    case NodeTypeEnum.LongTermMemory:
    case NodeTypeEnum.MCP:
      return {
        ...baseConfig,
        inputArgs: [],
        outputArgs: [],
      };

    case NodeTypeEnum.TableDataAdd:
    case NodeTypeEnum.TableDataDelete:
    case NodeTypeEnum.TableDataUpdate:
    case NodeTypeEnum.TableDataQuery:
    case NodeTypeEnum.TableSQL:
      return {
        ...baseConfig,
        tableId: undefined,
        conditionType: 'AND',
        conditionArgs: [],
        inputArgs: [],
        outputArgs: [],
      };

    default:
      return {
        ...baseConfig,
        inputArgs: [],
        outputArgs: [],
      };
  }
}

/**
 * 创建循环节点的内部节点（LoopStart + LoopEnd）
 */
export function createLoopInnerNodes(
  loopNodeId: number,
  workflowId: number,
  loopExtension: Extension,
): {
  innerNodes: ChildNode[];
  innerStartNodeId: number;
  innerEndNodeId: number;
} {
  const loopStartId = generateFallbackNodeId(workflowId);
  // 确保两个 ID 不同
  const loopEndId = loopStartId + 1;

  const loopX = loopExtension.x || 0;
  const loopY = loopExtension.y || 0;

  const loopStartNode = {
    id: loopStartId,
    name: NODE_DEFAULT_NAMES[NodeTypeEnum.LoopStart] || 'Loop Start',
    description: 'Loop single-iteration start node',
    workflowId,
    type: NodeTypeEnum.LoopStart,
    shape: NodeShapeEnum.General,
    icon: '',
    loopNodeId,
    nextNodeIds: [loopEndId],
    preNodes: [],
    nextNodes: [],
    unreachableNextNodeIds: [],
    originalNextNodeIds: null,
    innerNodes: null,
    innerStartNodeId: null,
    innerEndNodeId: null,
    virtualExecute: false,
    startNode: null,
    endNode: null,
    innerEndNode: false,
    nodeConfig: {
      ...createDefaultNodeConfig(NodeTypeEnum.LoopStart),
      inputArgs: undefined,
      outputArgs: undefined,
      extension: {
        x: loopX + LOOP_START_NODE_X_OFFSET,
        y: loopY + LOOP_INNER_NODE_Y_OFFSET,
      },
    },
  } as ChildNode;

  const loopEndNode = {
    id: loopEndId,
    name: NODE_DEFAULT_NAMES[NodeTypeEnum.LoopEnd] || 'Loop End',
    description: 'Loop single-iteration end node',
    workflowId,
    type: NodeTypeEnum.LoopEnd,
    shape: NodeShapeEnum.General,
    icon: '',
    loopNodeId,
    nextNodeIds: [],
    preNodes: [],
    nextNodes: [],
    unreachableNextNodeIds: [],
    originalNextNodeIds: null,
    innerNodes: null,
    innerStartNodeId: null,
    innerEndNodeId: null,
    virtualExecute: false,
    startNode: null,
    endNode: null,
    innerEndNode: false,
    nodeConfig: {
      ...createDefaultNodeConfig(NodeTypeEnum.LoopEnd),
      inputArgs: undefined,
      outputArgs: undefined,
      extension: {
        x: loopX + LOOP_END_NODE_X_OFFSET,
        y: loopY + LOOP_INNER_NODE_Y_OFFSET,
      },
    },
  } as ChildNode;

  return {
    innerNodes: [loopStartNode, loopEndNode],
    innerStartNodeId: loopStartId,
    innerEndNodeId: loopEndId,
  };
}
