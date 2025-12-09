/**
 * V2 工作流验证器
 * 
 * 实现前端业务逻辑验证：
 * 1. 节点配置完整性验证
 * 2. 连线关系验证（循环检测、端口匹配）
 * 3. 变量引用验证
 * 
 * 完全独立，不依赖 v1 任何代码
 */

import type {
  ChildNodeV2,
  EdgeV2,
  WorkflowDataV2,
  ValidationResultV2,
  NodeConfigV2,
  InputAndOutConfigV2,
} from '../types';
import {
  NodeTypeEnumV2,
  AnswerTypeEnumV2,
} from '../types';
import {
  NON_DELETABLE_NODE_TYPES_V2,
  EXCEPTION_NODES_TYPE_V2,
} from '../constants';

// ==================== 验证结果类型 ====================

export interface ValidationError {
  nodeId: number;
  nodeName: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ==================== 节点配置验证 ====================

/**
 * 验证开始节点
 */
function validateStartNode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  // 开始节点通常只需要验证输入参数格式
  return errors;
}

/**
 * 验证结束节点
 */
function validateEndNode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeConfig } = node;
  
  // 检查返回类型
  if (!nodeConfig.returnType) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'returnType',
      message: '结束节点需要设置返回类型',
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * 验证 LLM 节点
 */
function validateLLMNode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeConfig } = node;
  
  // 检查模型ID
  if (!nodeConfig.modelId) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'modelId',
      message: '请选择模型',
      severity: 'error',
    });
  }
  
  // 检查用户提示词
  if (!nodeConfig.userPrompt?.trim()) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'userPrompt',
      message: '请输入用户提示词',
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * 验证条件分支节点
 */
function validateConditionNode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeConfig } = node;
  
  // 检查条件分支配置
  if (!nodeConfig.conditionBranchConfigs || nodeConfig.conditionBranchConfigs.length === 0) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'conditionBranchConfigs',
      message: '请配置条件分支',
      severity: 'error',
    });
  } else {
    // 检查每个分支
    nodeConfig.conditionBranchConfigs.forEach((branch, index) => {
      if (branch.branchType !== 'ELSE' && (!branch.conditionArgs || branch.conditionArgs.length === 0)) {
        errors.push({
          nodeId: node.id,
          nodeName: node.name,
          field: `conditionBranchConfigs[${index}]`,
          message: `分支 ${index + 1} 缺少条件配置`,
          severity: 'error',
        });
      }
    });
  }
  
  return errors;
}

/**
 * 验证循环节点
 */
function validateLoopNode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeConfig, innerNodes, innerStartNodeId, innerEndNodeId } = node;
  
  // 检查循环类型
  if (!nodeConfig.loopType) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'loopType',
      message: '请选择循环类型',
      severity: 'error',
    });
  }
  
  // 检查内部节点
  if (!innerNodes || innerNodes.length === 0) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'innerNodes',
      message: '循环体内没有节点',
      severity: 'warning',
    });
  }
  
  // 检查内部开始和结束节点
  if (!innerStartNodeId || innerStartNodeId === -1) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'innerStartNodeId',
      message: '循环体缺少开始节点连接',
      severity: 'error',
    });
  }
  
  if (!innerEndNodeId || innerEndNodeId === -1) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'innerEndNodeId',
      message: '循环体缺少结束节点连接',
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * 验证问答节点
 */
function validateQANode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeConfig } = node;
  
  // 检查问题
  if (!nodeConfig.question?.trim()) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'question',
      message: '请输入问题',
      severity: 'error',
    });
  }
  
  // 如果是选项回答，检查选项
  if (nodeConfig.answerType === AnswerTypeEnumV2.SELECT) {
    if (!nodeConfig.options || nodeConfig.options.length === 0) {
      errors.push({
        nodeId: node.id,
        nodeName: node.name,
        field: 'options',
        message: '请添加选项',
        severity: 'error',
      });
    }
  }
  
  return errors;
}

/**
 * 验证 HTTP 请求节点
 */
function validateHTTPNode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeConfig } = node;
  
  // 检查 URL
  if (!nodeConfig.url?.trim()) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'url',
      message: '请输入请求 URL',
      severity: 'error',
    });
  }
  
  // 检查请求方法
  if (!nodeConfig.method) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'method',
      message: '请选择请求方法',
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * 验证代码节点
 */
