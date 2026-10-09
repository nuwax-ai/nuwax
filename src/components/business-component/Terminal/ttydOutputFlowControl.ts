import { TTYD_CMD_PAUSE, TTYD_CMD_RESUME } from './ttydWire';
import { DEFAULT_TTYD_FLOW_CONTROL } from './type';

export interface TtydOutputFlowControl {
  write: (data: string) => void;
  /** 新连接清零；旧连接的 xterm 回调不能扣减新连接的待解析字节。 */
  reset: () => void;
  /** 主动断开前恢复 PTY 下行，然后清零本地状态。 */
  release: () => void;
  getPendingBytes: () => number;
}

interface TtydOutputFlowControlOptions {
  write: (data: string, callback: () => void) => void;
  send: (command: number) => void;
  highWaterBytes?: number;
  lowWaterBytes?: number;
}

/**
 * 复用 ttyd 的 PAUSE / RESUME 协议，按 xterm 尚未解析的 UTF-8 字节做背压。
 * PAUSE 只停止下行，不丢弃已到达的输出、不结束 PTY；write 回调后才释放预算。
 */
export function createTtydOutputFlowControl({
  write,
  send,
  highWaterBytes = DEFAULT_TTYD_FLOW_CONTROL.limit *
    DEFAULT_TTYD_FLOW_CONTROL.highWater,
  lowWaterBytes = DEFAULT_TTYD_FLOW_CONTROL.limit *
    DEFAULT_TTYD_FLOW_CONTROL.lowWater,
}: TtydOutputFlowControlOptions): TtydOutputFlowControl {
  let pendingBytes = 0;
  let paused = false;
  let generation = 0;
  const encoder = new TextEncoder();
  const sendControl = (command: number) => {
    try {
      send(command);
    } catch {
      // socket 在 OPEN 检查后关闭时，不能让流控异常阻断原始输出写入。
    }
  };
  const reset = () => {
    generation += 1;
    pendingBytes = 0;
    paused = false;
  };

  return {
    write(data) {
      if (!data) return;
      const bytes = encoder.encode(data).byteLength;
      const owner = generation;
      pendingBytes += bytes;
      if (!paused && pendingBytes > highWaterBytes) {
        paused = true;
        sendControl(TTYD_CMD_PAUSE);
      }
      write(data, () => {
        if (owner !== generation) return;
        pendingBytes = Math.max(0, pendingBytes - bytes);
        if (paused && pendingBytes < lowWaterBytes) {
          paused = false;
          sendControl(TTYD_CMD_RESUME);
        }
      });
    },
    reset,
    release() {
      sendControl(TTYD_CMD_RESUME);
      reset();
    },
    getPendingBytes: () => pendingBytes,
  };
}
