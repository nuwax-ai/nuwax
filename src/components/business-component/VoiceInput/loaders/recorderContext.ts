import { VOICE_INPUT_DEFAULTS } from '../config';
import { resolveRecorderWorkletUrl } from './recorderWorklet';

/**
 * 会话级共享 AudioContext + Worklet 模块单例
 *
 * 目的：消除每次录音都 `new AudioContext` + `audioWorklet.addModule` 的开销——
 * worklet 模块的网络拉取与编译，是“点击 → 进入录音态”延迟里最大且最易避免的一块。
 * AudioContext 与已加载的 worklet 在整个页面会话内复用，麦克风流仍按需采集/释放。
 *
 * 不替代 `recorderWorklet.ts`，仅复用其 `resolveRecorderWorkletUrl()`。
 */

type AudioCtxCtor = typeof AudioContext;

let sharedCtx: AudioContext | null = null;
let workletPromise: Promise<void> | null = null;

function pickCtor(): AudioCtxCtor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return (
    (window as any).AudioContext || (window as any).webkitAudioContext || null
  );
}

/**
 * 懒创建 / 复用共享 AudioContext。
 * 已关闭（被系统或显式 dispose）则重建；指定采样率不被支持时回退到默认。
 */
export function getSharedAudioContext(): AudioContext | null {
  const Ctor = pickCtor();
  if (!Ctor) {
    return null;
  }
  if (sharedCtx && sharedCtx.state !== 'closed') {
    return sharedCtx;
  }
  try {
    sharedCtx = new Ctor({ sampleRate: VOICE_INPUT_DEFAULTS.sampleRate });
  } catch {
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

/**
 * 确保共享 AudioContext 已就绪、worklet 已加载（整会话只 fetch+compile 一次），
 * 并在 suspended 时 resume。返回就绪的 ctx。
 * 浏览器不支持时抛 Error('not-supported')，由调用方归类。
 */
export async function ensureWorkletReady(): Promise<AudioContext> {
  const ctx = getSharedAudioContext();
  if (!ctx) {
    throw new Error('not-supported');
  }
  if (!workletPromise) {
    workletPromise = ctx.audioWorklet.addModule(resolveRecorderWorkletUrl());
  }
  try {
    await workletPromise;
  } catch (e) {
    // 加载失败：清缓存以便下次点击可重试
    workletPromise = null;
    throw e;
  }
  if (ctx.state !== 'running') {
    try {
      await ctx.resume();
    } catch (e) {
      throw new Error(
        e instanceof Error ? e.message : 'audio-context-resume-failed',
      );
    }
  }
  if ((ctx.state as string) !== 'running') {
    throw new Error('audio-context-not-running');
  }
  return ctx;
}

/**
 * 预热：挂载 / 悬停时尽力提前加载 worklet，忽略错误（点击时会再次尝试）。
 * 创建 AudioContext 与 addModule 不需要用户手势（ctx 处于 suspended 也可加载模块）。
 */
export function warmUpRecorder(): void {
  void ensureWorkletReady().catch(() => {
    /* noop */
  });
}

/**
 * 释放共享 AudioContext。仅页面级下线 / 模块禁用时调用；默认不调用，
 * 以便会话内多次录音复用同一 ctx 与已加载的 worklet。
 */
export function disposeRecorder(): void {
  workletPromise = null;
  if (sharedCtx) {
    try {
      void sharedCtx.close();
    } catch {
      /* noop */
    }
    sharedCtx = null;
  }
}