function validateCodeNode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeConfig } = node;
  
  // 检查代码
  const code = nodeConfig.codeLanguage === 'JavaScript' 
    ? nodeConfig.codeJavaScript 
    : nodeConfig.codePython;
    
  if (!code?.trim()) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'code',
      message: '请输入代码',
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * 验证知识库节点
 */
function validateKnowledgeNode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeConfig } = node;
  
  // 检查知识库配置
  if (!nodeConfig.knowledgeBaseConfigs || nodeConfig.knowledgeBaseConfigs.length === 0) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'knowledgeBaseConfigs',
      message: '请选择知识库',
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * 验证意图识别节点
 */
function validateIntentNode(node: ChildNodeV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeConfig } = node;
  
  // 检查意图配置
  if (!nodeConfig.intentConfigs || nodeConfig.intentConfigs.length === 0) {
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      field: 'intentConfigs',
      message: '请配置意图',
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * 根据节点类型验证节点配置
 */
function validateNodeConfig(node: ChildNodeV2): ValidationError[] {
  switch (node.type) {
    case NodeTypeEnumV2.Start:
      return validateStartNode(node);
    case NodeTypeEnumV2.End:
      return validateEndNode(node);
    case NodeTypeEnumV2.LLM:
      return validateLLMNode(node);
    case NodeTypeEnumV2.Condition:
      return validateConditionNode(node);
    case NodeTypeEnumV2.Loop:
      return validateLoopNode(node);
    case NodeTypeEnumV2.QA:
      return validateQANode(node);
    case NodeTypeEnumV2.HTTPRequest:
      return validateHTTPNode(node);
    case NodeTypeEnumV2.Code:
      return validateCodeNode(node);
    case NodeTypeEnumV2.Knowledge:
      return validateKnowledgeNode(node);
    case NodeTypeEnumV2.IntentRecognition:
      return validateIntentNode(node);
    default:
      return [];
  }
}

// ==================== 连线关系验证 ====================

/**
 * 构建节点图（邻接表）
 */
function buildNodeGraph(nodes: ChildNodeV2[]): Map<number, number[]> {
  const graph = new Map<number, number[]>();
  
  nodes.forEach(node => {
    graph.set(node.id, node.nextNodeIds || []);
  });
  
  return graph;
}

/**
 * 检测循环依赖（使用 DFS）
 */
function detectCycle(graph: Map<number, number[]>, startNodeId: number): number[] | null {
  const visited = new Set<number>();
  const recursionStack = new Set<number>();
  const path: number[] = [];
  
  function dfs(nodeId: number): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // 找到循环
        path.push(neighbor);
        return true;
      }
    }
    
    path.pop();
    recursionStack.delete(nodeId);
    return false;
  }
  
  if (dfs(startNodeId)) {
    return path;
  }
  
  return null;
}

/**
 * 检查节点是否可达结束节点
 */
