/**
 * 节点 ID 生成工具
 *
 * 当添加节点接口失败时，前端自己生成 node.id
 * 规则：工作流id(前三位不够后面补0，超过三位直接截取) + 时间戳
 *
 * 示例：
 * - workflowId = 1128 -> "112" + timestamp -> 1121234567890
 * - workflowId = 12345 -> "123" + timestamp -> 1231234567890
 * - workflowId = 12 -> "012" + timestamp -> 0121234567890
 */

/**
 * 生成节点 ID
 * @param workflowId 工作流 ID
 * @returns 生成的节点 ID
 */
export function generateNodeId(workflowId: number): number {
  // 将工作流 ID 转换为字符串
  const workflowIdStr = workflowId.toString();

  // 获取前三位
  let prefix: string;
  if (workflowIdStr.length >= 3) {
    // 超过或等于三位，直接截取前三位
    prefix = workflowIdStr.substring(0, 3);
  } else {
    // 不够三位，后面补0
    prefix = workflowIdStr.padEnd(3, '0');
  }

  // 获取当前时间戳（毫秒）
  const timestamp = Date.now();

  // 拼接：前缀 + 时间戳
  const nodeIdStr = prefix + timestamp;

  // 转换为数字
  return parseInt(nodeIdStr, 10);
}
