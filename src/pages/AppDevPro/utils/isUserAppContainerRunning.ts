/** 与 UserAppContainerStatusEnum.Running 对齐，避免本文件依赖 umi 请求层。 */
const CONTAINER_STATUS_RUNNING = 'running';
/** 与 UserAppReadinessStatusEnum.Ready 对齐。 */
const APP_STATUS_READY = 'ready';
/** 与 UserAppReadinessStatusEnum.Starting 对齐。 */
const APP_STATUS_STARTING = 'starting';
/** 与 UserAppReadinessStatusEnum.NotDeployed 对齐。 */
const APP_STATUS_NOT_DEPLOYED = 'not_deployed';

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
 * 切到线上、且 readiness 里容器已是 running 之后，应用该怎么处理。
 * ready 直接预览；starting 继续等下一次探测；其余状态调用 start。
 */
export type ProdSwitchAppAction = 'preview' | 'wait' | 'start';

/**
 * 根据应用顶层状态决定切到线上后的下一步。
 * 运行中必须 status 为 ready 且 ready 为 true，和预览可访问的口径一致。
 *
 * @param status 顶层业务状态
 * @param ready 应用是否可访问
 * @returns preview 直接预览，wait 继续轮询，start 调用启动接口
 */
export function decideProdSwitchAppAction(
  status?: string | null,
  ready?: boolean | null,
): ProdSwitchAppAction {
  if (status === APP_STATUS_READY && ready === true) {
    return 'preview';
  }
  if (status === APP_STATUS_STARTING) {
    return 'wait';
  }
  return 'start';
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
 * 电脑重启后是否可以结束等待。
 * 只有新一轮 readiness 探测结果才作数；定时 tick 会扫到重启前的 running 缓存，不能据此放行。
 * 应用是 starting 还是 ready，由调用方拿到 running 之后再判断，这里不要求未部署。
 *
 * @param source poll 表示本次是接口回包；tick 表示等待方定时巡检
 * @param data 当前保存的探测结果
 * @param options.requireNotDeployed 为 true 时，顶层 status 也必须是 not_deployed
 * @returns 是否可以开始下一步重启应用
 */
export function shouldResolveContainerRunningWaiter(
  source: 'poll' | 'tick',
  data?: { status?: string; container?: { status?: string } | null } | null,
  options?: { requireNotDeployed?: boolean },
): boolean {
  if (source !== 'poll' || !isUserAppContainerRunning(data)) {
    return false;
  }
  if (options?.requireNotDeployed && data?.status !== APP_STATUS_NOT_DEPLOYED) {
    return false;
  }
  return true;
}
