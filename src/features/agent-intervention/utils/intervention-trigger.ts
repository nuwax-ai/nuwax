/** 开发/运行时干预触发序号，保证同毫秒内的排序稳定 */
let triggerSequence = 0;

/**
 * 生成交互触发时间戳（单调递增，用于固定栏从上到下排序）
 */
export function createInterventionTriggeredAt(): number {
  triggerSequence += 1;
  return Date.now() + triggerSequence;
}
