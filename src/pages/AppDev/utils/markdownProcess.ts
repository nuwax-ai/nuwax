import type { PlanEntry, ToolCallInfo } from '@/types/interfaces/appDev';

/**
 * 生成 Plan 标记（每次都插入新的，不检查重复）
 * <div><appdev-plan data="序列化的JSON"></appdev-plan></div>
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

/**
 * 生成 Tool Call 标记（创建新的）
 * <div><appdev-toolcall toolcallid="xxx" type="tool_call" data="序列化的JSON"></appdev-toolcall></div>
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
 * <div><appdev-toolcall toolcallid="xxx" type="tool_call_update" data="序列化的JSON"></appdev-toolcall></div>
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
