import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { McpAskUserToolInput } from '../types/mcpAskIntervention';
import {
  INTERACTION_UI_SCHEMA_VERSION,
  MCP_ASK_SCHEMA_VERSION,
  MCP_ASK_WIDGET_TYPES,
} from '../types/mcpAskIntervention';
import { parseMcpAskToolInput } from './parseMcpAskToolInput';

const SKILL_ASK_LANGUAGE = 'nuwax-ask-question';
const CHOICE_WIDGETS = new Set([
  'radio',
  'checkboxes',
  'select',
  'list',
  'radio-with-custom',
]);

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && !!value.trim();

/** 显式的 skill 渲染协议不能采用 MCP 历史数据的宽松版本推断。 */
function parseSkillAsk(raw: unknown): McpAskUserToolInput | null {
  const input = record(raw);
  const ui = record(input?.ui);
  if (
    input?.toolName !== 'nuwax_ask_question' ||
    input.schemaVersion !== MCP_ASK_SCHEMA_VERSION ||
    !nonEmptyString(input.requestId) ||
    !nonEmptyString(input.title) ||
    !nonEmptyString(input.sessionId) ||
    !Number.isInteger(input.revision) ||
    Number(input.revision) < 1 ||
    ui?.version !== INTERACTION_UI_SCHEMA_VERSION ||
    !['inline', 'modal', 'wizard'].includes(String(ui.presentation)) ||
    !Array.isArray(ui.fields) ||
    !ui.fields.length
  ) {
    return null;
  }

  const names = new Set<string>();
  for (const rawField of ui.fields) {
    const field = record(rawField);
    if (
      !field ||
      !nonEmptyString(field.name) ||
      names.has(field.name) ||
      !nonEmptyString(field.title) ||
      !(MCP_ASK_WIDGET_TYPES as readonly unknown[]).includes(field.widget)
    ) {
      return null;
    }
    names.add(field.name);
    if (
      CHOICE_WIDGETS.has(String(field.widget)) &&
      (!Array.isArray(field.options) ||
        !field.options.length ||
        !field.options.every((option: unknown) => {
          const item = record(option);
          return nonEmptyString(item?.value) && nonEmptyString(item?.label);
        }))
    ) {
      return null;
    }
  }

  if (ui.steps !== undefined || ui.presentation === 'wizard') {
    if (
      !Array.isArray(ui.steps) ||
      !ui.steps.length ||
      !ui.steps.every((rawStep: unknown) => {
        const step = record(rawStep);
        return (
          nonEmptyString(step?.id) &&
          nonEmptyString(step?.title) &&
          Array.isArray(step?.fields) &&
          step.fields.length > 0 &&
          step.fields.every((name: unknown) =>
            typeof name === 'string' ? names.has(name) : false,
          )
        );
      })
    ) {
      return null;
    }
  }
  return parseMcpAskToolInput(input);
}

interface SkillAskText {
  text: string;
  inputs: McpAskUserToolInput[];
}

/** 扫描顶层闭合代码围栏，避免把文档示例中嵌套的协议块当成真实提问。 */
export function extractSkillAskQuestion(text: string): SkillAskText {
  if (!text.includes(SKILL_ASK_LANGUAGE)) return { text, inputs: [] };
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  let offset = 0;
  let open: { char: string; length: number; language: string; start: number; body: number } | undefined;
  let consumed = 0;
  let displayText = '';
  const inputs: McpAskUserToolInput[] = [];

  for (const line of lines) {
    const fence = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)\r?\n?$/.exec(line);
    if (fence) {
      if (!open) {
        open = {
          char: fence[1][0],
          length: fence[1].length,
          language: fence[2].trim(),
          start: offset,
          body: offset + line.length,
        };
      } else if (
        fence[1][0] === open.char &&
        fence[1].length >= open.length &&
        !fence[2].trim()
      ) {
        if (open.language === SKILL_ASK_LANGUAGE) {
          try {
            const input = parseSkillAsk(JSON.parse(text.slice(open.body, offset)));
            if (input) {
              inputs.push(input);
              displayText += text.slice(consumed, open.start);
              consumed = offset + line.length;
            }
          } catch {
            // 不完整或无效协议保留原文，不能挂载一个空表单。
          }
        }
        open = undefined;
      }
    }
    offset += line.length;
  }
  return { text: inputs.length ? displayText + text.slice(consumed) : text, inputs };
}

export interface SkillAskMessage {
  text: string;
  outputText?: string;
  inputs: McpAskUserToolInput[];
}

const cache = new WeakMap<MessageInfo, SkillAskMessage>();

export function readSkillAskQuestion(message: MessageInfo): SkillAskMessage {
  const cached = cache.get(message);
  if (cached) return cached;
  const unchanged = {
    text: message.text ?? '',
    outputText: message.finalResult?.outputText,
    inputs: [],
  };
  // skill 发问后停止本轮；等终态再开放提交，避免把正在生成的内容或思考拿来交互。
  if (
    message.role !== AssistantRoleEnum.ASSISTANT ||
    [MessageStatusEnum.Loading, MessageStatusEnum.Error, MessageStatusEnum.Stopped].includes(message.status)
  ) {
    return unchanged;
  }
  const body = extractSkillAskQuestion(unchanged.text);
  const final = extractSkillAskQuestion(unchanged.outputText ?? '');
  const result = {
    text: body.text,
    outputText: unchanged.outputText === undefined ? undefined : final.text,
    inputs: [...body.inputs, ...final.inputs],
  };
  cache.set(message, result);
  return result;
}
