/** 与 UserAppContainerStatusEnum.Running 对齐，避免本文件依赖 umi 请求层。 */
const CONTAINER_STATUS_RUNNING = 'running';
/** 与 UserAppReadinessStatusEnum.Ready 对齐。 */
const APP_STATUS_READY = 'ready';

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
 * 应用是否真正就绪：status 为 ready 且 ready 为 true。
 *
 * @param data 就绪探测结果
 * @returns 应用是否可访问
 */
export function isUserAppReady(
  data?: { ready?: boolean; status?: string } | null,
): boolean {
  return !!data && data.status === APP_STATUS_READY && data.ready === true;
}

/**
 * 当前环境是否可以轮询应用日志：容器 running 且应用 ready。
 * 开发 / 线上各自用自己的探测结果判断，互不影响。
 *
 * @param data 该环境的就绪探测结果
 * @returns 是否允许拉取该环境日志
 */
export function canPollUserAppLogs(
  data?: {
    ready?: boolean;
    status?: string;
    container?: { status?: string } | null;
  } | null,
): boolean {
  return isUserAppContainerRunning(data) && isUserAppReady(data);
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
