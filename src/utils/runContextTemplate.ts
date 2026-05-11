/**
 * RunContext 模板渲染器
 *
 * 支持在节点 prompt / payload / 字段值中用占位符引用 RunContext 内容：
 *
 *   {{context.userQuery}}                    → ctx.variables.userQuery
 *   {{node.<nodeId>.output}}                 → ctx.nodeOutputs[nodeId].text 或 .structured
 *   {{node.<nodeId>.output.json.title}}      → ctx.nodeOutputs[nodeId].structured.json.title
 *   {{evalFeedback.appendPrompt}}            → ctx.evalFeedback[currentNodeId]?.appendPrompt
 *   {{human.<nodeId>.content}}               → ctx.humanSignals[nodeId].content
 *   {{runId}}                                → ctx.runId
 *
 * 解析未命中时：返回空串 + 收集 warn（调用方可发 SSE `context_updated`）。
 *
 * 注意：该工具是 **纯函数**，无副作用。供 LLM/Agent/Connector 节点在序列化 prompt 时调用，
 * 也供前端预览模板渲染效果。
 */

import { RunContext } from '@/types/interfaces/runContext';

const PLACEHOLDER_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

export interface RenderTemplateOptions {
  // 当前节点 id（用于解析 evalFeedback 这种 “相对当前节点” 的占位符）
  currentNodeId?: string;
  // 是否把数组/对象自动 JSON.stringify
  stringifyObjects?: boolean;
}

export interface RenderTemplateResult {
  text: string;
  warnings: string[]; // 未命中或类型不匹配的占位符
}

/**
 * 渲染单个模板字符串。
 */
export function renderTemplate(
  template: string,
  ctx: RunContext,
  options: RenderTemplateOptions = {},
): RenderTemplateResult {
  const warnings: string[] = [];
  const { currentNodeId, stringifyObjects = true } = options;

  const text = template.replace(PLACEHOLDER_RE, (_, expr: string) => {
    const value = resolveExpr(expr, ctx, currentNodeId);
    if (value === undefined) {
      warnings.push(expr);
      return '';
    }
    if (value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return stringifyObjects ? safeStringify(value) : '';
  });

  return { text, warnings };
}

/**
 * 仅检查模板是否有未命中的引用，便于编辑器侧实时校验。
 */
export function findMissingReferences(
  template: string,
  ctx: RunContext,
  currentNodeId?: string,
): string[] {
  const out: string[] = [];
  template.replace(PLACEHOLDER_RE, (_, expr: string) => {
    if (resolveExpr(expr, ctx, currentNodeId) === undefined) {
      out.push(expr);
    }
    return '';
  });
  return out;
}

// ---- 内部 ----

function resolveExpr(
  expr: string,
  ctx: RunContext,
  currentNodeId?: string,
): unknown {
  // 顶层特殊键
  if (expr === 'runId') return ctx.runId;
  if (expr === 'flowId') return ctx.flowId;
  if (expr === 'flowKind') return ctx.flowKind;

  const segments = expr.split('.').filter(Boolean);
  if (segments.length === 0) return undefined;

  const [head, ...rest] = segments;
  switch (head) {
    case 'context':
      return getPath(ctx.variables, rest);
    case 'node': {
      // node.<id>.<...>
      const [id, ...tail] = rest;
      if (!id) return undefined;
      const output = ctx.nodeOutputs[id];
      if (!output) return undefined;
      if (tail.length === 0) return output;
      // {{node.x.output}} 视为读取 text；如要结构化字段用 output.json.title
      if (tail[0] === 'output' && tail.length === 1) {
        return output.text !== undefined ? output.text : output.structured;
      }
      return getPath(output, tail);
    }
    case 'evalFeedback': {
      if (!currentNodeId) return undefined;
      const fb = ctx.evalFeedback[currentNodeId];
      if (!fb) return undefined;
      return rest.length === 0 ? fb : getPath(fb, rest);
    }
    case 'human': {
      const [id, ...tail] = rest;
      if (!id) return undefined;
      const sig = ctx.humanSignals[id];
      if (!sig) return undefined;
      return tail.length === 0 ? sig : getPath(sig, tail);
    }
    default:
      // 裸 key 回退：先在 variables，再在最近节点 output 上找
      if (ctx.variables[head] !== undefined) {
        return getPath(ctx.variables[head], rest);
      }
      // 取 nodeOutputs 中 cursor 指向节点的字段（如果有）
      if (ctx.cursor && ctx.nodeOutputs[ctx.cursor]) {
        return getPath(ctx.nodeOutputs[ctx.cursor], segments);
      }
      return undefined;
  }
}

function getPath(root: unknown, path: string[]): unknown {
  let cur: unknown = root;
  for (const seg of path) {
    if (cur == null) return undefined;
    // 支持 a.b[0].c
    const match = seg.match(/^([^[]+)((?:\[\d+])*)$/);
    if (!match) {
      cur = (cur as Record<string, unknown>)[seg];
      continue;
    }
    const key = match[1];
    const indices = match[2].match(/\d+/g) || [];
    cur = (cur as Record<string, unknown>)[key];
    for (const idx of indices) {
      if (Array.isArray(cur)) {
        cur = cur[Number(idx)];
      } else {
        return undefined;
      }
    }
  }
  return cur;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}
