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

/**
 * 生成 Tool Call 标记（创建新的）
 * <div><appdev-toolcall toolcallid="xxx" type="tool_call" data="serialized JSON"></appdev-toolcall></div>
 */
export const insertToolCallBlock = (
  markdownText: string,
  toolCallId: string,
  toolCallData: ToolCallInfo,
): string => {
  const data = JSON.stringify(toolCallData);
  const block = `\n\n<div><appdev-toolcall toolcallid="${toolCallId}" type="tool_call" data="${encodeURIComponent(
    data,
  )}"></appdev-toolcall></div>\n\n`;
  const result = `${markdownText}${block}`;
  return result;
};

/**
 * 生成 Tool Call Update 标记（创建新的）
 * <div><appdev-toolcall toolcallid="xxx" type="tool_call_update" data="serialized JSON"></appdev-toolcall></div>
 */
export const insertToolCallUpdateBlock = (
  markdownText: string,
  toolCallId: string,
  toolCallData: ToolCallInfo,
): string => {
  const data = JSON.stringify(toolCallData);
  const block = `\n\n<div><appdev-toolcall toolcallid="${toolCallId}" type="tool_call_update" data="${encodeURIComponent(
    data,
  )}"></appdev-toolcall></div>\n\n`;
  const result = `${markdownText}${block}`;
  return result;
};