function canReachEnd(
  graph: Map<number, number[]>,
  nodeId: number,
  endNodeIds: Set<number>,
  visited: Set<number> = new Set()
): boolean {
  if (endNodeIds.has(nodeId)) {
    return true;
  }
  
  if (visited.has(nodeId)) {
    return false;
  }
  
  visited.add(nodeId);
  
  const neighbors = graph.get(nodeId) || [];
  for (const neighbor of neighbors) {
    if (canReachEnd(graph, neighbor, endNodeIds, visited)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 验证连线关系
 */
function validateConnections(data: WorkflowDataV2): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodeList, edgeList } = data;
  
  // 构建节点映射
  const nodeMap = new Map<number, ChildNodeV2>();
  nodeList.forEach(node => nodeMap.set(node.id, node));
  
  // 构建节点图
  const graph = buildNodeGraph(nodeList);
  
  // 找到开始节点和结束节点
  const startNodes = nodeList.filter(n => n.type === NodeTypeEnumV2.Start);
  const endNodes = nodeList.filter(n => n.type === NodeTypeEnumV2.End);
  const endNodeIds = new Set(endNodes.map(n => n.id));
  
  // 检查是否有开始节点
  if (startNodes.length === 0) {
    errors.push({
      nodeId: 0,
      nodeName: '工作流',
      message: '工作流缺少开始节点',
      severity: 'error',
    });
  }
  
  // 检查是否有结束节点
  if (endNodes.length === 0) {
    errors.push({
      nodeId: 0,
      nodeName: '工作流',
      message: '工作流缺少结束节点',
      severity: 'error',
    });
  }
  
  // 检查每个非循环节点是否有出口（除了结束节点）
  nodeList.forEach(node => {
    // 跳过结束节点和循环相关节点
    if (node.type === NodeTypeEnumV2.End || 
        node.type === NodeTypeEnumV2.LoopEnd ||
        node.type === NodeTypeEnumV2.LoopBreak ||
        node.type === NodeTypeEnumV2.LoopContinue) {
      return;
    }
    
    // 跳过循环内部节点（它们由循环节点管理）
    if (node.loopNodeId) {
      return;
    }
    
    const nextNodeIds = node.nextNodeIds || [];
    if (nextNodeIds.length === 0) {
      errors.push({
        nodeId: node.id,
        nodeName: node.name,
        message: '节点没有连接到下一个节点',
        severity: 'warning',
      });
    }
  });
  
  // 检查从开始节点是否可达结束节点
  startNodes.forEach(startNode => {
    if (!canReachEnd(graph, startNode.id, endNodeIds)) {
      errors.push({
        nodeId: startNode.id,
        nodeName: startNode.name,
        message: '从开始节点无法到达结束节点',
        severity: 'error',
      });
    }
  });
  
  // 检查孤立节点（无法从开始节点到达的节点）
  const reachableFromStart = new Set<number>();
  
  function markReachable(nodeId: number) {
    if (reachableFromStart.has(nodeId)) return;
    reachableFromStart.add(nodeId);
    const neighbors = graph.get(nodeId) || [];
    neighbors.forEach(markReachable);
  }
  
  startNodes.forEach(startNode => markReachable(startNode.id));
  
  nodeList.forEach(node => {
    if (!reachableFromStart.has(node.id) && !node.loopNodeId) {
      errors.push({
        nodeId: node.id,
        nodeName: node.name,
        message: '节点无法从开始节点到达，可能是孤立节点',
        severity: 'warning',
      });
    }
  });
  
  return errors;
}

// ==================== 变量引用验证 ====================

/**
 * 验证输入参数的引用
 */
function validateInputArgsReferences(
  node: ChildNodeV2,
  availableOutputs: Map<number, InputAndOutConfigV2[]>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const inputArgs = node.nodeConfig.inputArgs || [];
  
  inputArgs.forEach((arg, index) => {
    if (arg.bindValueType === 'Reference' && arg.bindValue) {
      // 检查引用格式
      const parts = arg.bindValue.split('.');
      if (parts.length < 2) {
        errors.push({
          nodeId: node.id,
          nodeName: node.name,
          field: `inputArgs[${index}]`,
          message: `参数 "${arg.name}" 的引用格式不正确`,
          severity: 'error',
        });
        return;
      }
      
      const refNodeId = parseInt(parts[0], 10);
      const outputs = availableOutputs.get(refNodeId);
      
      if (!outputs) {
        errors.push({
          nodeId: node.id,
          nodeName: node.name,
          field: `inputArgs[${index}]`,
          message: `参数 "${arg.name}" 引用的节点不存在或不可达`,
          severity: 'error',
        });
      }
    }
  });
  
  return errors;
}

// ==================== 主验证函数 ====================

/**
 * 验证整个工作流
 */
export function validateWorkflow(data: WorkflowDataV2): WorkflowValidationResult {
  const allErrors: ValidationError[] = [];
  
  // 1. 验证每个节点的配置
  data.nodeList.forEach(node => {
    const nodeErrors = validateNodeConfig(node);
    allErrors.push(...nodeErrors);
  });
  
  // 2. 验证连线关系
  const connectionErrors = validateConnections(data);
  allErrors.push(...connectionErrors);
  
  // 分离错误和警告
  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证单个节点
 */
export function validateNode(node: ChildNodeV2): ValidationError[] {
  return validateNodeConfig(node);
}

/**
 * 将验证结果转换为 API 格式
 */
export function toAPIValidationResult(result: WorkflowValidationResult): ValidationResultV2[] {
  const allErrors = [...result.errors, ...result.warnings];
  
  // 按节点分组
  const grouped = new Map<number, string[]>();
  
  allErrors.forEach(error => {
    const messages = grouped.get(error.nodeId) || [];
    messages.push(error.message);
    grouped.set(error.nodeId, messages);
  });
  
  return Array.from(grouped.entries()).map(([nodeId, messages]) => ({
    nodeId,
    success: !result.errors.some(e => e.nodeId === nodeId),
    messages,
  }));
}

export default {
  validateWorkflow,
  validateNode,
  toAPIValidationResult,
};
