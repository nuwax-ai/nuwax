import { useEffect, useState } from 'react';

/**
 * 共享走表时钟（NW-265）：列表相对时间需随时间推进而重渲染。
 * 模块级只开一个 30s interval，订阅组件拿到同一 now 值，避免每行一个
 * 定时器；无订阅时自动停表。低频（30s）不会触发长列表高频重绘路径。
 */
const TICK_MS = 30_000;
let sharedNow = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<() => void>();

function ensureTimer() {
  if (timer) return;
  timer = setInterval(() => {
    sharedNow = Date.now();
    subscribers.forEach((notify) => notify());
  }, TICK_MS);
}

export function useNow(): number {
  const [now, setNow] = useState(sharedNow);
  useEffect(() => {
    const notify = () => setNow(sharedNow);
    subscribers.add(notify);
    ensureTimer();
    return () => {
      subscribers.delete(notify);
      if (subscribers.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);
  return now;
}
