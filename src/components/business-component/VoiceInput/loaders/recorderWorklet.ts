/**
 * AudioWorklet 模块加载器
 *
 * recorder-worklet.js 位于 public/，由 umi 按 publicPath 服务到运行时站点。
 * 由于应用可能部署在子路径，或 process.env.BASE_URL 带有路径前缀，
 * 这里解析出可用的绝对 URL 再交给 audioWorklet.addModule 加载，
 * 避免相对路径在某些部署形态下 404。
 *
 * 同一 AudioContext 的 addModule 只需执行一次，这里做 Promise 缓存。
 */

function resolveRecorderWorkletUrl(): string {
  const base = process.env.BASE_URL || '';

  // BASE_URL 形如 https://agent.nuwax.com 或 http://localhost:8000，也可能带子路径
  if (base && typeof window !== 'undefined') {
    try {
      const u = new URL(base, window.location.origin);
      const prefix = u.pathname.replace(/\/$/, ''); // 去掉末尾斜杠
      return `${u.origin}${prefix}/recorder-worklet.js`;
    } catch {
      // 解析失败则回退到站点根
    }
  }

  // 兜底：以当前站点根为基准
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/recorder-worklet.js`;
  }

  return '/recorder-worklet.js';
}

const modulePromiseMap = new WeakMap<AudioContext, Promise<void>>();

/**
 * 加载录音 worklet 模块（同一 AudioContext 仅加载一次）。
 */
export function loadRecorderWorklet(ctx: AudioContext): Promise<void> {
  let promise = modulePromiseMap.get(ctx);
  if (!promise) {
    promise = ctx.audioWorklet.addModule(resolveRecorderWorkletUrl());
    modulePromiseMap.set(ctx, promise);
  }
  return promise;
}
