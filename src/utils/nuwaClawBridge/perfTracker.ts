type PerfPayload = Record<string, unknown>;

type PerfStage =
  | 'send_click'
  | 'http_request_start'
  | 'sse_connect'
  | 'first_chunk'
  | 'stream_end'
  | 'ui_render_done';

type MessageStageTs = Partial<Record<PerfStage, number>>;

export type MessagePerfContext = {
  conversationId: number;
  messageId: string;
  round: number;
};

export type MessagePerfLifecycle = {
  context: MessagePerfContext;
  onSendClick: () => void;
  onHttpStart: () => void;
  onSseConnect: () => void;
  onFirstChunk: () => void;
  onStreamEnd: (reason?: string) => void;
  onUiRenderDone: () => void;
  onCloseRenderComplete: () => void;
};

type NuwaPerfBridge = {
  enabled?: () => boolean;
  mark?: (stage: string, payload?: PerfPayload) => void;
  markOnce?: (key: string, stage: string, payload?: PerfPayload) => void;
};

const stageTsMap = new Map<string, MessageStageTs>();
const roundCounterByConversation = new Map<number, number>();
const ROUND_COUNTER_MAX_SIZE = 5000;

function compactRoundCounterIfNeeded(): void {
  if (roundCounterByConversation.size <= ROUND_COUNTER_MAX_SIZE) return;
  roundCounterByConversation.clear();
}

function getBridgePerf(): NuwaPerfBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).NuwaClawBridge?.perf;
}

function buildPayload(ctx: MessagePerfContext, extra: PerfPayload = {}): PerfPayload {
  return {
    cid: ctx.conversationId,
    mid: ctx.messageId,
    round: ctx.round,
    ...extra,
  };
}

function trackStage(ctx: MessagePerfContext, stage: PerfStage): void {
  const prev = stageTsMap.get(ctx.messageId) ?? {};
  if (prev[stage] === undefined) {
    prev[stage] = Date.now();
    stageTsMap.set(ctx.messageId, prev);
  }
}

function emitSummary(ctx: MessagePerfContext, reason?: string): void {
  const perf = getBridgePerf();
  if (!perf?.enabled?.()) return;

  const ts = stageTsMap.get(ctx.messageId);
  if (!ts?.send_click || !ts?.first_chunk || !ts?.stream_end) {
    return;
  }

  perf.mark?.(
    'summary',
    buildPayload(ctx, {
      send_to_first_chunk_ms: ts.first_chunk - ts.send_click,
      first_chunk_to_end_ms: ts.stream_end - ts.first_chunk,
      total_ms: ts.stream_end - ts.send_click,
      has_ui_render_done: Boolean(ts.ui_render_done),
      reason: reason || 'normal',
    }),
  );
}

function mark(stage: PerfStage, ctx: MessagePerfContext, extra?: PerfPayload): void {
  const perf = getBridgePerf();
  if (!perf?.enabled?.()) return;
  trackStage(ctx, stage);
  perf.mark?.(stage, buildPayload(ctx, extra));
}

function markOnceWithFallback(
  key: string,
  stage: PerfStage,
  ctx: MessagePerfContext,
  extra?: PerfPayload,
): void {
  const perf = getBridgePerf();
  if (!perf?.enabled?.()) return;
  const payload = buildPayload(ctx, extra);
  if (perf.markOnce) {
    perf.markOnce(key, stage, payload);
    return;
  }
  // 降级路径：若宿主未实现 markOnce，至少保证关键阶段日志不丢失。
  perf.mark?.(stage, payload);
}

export const perfTracker = {
  createLifecycle(conversationId: number, messageId: string): MessagePerfLifecycle {
    const normalizedConversationId = Number.isFinite(conversationId)
      ? conversationId
      : null;
    let nextRound = 1;
    if (normalizedConversationId !== null) {
      nextRound =
        (roundCounterByConversation.get(normalizedConversationId) ?? 0) + 1;
      roundCounterByConversation.set(normalizedConversationId, nextRound);
      compactRoundCounterIfNeeded();
    }
    const context: MessagePerfContext = {
      conversationId:
        normalizedConversationId !== null ? normalizedConversationId : -1,
      messageId,
      round: nextRound,
    };
    let firstChunkMarked = false;

    return {
      context,
      onSendClick: () => this.onSendClick(context),
      onHttpStart: () => this.onHttpStart(context),
      onSseConnect: () => this.onSseConnect(context),
      onFirstChunk: () => {
        if (firstChunkMarked) return;
        firstChunkMarked = true;
        this.onFirstChunk(context);
      },
      onStreamEnd: (reason?: string) => this.onStreamEnd(context, reason),
      onUiRenderDone: () => this.onUiRenderDone(context),
      onCloseRenderComplete: () => {
        // UI 渲染完成时机：等待一帧 + 一个最小异步 tick，保证消息状态变更已经落到页面。
        requestAnimationFrame(() => {
          setTimeout(() => {
            this.onUiRenderDone(context);
          }, 0);
        });
      },
    };
  },

  onSendClick(ctx: MessagePerfContext): void {
    mark('send_click', ctx);
  },

  onHttpStart(ctx: MessagePerfContext): void {
    mark('http_request_start', ctx);
  },

  onSseConnect(ctx: MessagePerfContext): void {
    mark('sse_connect', ctx);
  },

  onFirstChunk(ctx: MessagePerfContext): void {
    const perf = getBridgePerf();
    if (!perf?.enabled?.()) return;
    trackStage(ctx, 'first_chunk');
    markOnceWithFallback(
      `${ctx.messageId}:first_chunk`,
      'first_chunk',
      ctx,
    );
  },

  onStreamEnd(ctx: MessagePerfContext, reason?: string): void {
    try {
      const perf = getBridgePerf();
      if (!perf?.enabled?.()) return;
      trackStage(ctx, 'stream_end');
      markOnceWithFallback(
        `${ctx.messageId}:stream_end`,
        'stream_end',
        ctx,
        reason ? { reason } : {},
      );
      emitSummary(ctx, reason);
    } finally {
      // 无论当前页面作用域是否已失效，流结束都必须清理中间缓存，避免泄漏。
      stageTsMap.delete(ctx.messageId);
    }
  },

  onUiRenderDone(ctx: MessagePerfContext): void {
    mark('ui_render_done', ctx);
  },
};

