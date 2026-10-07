/**
 * AgentFlow 前端节点类型 ↔ 后端 NodeType 映射
 *
 * 后端 WorkflowNodeConfig.NodeType 枚举不含 RouteDecision / HumanInteraction，
 * 这两个 AgentFlow 节点复用后端已有类型收发——前端概念 = 后端类型 + 自己的扩展，
 * nodeConfig 原样透传，只在收发两端翻转 type 字段：
 *
 *   RouteDecision    ↔ IntentRecognition（路由决策 = 意图识别 + 路由扩展）
 *   HumanInteraction ↔ QA               （询问用户 = 问答节点的 HITL 化）
 *
 * 收发约定：
 * - 出参（新增节点 / 全量保存）：前端类型序列化为后端类型。
 * - 入参（getDetails 加载）：AgentFlow 场景下，后端类型统一渲染为前端类型
 *   （AgentFlow 调色板只有路由决策 / 询问用户，二者与意图识别 / 问答按 flow 互斥）；
 *   Workflow 场景下保持后端类型不变。
 *
 * 新增 / 复制的返回值不靠 flow 上下文，而是直接按「请求类型 / 源节点类型」还原。
 *
 * 相关节点：本迭代 AgentFlow 仅支持 工作流(Workflow) / 路由决策(RouteDecision) /
 * 智能体(Agent) / 询问用户(HumanInteraction:Ask)，其中 RouteDecision / HumanInteraction
 * 需要类型映射。
 */

import { NodeTypeEnum } from '@/types/enums/common';

/** 节点最小结构约束（兼容 ChildNode / AddNodeResponse 等） */
interface NodeLike {
  type?: NodeTypeEnum | string | undefined | null;
  name?: string | undefined | null;
  description?: string | undefined | null;
  nodeConfig?: Record<string, any> | undefined | null;
}

/** 前端类型 ↔ 后端类型的映射对 */
interface TypePair {
  frontend: NodeTypeEnum;
  backend: NodeTypeEnum;
}

const TYPE_PAIRS: TypePair[] = [
  {
    frontend: NodeTypeEnum.RouteDecision,
    backend: NodeTypeEnum.IntentRecognition,
  },
  { frontend: NodeTypeEnum.HumanInteraction, backend: NodeTypeEnum.QA },
];

/** 出参：前端类型 → 后端类型 */
const FRONTEND_TO_BACKEND = new Map<string, string>(
  TYPE_PAIRS.map((p) => [p.frontend, p.backend]),
);

/** 入参：后端类型 → 前端类型 */
const BACKEND_TO_FRONTEND = new Map<string, string>(
  TYPE_PAIRS.map((p) => [p.backend, p.frontend]),
);

/** 该前端类型是否需要映射到后端类型（RouteDecision / HumanInteraction） */
export function isFrontendMappedType(
  type: NodeTypeEnum | string | undefined | null,
): boolean {
  return (
    type !== null &&
    type !== undefined &&
    FRONTEND_TO_BACKEND.has(type as string)
  );
}

/**
 * 加载还原时可选项：把后端回写的默认文案（名/描述）修正为前端默认文案。
 * 按「后端类型」索引——同一后端类型在不同 flow 下还原目标不同，由调用方按场景填充。
 */
export interface MappingDefaults {
  /** 前端节点的默认名/描述 */
  frontendDefaultName: string;
  frontendDefaultDescription: string;
  /** 后端类型的默认名/描述（后端建节点时回写的文案） */
  backendDefaultName: string;
  backendDefaultDescription: string;
}

/** 入参还原默认文案修正项：按后端 NodeType 索引 */
export type NormalizeDefaultsOpts = Partial<Record<string, MappingDefaults>>;

/**
 * 出参：前端节点类型 → 后端节点类型。
 * RouteDecision → IntentRecognition、HumanInteraction → QA，其余原样返回。
 */
export function toBackendNodeType(
  type: NodeTypeEnum | string | undefined | null,
): string {
  if (type === null || type === undefined) return '';
  return FRONTEND_TO_BACKEND.get(type as string) ?? (type as string);
}

/**
 * 出参：序列化单个节点用于发送后端。
 * 仅改写 type（前端 → 后端），nodeConfig 原样保留。
 */
export function serializeNodeForBackend<T extends NodeLike>(node: T): T {
  const backendType =
    node?.type !== null && node?.type !== undefined
      ? FRONTEND_TO_BACKEND.get(node.type as string)
      : undefined;
  if (backendType) {
    return { ...node, type: backendType as T['type'] };
  }
  return node;
}

/**
 * 入参：加载时把后端节点还原为前端语义。
 * AgentFlow 下后端类型 → 前端类型；其余情况原样返回。
 *
 * @param node 后端返回的单个节点
 * @param isAgentFlow 当前是否为 AgentFlow 场景（决定是否把后端类型渲染为前端类型）
 * @param defaults 可选：按后端类型索引，把后端回写的默认文案修正为前端默认文案
 *                 （后端按后端类型建节点时会回写其后端默认文案）
 */
export function normalizeLoadedNode<T extends NodeLike>(
  node: T,
  isAgentFlow: boolean,
  defaults?: NormalizeDefaultsOpts,
): T {
  const frontendType =
    node?.type !== null && node?.type !== undefined
      ? BACKEND_TO_FRONTEND.get(node.type as string)
      : undefined;
  if (!isAgentFlow || !frontendType) {
    return node;
  }
  const converted: T = { ...node, type: frontendType as T['type'] };
  const d = defaults?.[node.type as string];
  if (d) {
    // 后端按后端类型建节点会回写其后端默认文案；只覆盖空值或默认值，保留用户自定义
    if (!node.name || node.name === d.backendDefaultName) {
      (converted as NodeLike).name = d.frontendDefaultName;
    }
    if (!node.description || node.description === d.backendDefaultDescription) {
      (converted as NodeLike).description = d.frontendDefaultDescription;
    }
  }
  return converted;
}

/** 入参：批量还原后端返回的节点列表。 */
export function normalizeLoadedNodes<T extends NodeLike>(
  nodes: T[] | undefined | null,
  isAgentFlow: boolean,
  defaults?: NormalizeDefaultsOpts,
): T[] {
  return (nodes ?? []).map((node) =>
    normalizeLoadedNode(node, isAgentFlow, defaults),
  );
}
