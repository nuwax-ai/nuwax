import { useCallback, useRef } from 'react';

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
    captchaVerifyParam: any,
  ) => void | CaptchaConsumeControl | Promise<void | CaptchaConsumeControl>;
  /**
   * 当前验证码参数引用。
   */
  captchaParamRef: React.MutableRefObject<any>;
  /**
   * 验证码实例引用，用于调用 refresh。
   */
  captchaInstanceRef: React.MutableRefObject<any>;
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
}: UseCaptchaConsumeParams) => {
  const logPrefix = '[AliyunCaptcha][Consume]';

  /**
   * 统一输出调试日志，仅在非生产环境打印。
   */
  const log = (message: string, extra?: Record<string, unknown>) => {
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
   * 业务消费回调：在验证码校验成功后由 SDK 触发。
   */
  const onBizResultCallback = useCallback(() => {
    if (!captchaParamRef.current) {
      console.warn(
        '[AliyunCaptcha] Blocked double usage: Token already consumed or invalid.',
      );
      log('blocked-empty-token');
      return;
    }

    if (isConsumingRef.current) {
      console.warn(
        '[AliyunCaptcha] Token is being consumed, skip duplicate call.',
      );
      log('blocked-consuming-token');
      return;
    }

    isConsumingRef.current = true;
    const currentCaptchaParam = captchaParamRef.current;
    let shouldRefresh = true;
    let skipReason = '';
    const consumeId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const consumeStartTime = Date.now();
    log('consume-start', {
      consumeId,
      hasCaptchaInstance: !!captchaInstanceRef.current,
    });

    // 关键：
    // 1. 使用 Promise.resolve().then(...) 包装，确保 doAction 同步抛错时也会进入 finally；
    // 2. 请求生命周期结束后再刷新，避免提前刷新导致后端校验失败。
    Promise.resolve()
      .then(() => doAction(currentCaptchaParam))
      .then((actionResult) => {
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
        // 业务 action 失败时允许刷新验证码，以便用户可以重试。
        // cleanup 在 .finally() 中先于 refresh() 执行，因此下一次
        // onBizResultCallback 不会被 isConsumingRef 阻挡，避免死循环。
        console.error('[AliyunCaptcha] Token consume failed:', error);
        log('consume-action-rejected', {
          consumeId,
          durationMs: Date.now() - consumeStartTime,
          errorMessage:
            error instanceof Error
              ? error.message
              : error
              ? String(error)
              : 'Unknown error',
        });
      })
      .finally(() => {
        const durationMs = Date.now() - consumeStartTime;
        log('consume-finally', { consumeId, durationMs, shouldRefresh });

        // 先清理状态，再刷新实例，确保下一次 onBizResultCallback
        // 不会因 isConsumingRef 仍为 true 而被阻塞。
        captchaParamRef.current = null;
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

        log('consume-cleanup-done', { consumeId });
      });
  }, [captchaInstanceRef, captchaParamRef, doAction]);

  return {
    onBizResultCallback,
  };
};

export default useCaptchaConsume;
