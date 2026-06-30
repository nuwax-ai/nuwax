/**
 * 知识库写入（KnowledgeInsert）节点
 *
 * 后端 nodeConfig 契约（平铺字段）：
 * - knowledgeBaseId, name, description, icon
 */

import type { AddNodeResponse } from '@/services/workflow';
import { NodeTypeEnum } from '@/types/enums/common';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import type { NodeConfig } from '@/types/interfaces/node';
import { resolveNodeDescriptionWithNameFallback } from '../../agentFlow/resolveNodePresentation';

/** 属性面板 form 需保留的知识库绑定字段（与 nodeConfig 平铺字段一致） */
export const KNOWLEDGE_INSERT_BINDING_KEYS = [
  'knowledgeBaseId',
  'name',
  'description',
  'icon',
] as const;

export type KnowledgeInsertBinding = Pick<
  NodeConfig,
  'knowledgeBaseId' | 'name' | 'description' | 'icon'
>;

/** 从 nodeConfig 提取绑定字段（展示与 form 同步共用） */
export function pickKnowledgeInsertBinding(
  nodeConfig?: NodeConfig | null,
): KnowledgeInsertBinding | undefined {
  if (
    nodeConfig?.knowledgeBaseId === undefined ||
    nodeConfig?.knowledgeBaseId === null
  ) {
    return undefined;
  }
  return {
    knowledgeBaseId: nodeConfig.knowledgeBaseId,
    name: nodeConfig.name,
    description: nodeConfig.description,
    icon: nodeConfig.icon,
  };
}

/** 添加节点弹窗选中知识库后，构建平铺 nodeConfig */
export function buildKnowledgeInsertNodeConfigOnAdd(
  val: CreatedNodeItem,
): NodeConfig {
  const name = val.name;
  return {
    knowledgeBaseId: val.targetId,
    name,
    // 知识库未填描述时，绑定信息与节点展示均回退到知识库名称
    description: resolveNodeDescriptionWithNameFallback(name, val.description),
    icon: val.icon,
    extension: {},
  };
}

/** add 接口 nodeConfigDto */
export function pickKnowledgeInsertBindingForAddDto(
  nodeConfig?: NodeConfig,
): KnowledgeInsertBinding | undefined {
  return pickKnowledgeInsertBinding(nodeConfig);
}

/** @deprecated 使用 pickKnowledgeInsertBinding */
export const resolveKnowledgeInsertDisplayItem = pickKnowledgeInsertBinding;

function mergeKnowledgeInsertBinding(
  requested?: NodeConfig,
  fromApi?: NodeConfig,
): KnowledgeInsertBinding | undefined {
  const req = pickKnowledgeInsertBinding(requested);
  if (!req) {
    return undefined;
  }
  const api = pickKnowledgeInsertBinding(fromApi);
  const name = api?.name ?? req.name;
  return {
    knowledgeBaseId: api?.knowledgeBaseId ?? req.knowledgeBaseId,
    name,
    description: resolveNodeDescriptionWithNameFallback(
      name,
      api?.description ?? req.description,
    ),
    icon: api?.icon ?? req.icon,
  };
}

/** apiAddNodeV3 回显后合并 nodeConfig */
export function mergeNodeConfigAfterAddApi(
  requestedType: NodeTypeEnum | undefined,
  requestedNodeConfig: NodeConfig | undefined,
  apiNodeData: AddNodeResponse,
  extension: NodeConfig['extension'],
): NodeConfig {
  const apiNodeConfig = apiNodeData.nodeConfig ?? {};

  const merged: NodeConfig = {
    ...(requestedType === NodeTypeEnum.Agent ? requestedNodeConfig : {}),
    ...apiNodeConfig,
    extension,
  };

  if (
    requestedType === NodeTypeEnum.Agent &&
    requestedNodeConfig?.agentId !== undefined &&
    requestedNodeConfig?.agentId !== null
  ) {
    merged.agentId = apiNodeConfig.agentId ?? requestedNodeConfig.agentId;
  }

  if (requestedType === NodeTypeEnum.KnowledgeInsert) {
    const binding = mergeKnowledgeInsertBinding(
      requestedNodeConfig,
      apiNodeConfig,
    );
    if (binding) {
      Object.assign(merged, binding);
    }
  }

  return merged;
}
