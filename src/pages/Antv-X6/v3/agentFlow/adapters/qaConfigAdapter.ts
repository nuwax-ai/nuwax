/**
 * HumanInteraction（询问用户）nodeConfig 适配
 *
 * 仅在 AgentFlow 场景对 HumanInteraction 节点生效：
 * - 加载：补全 formArgs 默认值、统一 selectConfig 编辑态结构
 * - 保存：清理废弃字段，序列化为后端 QA 契约
 *
 * answerType（HitlAnswerTypeEnum）为唯一权威字段：
 *   TEXT=文本回复 / SELECT=选项回复（分支端口）/ FORM=表单回复
 *
 * formArgs 元素直接复用 Arg（InputAndOutConfig）：
 *   - 控件类型写入 Arg.inputType（FormArgInputTypeEnum）
 *   - Select / Radio / MultipleSelect 使用 Arg.selectConfig（MANUAL + options）
 */

import { DataTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { FormArgInputTypeEnum } from '../enums/formArgInputType';
import { HitlAnswerTypeEnum } from '../enums/hitlAnswerType';

const VALID_ANSWER_TYPES = new Set<string>([
  HitlAnswerTypeEnum.TEXT,
  HitlAnswerTypeEnum.SELECT,
  HitlAnswerTypeEnum.FORM,
]);

const FORM_ARG_INPUT_TYPE_VALUES = new Set<string>(
  Object.values(FormArgInputTypeEnum),
);

/** 需要选项（selectConfig）的控件类型 */
export const FORM_ARG_CHOICE_INPUT_TYPES = new Set<string>([
  FormArgInputTypeEnum.Select,
  FormArgInputTypeEnum.MultipleSelect,
  FormArgInputTypeEnum.Radio,
]);

/**
 * 校验并收敛 inputType 为合法 FormArgInputTypeEnum，非法值兜底 Text
 */
export function coerceFormArgInputType(
  inputType: unknown,
): FormArgInputTypeEnum {
  if (
    typeof inputType === 'string' &&
    FORM_ARG_INPUT_TYPE_VALUES.has(inputType)
  ) {
    return inputType as FormArgInputTypeEnum;
  }
  return FormArgInputTypeEnum.Text;
}

/** 是否为需要配置选项的控件类型 */
export function isFormArgChoiceInputType(inputType: unknown): boolean {
  return FORM_ARG_CHOICE_INPUT_TYPES.has(coerceFormArgInputType(inputType));
}

/** 读取选项列表（扁平 options） */
export function getHitlOptions(
  nc: Record<string, any> | undefined | null,
): any[] {
  if (!nc) return [];
  return nc.options?.length ? nc.options : [];
}

/**
 * 选项归一化为 `{ label, value }[]`（契约：label === value，同一文本）。
 * 兼容「换行字符串」/ `string[]` / `{label,value}[]`，裁剪空白/空行。
 */
function toLabelValueOptions(
  raw: unknown,
): Array<{ label: string; value: string }> {
  let arr: any[];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') arr = raw.split('\n');
  else return [];
  return arr
    .map((item) => {
      let text = '';
      if (typeof item === 'string') {
        text = item.trim();
      } else if (typeof item === 'number' && Number.isFinite(item)) {
        text = String(item);
      } else if (item && typeof item === 'object') {
        text = String(item.label ?? item.value ?? '').trim();
      }
      return text ? { label: text, value: text } : null;
    })
    .filter((x): x is { label: string; value: string } => x !== null);
}

/** 选项 → 多行字符串（编辑态表单文本框） */
function optionsToMultiline(raw: unknown): string {
  return toLabelValueOptions(raw)
    .map((o) => o.label)
    .join('\n');
}

/**
 * 归一化单个 formArg：补全 inputType、按控件类型同步 dataType、选择类补 selectConfig。
 * @param mode 'edit'（options 为多行字符串）/ 'save'（options 为 {label,value}[]）
 */
function processFormArg(
  a: any,
  mode: 'edit' | 'save' = 'edit',
): Record<string, any> {
  if (!a) return a;
  const fa: Record<string, any> = { ...a };
  fa.inputType = coerceFormArgInputType(fa.inputType);
  fa.dataType =
    fa.inputType === FormArgInputTypeEnum.Number
      ? DataTypeEnum.Integer
      : DataTypeEnum.String;
  if (isFormArgChoiceInputType(fa.inputType)) {
    const raw = fa.selectConfig?.options;
    fa.selectConfig = {
      dataSourceType: 'MANUAL',
      options:
        mode === 'save' ? toLabelValueOptions(raw) : optionsToMultiline(raw),
    };
  } else {
    fa.selectConfig = null;
  }
  return fa;
}

/** formArgs 归一化 */
function normalizeFormArgs(formArgs: any): Record<string, any>[] {
  if (!Array.isArray(formArgs) || !formArgs.length) return [];
  return formArgs.map((a) => processFormArg(a, 'edit'));
}

/** 推断 answerType：合法 answerType → formArgs 非空为 FORM → 兜底 TEXT */
function getHitlAnswerType(
  nc: Record<string, any> | undefined | null,
): HitlAnswerTypeEnum {
  if (!nc) return HitlAnswerTypeEnum.TEXT;
  if (VALID_ANSWER_TYPES.has(nc.answerType)) return nc.answerType;
  if (nc.formArgs?.length) return HitlAnswerTypeEnum.FORM;
  return HitlAnswerTypeEnum.TEXT;
}

/** 是否处于选项分支模式（供端口/画布逻辑使用） */
export function isHitlOptionsBranchMode(
  nc: Record<string, any> | undefined | null,
): boolean {
  return getHitlAnswerType(nc) === HitlAnswerTypeEnum.SELECT;
}

/** 将历史 contextWriteKey 迁移到 outputArgs[0].name（与 QA 输出变量一致） */
function migrateContextWriteKeyToOutputArgs(
  nc: Record<string, any>,
): Record<string, any> {
  const contextWriteKey =
    typeof nc.contextWriteKey === 'string' ? nc.contextWriteKey.trim() : '';
  if (!contextWriteKey) {
    return nc;
  }
  const outputArgs = Array.isArray(nc.outputArgs) ? [...nc.outputArgs] : [];
  if (!outputArgs.length) {
    outputArgs.push({
      key: contextWriteKey,
      name: contextWriteKey,
      dataType: DataTypeEnum.String,
      require: true,
      systemVariable: true,
    });
  } else if (!outputArgs[0]?.name || outputArgs[0].name === 'answer') {
    outputArgs[0] = {
      ...outputArgs[0],
      key: contextWriteKey,
      name: contextWriteKey,
    };
  }
  const rest = { ...nc };
  delete rest.contextWriteKey;
  return { ...rest, outputArgs };
}

/** 加载后：补全 HumanInteraction QA 扁平字段默认值 */
export function normalizeHitlNodeConfig(
  nodeConfig: Record<string, any> | undefined | null,
): Record<string, any> {
  if (!nodeConfig) return {};
  let nc = { ...nodeConfig };

  nc = migrateContextWriteKeyToOutputArgs(nc);
  nc.answerType = getHitlAnswerType(nc);
  if (!nc.inputArgs) nc.inputArgs = [];
  if (!nc.options) nc.options = [];
  nc.formArgs = normalizeFormArgs(nc.formArgs);

  return nc;
}

/** 保存前：序列化为后端 QA 可接受的扁平 nodeConfig */
export function serializeHitlNodeConfig(
  nodeConfig: Record<string, any> | undefined | null,
): Record<string, any> {
  if (!nodeConfig) return {};
  const nc = { ...nodeConfig };
  const answerType = getHitlAnswerType(nc);

  if (answerType === HitlAnswerTypeEnum.SELECT) {
    nc.answerType = HitlAnswerTypeEnum.SELECT;
    nc.options = getHitlOptions(nc);
  } else {
    nc.answerType = answerType;
    nc.options =
      nc.options?.map((item: any) => ({ ...item, nextNodeIds: [] })) || [];
  }

  if (Array.isArray(nc.formArgs) && nc.formArgs.length) {
    nc.formArgs = nc.formArgs.map((a) => processFormArg(a, 'save'));
  }

  // 输出变量走 outputArgs（与 QA 一致），不再下发 contextWriteKey
  delete nc.contextWriteKey;

  return nc;
}

/**
 * 节点外壳字段：与 nodeConfig 内业务字段同名时仍保留在顶层（如 KnowledgeInsert 的 name/description
 * 在 nodeConfig 表示知识库绑定，顶层表示节点展示名，二者语义不同不可剥离）。
 */
const NODE_ENVELOPE_KEYS = new Set([
  'id',
  'name',
  'description',
  'workflowId',
  'type',
  'shape',
  'icon',
  'preNodes',
  'nextNodes',
  'nextNodeIds',
  'innerNodes',
  'innerStartNodeId',
  'innerEndNodeId',
  'unreachableNextNodeIds',
  'modified',
  'created',
  'loopNodeId',
  'typeId',
]);

/**
 * 保存前节点预处理（供 WorkflowSaveService / workflowProxyV3 共用）：
 * - HumanInteraction：扁平化 QA 字段（formArgs/selectConfig 等）
 * - 通用：剥离 modelConfig、节点顶层重复配置字段（外壳字段除外）
 */
export function prepareNodeForBackendSerialize<
  T extends { type?: any; nodeConfig?: any },
>(node: T): T {
  if (!node.nodeConfig) return node;
  const configKeys = new Set(Object.keys(node.nodeConfig));
  configKeys.add('modelConfig');

  let nc = node.nodeConfig as Record<string, any>;
  if (node.type === NodeTypeEnum.HumanInteraction) {
    nc = serializeHitlNodeConfig(nc);
  }
  if (
    node.type === NodeTypeEnum.RouteDecision &&
    Array.isArray(nc.intentConfigs)
  ) {
    nc = {
      ...nc,
      intentConfigs: nc.intentConfigs.map((branch: Record<string, any>) => ({
        ...branch,
        conditionType: branch?.conditionType === 'OR' ? 'OR' : 'AND',
      })),
    };
  }
  if (nc.modelConfig !== undefined) {
    const rest = { ...nc };
    delete rest.modelConfig;
    nc = rest;
  }
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === 'nodeConfig') continue;
    // 外壳字段始终保留在顶层；仅剥离误挂在顶层的 nodeConfig 业务字段
    if (configKeys.has(k) && !NODE_ENVELOPE_KEYS.has(k)) continue;
    cleaned[k] = v;
  }
  cleaned.nodeConfig = nc;
  return cleaned as T;
}
