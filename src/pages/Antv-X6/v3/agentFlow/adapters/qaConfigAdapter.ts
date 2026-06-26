/**
 * HumanInteraction（询问用户）nodeConfig 适配
 *
 * 仅在 AgentFlow 场景对 HumanInteraction 节点生效：
 * - 加载：嵌套 askConfig / 旧 replyMode / 旧 formFields → 扁平 QA 字段（以 answerType 为权威）
 * - 保存：清理废弃字段（askConfig / replyMode / formFields），保证后端 QA 契约字段落库
 *
 * answerType（AnswerTypeEnum）为唯一权威字段，沿用 QA 节点约定并扩展：
 *   TEXT=文本回复 / SELECT=选项回复（分支端口）/ FORM=表单回复
 *
 * formArgs 元素直接复用 Arg（InputAndOutConfig）：
 *   - 控件类型写入 Arg.inputType（text/select/checkboxes/number/file/radio）
 *   - 单选/多选（select/radio/checkboxes）用 Arg.selectConfig（MANUAL + options）
 */

import {
  AnswerTypeEnum,
  DataTypeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { v4 as uuidv4 } from 'uuid';

const VALID_ANSWER_TYPES = new Set<string>([
  AnswerTypeEnum.TEXT,
  AnswerTypeEnum.SELECT,
  AnswerTypeEnum.FORM,
]);

/** 需要选项（selectConfig）的控件类型 */
const CHOICE_INPUT_TYPES = new Set<string>(['select', 'checkboxes', 'radio']);

/** 为迁移自旧 formFields 的 formArg 生成稳定唯一 key（与表单 add() 一致使用 uuid） */
function genFormArgKey(): string {
  return uuidv4();
}

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
 * 选项归一化为 `{ label, value }[]`（契约：label === value，同一文本）。
 * 兼容「换行字符串」/ `string[]` / `{label,value}[]`，裁剪空白/空行；
 * 丢弃 null/undefined/布尔等非法项（避免 String(null)→"null" 伪选项）。
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

/** 旧 `formFields[].type` → `inputType` */
function legacyTypeToInputType(type: any): string {
  switch (type) {
    case 'checkbox':
      return 'checkboxes';
    case 'input':
    case 'textarea':
      return 'text';
    case 'radio':
      return 'radio';
    case 'number':
      return 'number';
    case 'file':
      return 'file';
    default:
      return 'text';
  }
}

function isChoiceInputType(inputType: any): boolean {
  return typeof inputType === 'string' && CHOICE_INPUT_TYPES.has(inputType);
}

/** 旧 FormFieldConfig（label/type/required/options）→ Arg */
function migrateLegacyFormField(f: any): Record<string, any> {
  const inputType = legacyTypeToInputType(f?.type);
  const arg: Record<string, any> = {
    key: f?.key || f?.uuid || genFormArgKey(),
    name: f?.label || '',
    displayName: null,
    description: f?.description || '',
    dataType:
      inputType === 'number' ? DataTypeEnum.Integer : DataTypeEnum.String,
    originDataType: null,
    require: !!f?.required,
    enable: true,
    systemVariable: false,
    bindValueType: null,
    bindValue: null,
    inputType,
    selectConfig: null,
  };
  if (
    isChoiceInputType(inputType) &&
    f?.options !== null &&
    f?.options !== undefined
  ) {
    arg.selectConfig = {
      dataSourceType: 'MANUAL',
      options: toLabelValueOptions(f.options),
    };
  }
  return arg;
}

/** 选项 → 多行字符串（每行一个选项，用于表单文本框编辑；中文 IME / 回车换行友好） */
function optionsToMultiline(raw: unknown): string {
  return toLabelValueOptions(raw)
    .map((o) => o.label)
    .join('\n');
}

/**
 * 归一化单个 formArg：补全 inputType、按控件类型同步 dataType、单选/多选补 selectConfig。
 * @param mode 'edit'（默认，加载进表单：options 为多行字符串）/ 'save'（保存给后端：options 为 {label,value}[]）
 */
function processFormArg(
  a: any,
  mode: 'edit' | 'save' = 'edit',
): Record<string, any> {
  if (!a) return a;
  const fa: Record<string, any> = { ...a };
  if (!fa.inputType)
    fa.inputType = fa.type ? legacyTypeToInputType(fa.type) : 'text';
  // 控件类型决定数据类型：number→Integer，其余→String
  fa.dataType =
    fa.inputType === 'number' ? DataTypeEnum.Integer : DataTypeEnum.String;
  // 兼容旧字段名：label/required/type → name/require/inputType（仅在新字段缺失时迁移）
  if (
    (fa.name === null || fa.name === undefined) &&
    fa.label !== null &&
    fa.label !== undefined
  ) {
    fa.name = fa.label;
  }
  if (fa.require === undefined && fa.required !== undefined) {
    fa.require = !!fa.required;
  }
  if (isChoiceInputType(fa.inputType)) {
    const raw = fa.selectConfig?.options ?? fa.options;
    fa.selectConfig = {
      dataSourceType: 'MANUAL',
      options:
        mode === 'save' ? toLabelValueOptions(raw) : optionsToMultiline(raw),
    };
  } else {
    fa.selectConfig = null;
  }
  delete fa.options; // 旧字段不再保留
  delete fa.type; // 已迁移到 inputType
  delete fa.required; // 已迁移到 require
  delete fa.label; // 已迁移到 name
  return fa;
}

/** formArgs 归一化：兼容旧 formFields、统一结构 */
function normalizeFormArgs(
  formArgs: any,
  legacyFormFields: any,
): Record<string, any>[] {
  let args: any[];
  if (Array.isArray(formArgs) && formArgs.length) {
    args = formArgs;
  } else if (Array.isArray(legacyFormFields) && legacyFormFields.length) {
    args = legacyFormFields.map(migrateLegacyFormField);
  } else {
    return [];
  }
  return args.map((a) => processFormArg(a, 'edit'));
}

/**
 * 推断 answerType（权威字段）。优先级：
 * 1. nc.answerType 为合法值；
 * 2. 旧 replyMode 映射（兼容已提交数据）；
 * 3. 历史 askConfig.answerType；
 * 4. formArgs / 旧 formFields 非空 → FORM；
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
  if (nc.formArgs?.length || nc.formFields?.length) return AnswerTypeEnum.FORM;
  return AnswerTypeEnum.TEXT;
}

/** 是否处于选项分支模式（供端口/画布逻辑使用） */
export function isHitlOptionsBranchMode(
  nc: Record<string, any> | undefined | null,
): boolean {
  return getHitlAnswerType(nc) === AnswerTypeEnum.SELECT;
}

/**
 * 加载后：将历史嵌套结构 / 旧 replyMode / 旧 formFields 迁移为以 answerType 为权威的扁平字段
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
  nc.formArgs = normalizeFormArgs(nc.formArgs, nc.formFields);

  // 迁移完成后移除废弃字段，避免落库
  delete nc.askConfig;
  delete nc.replyMode;
  delete nc.formFields;

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

  // 表单字段：保存态（options 转为后端契约 {label,value}[]）
  if (Array.isArray(nc.formArgs) && nc.formArgs.length) {
    nc.formArgs = nc.formArgs.map((a) => processFormArg(a, 'save'));
  }

  delete nc.askConfig;
  delete nc.replyMode;
  delete nc.formFields;

  return nc;
}

/**
 * 保存前节点预处理（供 WorkflowSaveService / workflowProxyV3 共用）：
 * - HumanInteraction：扁平化 QA 字段（formArgs/selectConfig 等）
 * - 通用：剥离后端解析的完整 modelConfig（仅展示用，前端只回传顶层 modelId）
 * - 通用：节点配置只在 nodeConfig 内——剥掉 node 顶层与 nodeConfig 同名的重复字段
 *   （如 intentConfigs / inputArgs / modelId 等不再散落在 node 顶层）
 */
export function prepareNodeForBackendSerialize<
  T extends { type?: any; nodeConfig?: any },
>(node: T): T {
  if (!node.nodeConfig) return node;
  // 以原始 nodeConfig 的 key 集合判定哪些是「配置字段」，用于剥离 node 顶层重复；
  // modelConfig 任何情况下都不该出现在顶层（前端只回传 modelId），显式纳入剥离集合。
  const configKeys = new Set(Object.keys(node.nodeConfig));
  configKeys.add('modelConfig');
  // HumanInteraction：扁平化 QA 字段
  let nc = node.nodeConfig as Record<string, any>;
  if (node.type === NodeTypeEnum.HumanInteraction) {
    nc = serializeHitlNodeConfig(nc);
  }
  // 剥离完整 modelConfig（仅展示用，回传 modelId 即可）
  if (nc.modelConfig !== undefined) {
    const rest = { ...nc };
    delete rest.modelConfig;
    nc = rest;
  }
  // 重建 node：仅保留节点级字段（非配置）+ nodeConfig
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === 'nodeConfig') continue;
    if (configKeys.has(k)) continue; // 配置字段，已在 nodeConfig，顶层不再重复
    cleaned[k] = v;
  }
  cleaned.nodeConfig = nc;
  return cleaned as T;
}
