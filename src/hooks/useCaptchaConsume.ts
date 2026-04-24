import { useCallback, useRef } from 'react';

export interface CaptchaTokenSnapshot {
  token: string;
  version: number;
  createdAt: number;
}

export interface CaptchaConsumeControl {
  /**
   * 为 true 时，跳过本次自动 refresh。
   * 用于“验证码参数要跨页面再消费”的场景，避免提前失效。
   */
  skipRefresh?: boolean;
}

interface UseCaptchaConsumeParams {
  /**
   * 验证码业务消费函数：
   * - 例如调用登录接口、发送验证码接口等；
   * - 支持同步或异步返回。
   */
  doAction: (
    captchaVerifyParam: string,
  ) => void | CaptchaConsumeControl | Promise<void | CaptchaConsumeControl>;
  /**
   * 当前验证码参数引用。
   */
  captchaParamRef: React.MutableRefObject<CaptchaTokenSnapshot | null>;
  /**
   * 验证码实例引用，用于调用 refresh。
   */
  captchaInstanceRef: React.MutableRefObject<any>;
  /**
   * 业务 action 失败时是否自动刷新验证码实例。
   * - true：保持现有行为，失败后立即 refresh，便于快速重试；
   * - false：失败后不自动 refresh，避免同一登录流程额外触发一次验证码请求。
   */
  refreshOnError?: boolean;
}

/**
 * 验证码消费流程 Hook
 *
 * 目标：
 * 1. 将“消费 token + 接口结束后刷新”的流程从组件中抽离；
 * 2. 统一防重保护，避免同一 token 被重复消费；
 * 3. 降低业务页面和组件的改动面，减少侵入性。
 */
