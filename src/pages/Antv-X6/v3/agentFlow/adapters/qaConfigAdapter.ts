/**
 * HumanInteraction（询问用户）nodeConfig 适配
 *
 * 仅在 AgentFlow 场景对 HumanInteraction 节点生效：
 * - 加载：嵌套 askConfig → 扁平 QA 字段（兼容历史数据）
 * - 保存：清理废弃字段，保证后端 QA 契约字段落库
 */

import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';

export type HitlReplyMode = 'text' | 'options' | 'form';

/** 读取选项列表（扁平优先，兼容 askConfig） */
export function getHitlOptions(
  nc: Record<string, any> | undefined | null,
): any[] {
  if (!nc) return [];
  return nc.options?.length ? nc.options : nc.askConfig?.options || [];
}

/** 推断回复模式 */
export function getHitlReplyMode(
  nc: Record<string, any> | undefined | null,
): HitlReplyMode {
  if (!nc) return 'text';
  // 显式 replyMode 优先（属性面板单选写入）：避免从 form 切到 options 后
  // 残留的 formFields 把节点误判为 form，导致选项端口/连线丢失。
  if (nc.replyMode === 'form') return 'form';
  if (nc.replyMode === 'options') return 'options';
  if (nc.replyMode === 'text') return 'text';
  // replyMode 缺失时按数据特征推断（兼容历史 askConfig / 未归一化数据）
  if (nc.formFields?.length) return 'form';
  if (
    nc.answerType === AnswerTypeEnum.SELECT ||
    nc.askConfig?.answerType === AnswerTypeEnum.SELECT
  ) {
    return 'options';
  }
  return 'text';
}

/** 是否处于选项分支模式（供端口/画布逻辑使用） */
export function isHitlOptionsBranchMode(
  nc: Record<string, any> | undefined | null,
): boolean {
  return getHitlReplyMode(nc) === 'options';
}

/**
 * 加载后：将历史嵌套结构迁移为扁平 QA 字段，供 AgentFlow 面板绑定
 */
export function normalizeHitlNodeConfig(
  nodeConfig: Record<string, any> | undefined | null,
): Record<string, any> {
  if (!nodeConfig) return {};
  const nc = { ...nodeConfig };

  if (nc.askConfig) {
    const ac = nc.askConfig;
    if (
      ac.question !== null &&
      ac.question !== undefined &&
      (nc.question === null || nc.question === undefined)
    ) {
      nc.question = ac.question;
    }
    if (
      ac.answerType !== null &&
      ac.answerType !== undefined &&
      (nc.answerType === null || nc.answerType === undefined)
    ) {
      nc.answerType = ac.answerType;
    }
    if (ac.options?.length && !nc.options?.length) {
      nc.options = ac.options;
    }
  }

  const replyMode = getHitlReplyMode(nc);
  nc.replyMode = replyMode;

  if (replyMode === 'options') {
    nc.answerType = AnswerTypeEnum.SELECT;
  } else if (!nc.answerType) {
    nc.answerType = AnswerTypeEnum.TEXT;
  }

  if (!nc.inputArgs) nc.inputArgs = [];
  if (!nc.options) nc.options = [];
  if (!nc.formFields) nc.formFields = [];

  return nc;
}

/**
 * 保存前：序列化为后端 QA 可接受的扁平 nodeConfig
 */
export function serializeHitlNodeConfig(
  nodeConfig: Record<string, any> | undefined | null,
): Record<string, any> {
  if (!nodeConfig) return {};
  const nc = { ...nodeConfig };
  const replyMode = getHitlReplyMode(nc);

  if (replyMode === 'options') {
    nc.answerType = AnswerTypeEnum.SELECT;
    nc.options = getHitlOptions(nc);
  } else {
    // text / form：选项端口不再存在，清空其上的连线
    nc.answerType = AnswerTypeEnum.TEXT;
    nc.options =
      nc.options?.map((item: any) => ({ ...item, nextNodeIds: [] })) || [];
  }

  nc.replyMode = replyMode;

  delete nc.askConfig;

  return nc;
}

/**
 * 保存前节点预处理：HumanInteraction 节点先扁平化 nodeConfig，其余原样返回。
 * 供 WorkflowSaveService / workflowProxyV3 共用，避免两处重复包裹
 * serializeHitlNodeConfig 造成实现漂移。
 */
export function prepareNodeForBackendSerialize<
  T extends { type?: any; nodeConfig?: any },
>(node: T): T {
  if (node.type === NodeTypeEnum.HumanInteraction && node.nodeConfig) {
    return {
      ...node,
      nodeConfig: serializeHitlNodeConfig(
        node.nodeConfig as Record<string, any>,
      ),
    };
  }
  return node;
}
