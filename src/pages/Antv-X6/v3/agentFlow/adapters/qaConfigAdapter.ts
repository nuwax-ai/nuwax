/**
 * HumanInteraction（询问用户）nodeConfig 适配
 *
 * 仅在 AgentFlow 场景对 HumanInteraction 节点生效：
 * - 加载：嵌套 askConfig / 旧 replyMode → 扁平 QA 字段（以 answerType 为权威）
 * - 保存：清理废弃字段（askConfig / replyMode），保证后端 QA 契约字段落库
 *
 * answerType（AnswerTypeEnum）为唯一权威字段，沿用 QA 节点约定并扩展：
 *   TEXT=文本回复 / SELECT=选项回复（分支端口）/ FORM=表单回复
 */

import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';

const VALID_ANSWER_TYPES = new Set<string>([
  AnswerTypeEnum.TEXT,
  AnswerTypeEnum.SELECT,
  AnswerTypeEnum.FORM,
]);

/** 旧 replyMode → answerType 映射（兼容已提交的旧数据） */
function replyModeToAnswerType(replyMode: any): AnswerTypeEnum | undefined {
  switch (replyMode) {
    case 'options':
      return AnswerTypeEnum.SELECT;
    case 'form':
      return AnswerTypeEnum.FORM;
    case 'text':
      return AnswerTypeEnum.TEXT;
    default:
      return undefined;
  }
}

/** 读取选项列表（扁平优先，兼容 askConfig） */
export function getHitlOptions(
  nc: Record<string, any> | undefined | null,
): any[] {
  if (!nc) return [];
  return nc.options?.length ? nc.options : nc.askConfig?.options || [];
}

/**
 * 表单字段 radio/checkbox 选项归一化为 string[]（后端契约）。
 * 兼容历史「换行分隔字符串」，并裁剪空白/空行。
 */
export function normalizeFormFieldOptions(options: unknown): string[] {
  const raw = Array.isArray(options)
    ? options
    : typeof options === 'string'
    ? options.split('\n')
    : [];
  return raw.map((s) => String(s).trim()).filter(Boolean);
}

/**
 * 推断 answerType（权威字段）。优先级：
 * 1. nc.answerType 为合法值；
 * 2. 旧 replyMode 映射（兼容已提交数据）；
 * 3. 历史 askConfig.answerType；
 * 4. formFields 非空 → FORM；
 * 5. 兜底 TEXT。
 */
function getHitlAnswerType(
  nc: Record<string, any> | undefined | null,
): AnswerTypeEnum {
  if (!nc) return AnswerTypeEnum.TEXT;
  if (VALID_ANSWER_TYPES.has(nc.answerType)) return nc.answerType;
  const fromReplyMode = replyModeToAnswerType(nc.replyMode);
  if (fromReplyMode) return fromReplyMode;
  if (nc.askConfig?.answerType) return nc.askConfig.answerType;
  if (nc.formFields?.length) return AnswerTypeEnum.FORM;
  return AnswerTypeEnum.TEXT;
}

/** 是否处于选项分支模式（供端口/画布逻辑使用） */
export function isHitlOptionsBranchMode(
  nc: Record<string, any> | undefined | null,
): boolean {
  return getHitlAnswerType(nc) === AnswerTypeEnum.SELECT;
}

/**
 * 加载后：将历史嵌套结构 / 旧 replyMode 迁移为以 answerType 为权威的扁平字段
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
    if (ac.options?.length && !nc.options?.length) {
      nc.options = ac.options;
    }
  }

  nc.answerType = getHitlAnswerType(nc);

  if (!nc.inputArgs) nc.inputArgs = [];
  if (!nc.options) nc.options = [];
  if (!nc.formFields) nc.formFields = [];

  // 表单字段选项归一化为数组（兼容历史换行字符串）
  if (Array.isArray(nc.formFields)) {
    nc.formFields = nc.formFields.map((f: any) =>
      f && f.options !== null && f.options !== undefined
        ? { ...f, options: normalizeFormFieldOptions(f.options) }
        : f,
    );
  }

  // 迁移完成后移除废弃字段，避免落库
  delete nc.askConfig;
  delete nc.replyMode;

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
  const answerType = getHitlAnswerType(nc);

  if (answerType === AnswerTypeEnum.SELECT) {
    nc.answerType = AnswerTypeEnum.SELECT;
    nc.options = getHitlOptions(nc);
  } else {
    // text / form：选项端口不再存在，清空其上的连线
    nc.answerType = answerType;
    nc.options =
      nc.options?.map((item: any) => ({ ...item, nextNodeIds: [] })) || [];
  }

  // 表单字段：radio/checkbox 选项归一化为后端契约 string[]；非选项类字段移除 options
  if (Array.isArray(nc.formFields) && nc.formFields.length) {
    nc.formFields = nc.formFields.map((f: any) => {
      if (!f) return f;
      if (f.type === 'radio' || f.type === 'checkbox') {
        return { ...f, options: normalizeFormFieldOptions(f.options) };
      }
      const rest = { ...f };
      delete rest.options;
      return rest;
    });
  }

  delete nc.askConfig;
  delete nc.replyMode;

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
