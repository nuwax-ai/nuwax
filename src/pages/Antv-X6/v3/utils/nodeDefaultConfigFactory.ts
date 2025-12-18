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
  [NodeTypeEnum.Start]: '开始',
  [NodeTypeEnum.End]: '结束',
  [NodeTypeEnum.LLM]: '大模型',
  [NodeTypeEnum.Code]: '代码',
  [NodeTypeEnum.Condition]: '条件分支',
  [NodeTypeEnum.IntentRecognition]: '意图识别',
  [NodeTypeEnum.Loop]: '循环',
  [NodeTypeEnum.LoopStart]: '循环开始',
  [NodeTypeEnum.LoopEnd]: '循环结束',
  [NodeTypeEnum.LoopBreak]: '终止循环',
  [NodeTypeEnum.LoopContinue]: '继续循环',
  [NodeTypeEnum.QA]: '问答',
  [NodeTypeEnum.Variable]: '变量',
  [NodeTypeEnum.VariableAggregation]: '变量聚合',
  [NodeTypeEnum.DocumentExtraction]: '文档提取',
  [NodeTypeEnum.Knowledge]: '知识库',
  [NodeTypeEnum.HTTPRequest]: '网络请求',
  [NodeTypeEnum.Plugin]: '插件',
  [NodeTypeEnum.Workflow]: '工作流',
  [NodeTypeEnum.LongTermMemory]: '长期记忆',
  [NodeTypeEnum.MCP]: 'MCP',
  [NodeTypeEnum.TableDataAdd]: '数据新增',
  [NodeTypeEnum.TableDataDelete]: '数据删除',
  [NodeTypeEnum.TableDataUpdate]: '数据更新',
  [NodeTypeEnum.TableDataQuery]: '数据查询',
  [NodeTypeEnum.TableSQL]: 'SQL执行',
  [NodeTypeEnum.Output]: '输出',
  [NodeTypeEnum.LoopCondition]: '循环条件',
  [NodeTypeEnum.Interval]: '间隔',
  [NodeTypeEnum.TextProcessing]: '文本处理',
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
      intent: '意图1',
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
      content: '选项1',
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
            description: '模型输出文本',
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
            description: '匹配的意图',
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
            description: '循环索引',
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
            description: '用户回答',
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
            description: '操作是否成功',
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
            description: '提取的文档内容',
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
            description: '召回的知识内容',
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
            description: 'HTTP响应',
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

  const loopStartNode: ChildNode = {
    id: loopStartId,
    name: NODE_DEFAULT_NAMES[NodeTypeEnum.LoopStart] || '循环开始',
    description: '',
    workflowId,
    type: NodeTypeEnum.LoopStart,
    shape: NodeShapeEnum.General,
    icon: '',
    loopNodeId,
    nextNodeIds: [loopEndId],
    nodeConfig: {
      ...createDefaultNodeConfig(NodeTypeEnum.LoopStart),
      extension: {
        x: loopX + LOOP_START_NODE_X_OFFSET,
        y: loopY + LOOP_INNER_NODE_Y_OFFSET,
        width: 220,
        height: 44,
      },
    },
  };

  const loopEndNode: ChildNode = {
    id: loopEndId,
    name: NODE_DEFAULT_NAMES[NodeTypeEnum.LoopEnd] || '循环结束',
    description: '',
    workflowId,
    type: NodeTypeEnum.LoopEnd,
    shape: NodeShapeEnum.General,
    icon: '',
    loopNodeId,
    nextNodeIds: [],
    nodeConfig: {
      ...createDefaultNodeConfig(NodeTypeEnum.LoopEnd),
      extension: {
        x: loopX + LOOP_END_NODE_X_OFFSET,
        y: loopY + LOOP_INNER_NODE_Y_OFFSET,
        width: 220,
        height: 44,
      },
    },
  };

  return {
    innerNodes: [loopStartNode, loopEndNode],
    innerStartNodeId: loopStartId,
    innerEndNodeId: loopEndId,
  };
}