const useCaptchaConsume = ({
  doAction,
  captchaParamRef,
  captchaInstanceRef,
  refreshOnError = true,
}: UseCaptchaConsumeParams) => {
  const getLoginFlowId = (): string =>
    (typeof window !== 'undefined' && (window as any).__loginFlowId) ||
    'unknown';
  const enableCaptchaDebugLog = process.env.NODE_ENV !== 'production';
  const logPrefix = '[AliyunCaptcha][Consume]';

  /**
   * 统一输出调试日志，仅在非生产环境打印。
   */
  const log = (message: string, extra?: Record<string, unknown>) => {
    if (!enableCaptchaDebugLog) {
      return;
    }
    if (extra) {
      console.info(logPrefix, message, extra);
      return;
    }
    console.info(logPrefix, message);
  };

  /**
   * 标记当前 token 是否正在被消费中。
   * 防止连续触发 onBizResultCallback 造成重复请求。
   */
  const isConsumingRef = useRef<boolean>(false);
  /**
   * 消费过程中如果又触发了 onBiz 回调，则标记“有排队任务”。
   * 注意：是否继续消费最新 token 不再依赖该标记，
   * 只要检测到 token 版本已变化就会衔接下一轮消费（latest-wins）。
   */
  const hasQueuedConsumeRef = useRef<boolean>(false);
  const consumingVersionRef = useRef<number | null>(null);
  const getTokenFingerprint = (token: string): string => {
    let hash = 0;
    for (let i = 0; i < token.length; i += 1) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    return `${token.length}-${hash.toString(16)}`;
  };
  const getTokenCertifyId = (token: string): string | null => {
    if (!token) return null;
    try {
      const parsed = JSON.parse(token);
      if (parsed && typeof parsed === 'object') {
        return parsed.CertifyId || parsed.certifyId || null;
      }
    } catch {
      return null;
    }
    return null;
  };

  /**
   * 业务消费回调：在验证码校验成功后由 SDK 触发。
   */
  const onBizResultCallback = useCallback(
    (bizParam?: any) => {
      console.info('[CaptchaKey][onbiz-param-seen]', {
        flowId: getLoginFlowId(),
        paramType: typeof bizParam,
        hasCaptchaVerifyParam:
          !!bizParam &&
          typeof bizParam === 'object' &&
          'captchaVerifyParam' in bizParam,
        hasCertifyId:
          !!bizParam &&
          typeof bizParam === 'object' &&
          ('CertifyId' in bizParam || 'certifyId' in bizParam),
      });
      const snapshot = captchaParamRef.current;
      if (!snapshot?.token) {
        console.warn(
          '[AliyunCaptcha] Blocked double usage: Token already consumed or invalid.',
        );
        log('blocked-empty-token');
        return;
      }

      if (isConsumingRef.current) {
        console.warn(
          '[AliyunCaptcha] Token is being consumed, queue latest consume.',
        );
        hasQueuedConsumeRef.current = true;
        // 关键日志：消费进行中再次触发，确认“新 token 已排队”而不是被丢弃
        console.info('[CaptchaKey][consume-queued]', {
          flowId: getLoginFlowId(),
          queuedVersion: snapshot.version,
          consumingVersion: consumingVersionRef.current,
        });
        log('queued-consuming-token', {
          currentVersion: snapshot.version,
          consumingVersion: consumingVersionRef.current,
        });
        return;
      }

      isConsumingRef.current = true;
      const consumeSnapshot = snapshot;
      let consumedVersion = consumeSnapshot.version;
      consumingVersionRef.current = consumedVersion;
      let shouldRefresh = true;
      let skipReason = '';
      const consumeId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const consumeStartTime = Date.now();
      // 关键日志：每次消费入口
      console.info('[CaptchaKey][consume-start]', {
        flowId: getLoginFlowId(),
        consumeId,
        enterVersion: consumeSnapshot.version,
        latestVersion: captchaParamRef.current?.version,
      });
      // [使用] onBizResultCallback 触发，开始消费 token
      log('consume-start', {
        consumeId,
        hasCaptchaInstance: !!captchaInstanceRef.current,
        tokenVersion: consumeSnapshot.version,
        tokenLen: consumeSnapshot.token.length,
        refreshOnError,
      });

      // 关键：
      // 1) 始终消费“调度时最新 token”，避免读取过旧快照；
      // 2) 若消费过程中又来了 onBiz 回调，结束后排队消费最新 token（latest-wins）；
      // 3) 请求生命周期结束后再刷新，避免提前刷新导致后端校验失败。
      Promise.resolve()
        .then(() => {
          const latestAtDispatch = captchaParamRef.current || consumeSnapshot;
          consumedVersion = latestAtDispatch.version;
          consumingVersionRef.current = consumedVersion;
          // 关键日志：真正发请求前消费的是哪个版本
          console.info('[CaptchaKey][consume-dispatch]', {
            flowId: getLoginFlowId(),
            consumeId,
            dispatchVersion: consumedVersion,
            tokenLen: latestAtDispatch.token?.length ?? 0,
            tokenFp: getTokenFingerprint(latestAtDispatch.token || ''),
            certifyId: getTokenCertifyId(latestAtDispatch.token || ''),
          });
          return doAction(latestAtDispatch.token);
        })
        .then((actionResult) => {
          // [登录成功] doAction resolved
          log('consume-action-resolved', {
            consumeId,
            durationMs: Date.now() - consumeStartTime,
            skipRefresh: !!(actionResult as any)?.skipRefresh,
          });
          if (
            actionResult &&
            typeof actionResult === 'object' &&
            'skipRefresh' in actionResult &&
            actionResult.skipRefresh
          ) {
            shouldRefresh = false;
            skipReason = 'action returned skipRefresh=true';
          }
        })
        .catch((error) => {
          // [登录失败] doAction rejected
          // 业务 action 失败时是否刷新由 refreshOnError 控制：
          // 1) 默认 true，保持历史行为；
          // 2) 登录场景可设置为 false，避免同一流程”多打一轮验证码请求”。
          if (!refreshOnError) {
            shouldRefresh = false;
            skipReason = 'action rejected and refreshOnError=false';
          }
          log('consume-action-rejected', {
            consumeId,
            flowId: error?._flowId, // 与 [Chain] 日志关联
            tokenVersion: consumedVersion,
            latestTokenVersion: captchaParamRef.current?.version,
            durationMs: Date.now() - consumeStartTime,
            refreshOnError,
            willRefresh: shouldRefresh,
            // 完整错误上下文
            errorName: error?.name,
            errorInfo: error?.info ?? null, // { code, displayCode, message, tid, debugInfo }
            errorMessage:
              error?.info?.message ||
              (error instanceof Error
                ? error.message
                : error
                ? String(error)
                : 'Unknown error'),
          });
        })
        .finally(() => {
          const durationMs = Date.now() - consumeStartTime;
          log('consume-finally', { consumeId, durationMs, shouldRefresh });

          const queuedSnapshot = captchaParamRef.current;
          const wasExplicitlyQueued = hasQueuedConsumeRef.current;
          const hasNewerToken = !!(
            queuedSnapshot?.token && queuedSnapshot.version !== consumedVersion
          );
          // 核心：不再强依赖“第二次 onBiz 回调”才能触发下一轮消费。
          // 只要检测到更新版本 token，就自动衔接消费最新值，避免漏消费。
          const shouldDrainQueuedLatest = hasNewerToken;
          hasQueuedConsumeRef.current = false;

          // 有更新版本排队时，直接衔接下一轮消费，不在此处 refresh/cleanup 新 token。
          if (shouldDrainQueuedLatest) {
            // 关键日志：确认当前轮结束后切到“排队中的最新 token”
            console.info('[CaptchaKey][consume-drain-queued-latest]', {
              flowId: getLoginFlowId(),
              consumeId,
              finishedVersion: consumedVersion,
              nextVersion: queuedSnapshot?.version,
              wasExplicitlyQueued,
            });
            log('consume-drain-queued-latest', {
              consumeId,
              finishedVersion: consumedVersion,
              nextVersion: queuedSnapshot?.version,
            });
            isConsumingRef.current = false;
            consumingVersionRef.current = null;
            window.setTimeout(() => {
              onBizResultCallback();
            }, 0);
            return;
          }

          // 先清理状态，再刷新实例，确保下一次 onBizResultCallback
          // 不会因 isConsumingRef 仍为 true 而被阻塞。
          if (captchaParamRef.current?.version === consumedVersion) {
            captchaParamRef.current = null;
          }
          isConsumingRef.current = false;

          if (
            shouldRefresh &&
            captchaInstanceRef.current &&
            typeof captchaInstanceRef.current.refresh === 'function'
          ) {
            captchaInstanceRef.current.refresh();
            log('consume-refresh-done', { consumeId });
          } else if (!shouldRefresh) {
            log('consume-skip-refresh', { consumeId, reason: skipReason });
          }

          consumingVersionRef.current = null;
          // 关键日志：本轮消费闭环完成
          console.info('[CaptchaKey][consume-end]', {
            flowId: getLoginFlowId(),
            consumeId,
            consumedVersion,
            shouldRefresh,
            latestVersion: captchaParamRef.current?.version,
          });
          log('consume-cleanup-done', { consumeId });
        });
    },
    [
      captchaInstanceRef,
      captchaParamRef,
      doAction,
      refreshOnError,
      enableCaptchaDebugLog,
    ],
  );

  return {
    onBizResultCallback,
  };
};

export default useCaptchaConsume;
