/** 与 UserAppContainerStatusEnum.Running 对齐，避免本文件依赖 umi 请求层。 */
const CONTAINER_STATUS_RUNNING = 'running';

/**
 * 计算容器是否已在运行。
 * 旧回包没有 container 字段时不算就绪，避免误触发应用 restart。
 *
 * @param data 就绪探测结果；只要能读到 container.status 即可
 * @returns 容器 status 是否为 running
 */
export function isUserAppContainerRunning(
  data?: { container?: { status?: string } | null } | null,
): boolean {
  return data?.container?.status === CONTAINER_STATUS_RUNNING;
}

/**
 * 电脑重启后是否可以结束「等容器 running」。
 * 只有新一轮 readiness 探测结果才作数；定时 tick 会扫到重启前的 running 缓存，不能据此放行。
 *
 * @param source poll 表示本次是接口回包；tick 表示等待方定时巡检
 * @param data 当前保存的探测结果
 * @returns 是否可以视为容器已在运行
 */
export function shouldResolveContainerRunningWaiter(
  source: 'poll' | 'tick',
  data?: { container?: { status?: string } | null } | null,
): boolean {
  return source === 'poll' && isUserAppContainerRunning(data);
}
