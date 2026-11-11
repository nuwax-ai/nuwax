import type { PlanEntry, ToolCallInfo } from '@/types/interfaces/appDev';

/**
 * 生成 Plan 标记（每次都插入新的，不检查重复）
 * <div><appdev-plan data="serialized JSON"></appdev-plan></div>
 */
export const insertPlanBlock = (
  markdownText: string,
  planData: { planId: string; entries: PlanEntry[] },
): string => {
  const data = JSON.stringify(planData);
  const block = `\n\n<div><appdev-plan data="${encodeURIComponent(
    data,
  )}"></appdev-plan></div>\n\n`;
  const result = `${markdownText}${block}`;
  return result;
};

/** 匹配 insertPlanBlock 生成的完整 plan 块（含 data 属性） */
const PLAN_BLOCK_PATTERN =
  /\n*<div><appdev-plan data="([^"]*)"><\/appdev-plan><\/div>\n*/g;

const decodePlanId = (encoded: string): string | null => {
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded));
    return typeof parsed?.planId === 'string' ? parsed.planId : null;
  } catch {
    return null;
  }
};

/**
 * ACP plan/plan_update 全量替换语义：同 planId 的旧块被替换为新块
 * （TodoWrite 会高频重发完整计划，不做替换会堆叠多张计划卡）
 */
export const upsertPlanBlock = (
  markdownText: string,
  planData: { planId: string; entries: PlanEntry[] },
): string => {
  const kept = markdownText.replace(PLAN_BLOCK_PATTERN, (match, encoded) =>
    decodePlanId(encoded) === planData.planId ? '' : match,
  );
  return insertPlanBlock(kept, planData);
};

/** ACP plan_removed：计划不再适用，移除全部计划块 */
export const removePlanBlocks = (markdownText: string): string =>
  markdownText.replace(PLAN_BLOCK_PATTERN, '');

const TOOL_CALL_BLOCK_PATTERN =
  /<div><appdev-toolcall toolcallid="([^"]*)" type="(?:tool_call|tool_call_update)" data="([^"]*)"><\/appdev-toolcall><\/div>/g;

export const hasToolCallBlock = (text: string, toolCallId: string): boolean =>
  Array.from(text.matchAll(TOOL_CALL_BLOCK_PATTERN)).some(
    (match) => match[1] === toolCallId,
  );

const upsertToolCallBlock = (
  text: string,
  toolCallId: string,
  update: Partial<ToolCallInfo>,
  type: 'tool_call' | 'tool_call_update',
): string => {
  if (!toolCallId) return text;
  const matches = Array.from(text.matchAll(TOOL_CALL_BLOCK_PATTERN)).filter(
    (match) => match[1] === toolCallId,
  );
  let data: Partial<ToolCallInfo> = { kind: 'execute', status: 'pending' };
  for (const match of matches) {
    try {
      data = { ...data, ...JSON.parse(decodeURIComponent(match[2])) };
    } catch {
      // 损坏的历史载荷不妨碍后续更新修复同一个工具块。
    }
  }
  // ACP 更新是部分字段：省略的标题、命令和输出必须沿用原调用。
  data = {
    ...data,
    ...Object.fromEntries(
      Object.entries(update).filter(([, value]) => value !== undefined),
    ),
    toolCallId,
  };
  const block = `<div><appdev-toolcall toolcallid="${toolCallId}" type="${type}" data="${encodeURIComponent(
    JSON.stringify(data),
  )}"></appdev-toolcall></div>`;
  if (!matches.length) return `${text}\n\n${block}\n\n`;

  let replaced = false;
  return text.replace(TOOL_CALL_BLOCK_PATTERN, (match, id) => {
    if (id !== toolCallId) return match;
    if (replaced) return '';
    replaced = true;
    return block;
  });
};

/**
 * 生成 Tool Call 标记（创建新的）
 * <div><appdev-toolcall toolcallid="xxx" type="tool_call" data="serialized JSON"></appdev-toolcall></div>
 */
export const insertToolCallBlock = (
  markdownText: string,
  toolCallId: string,
  toolCallData: ToolCallInfo,
): string => {
  return upsertToolCallBlock(
    markdownText,
    toolCallId,
    toolCallData,
    'tool_call',
  );
};

/**
 * 同 id 工具更新保留第一次出现的位置；缺失原调用时才追加。
 * <div><appdev-toolcall toolcallid="xxx" type="tool_call_update" data="serialized JSON"></appdev-toolcall></div>
 */
export const insertToolCallUpdateBlock = (
  markdownText: string,
  toolCallId: string,
  toolCallData: Partial<ToolCallInfo>,
): string => {
  return upsertToolCallBlock(
    markdownText,
    toolCallId,
    toolCallData,
    'tool_call_update',
  );
};
