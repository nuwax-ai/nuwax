/**
 * V3 工作流工具函数
 */

/**
 * 生成备用节点 ID
 * 规则：工作流 ID 前三位（不足补 0，超过截取）+ 时间戳
 * @param workflowId 工作流 ID
 */
export function generateFallbackNodeId(workflowId: number): number {
  const wfIdStr = String(workflowId);
  let prefix: string;
  if (wfIdStr.length < 3) {
    prefix = wfIdStr.padEnd(3, '0');
  } else {
    prefix = wfIdStr.substring(0, 3);
  }
  return Number(prefix + Date.now());
}
