/** ttyd WebSocket 帧首字节（与官方 Command 枚举一致） */
const TTYD_CMD_INPUT = 0x30;
const TTYD_CMD_OUTPUT = 0x30;

/** ttyd 首包：以 '{' 开头的 JSON，触发 fork shell */
export const encodeTtydInit = (cols: number, rows: number): string =>
  JSON.stringify({ columns: cols, rows });

/** ttyd：'0' + 原始输入字节 */
export const encodeTtydInput = (data: string): Uint8Array => {
  const bytes = new TextEncoder().encode(data);
  const out = new Uint8Array(bytes.length + 1);
  out[0] = TTYD_CMD_INPUT;
  out.set(bytes, 1);
  return out;
};

/** ttyd：'1' + { columns, rows } */
export const encodeTtydResize = (cols: number, rows: number): string =>
  '1' + JSON.stringify({ columns: cols, rows });

/** 解析 ttyd 二进制下行帧，仅提取 OUTPUT(0x30) 写入 xterm */
export const decodeTtydMessage = (raw: ArrayBuffer | string): string => {
  const buf =
    typeof raw === 'string'
      ? new TextEncoder().encode(raw)
      : new Uint8Array(raw);
  if (buf.length === 0 || buf[0] !== TTYD_CMD_OUTPUT) {
    return '';
  }
  return new TextDecoder().decode(buf.subarray(1));
};

/** 客户端 → 服务端：pty_pause()，在 xterm 渲染积压时暂停下行 */
export const TTYD_CMD_PAUSE = 0x32;
/** 客户端 → 服务端：pty_resume()，渲染队列消化后恢复下行 */
export const TTYD_CMD_RESUME = 0x33;

/** 向 ttyd 发送单字节流控命令（PAUSE / RESUME），无 payload */
export const sendTtydFlowControl = (
  ws: WebSocket | null | undefined,
  cmd: number,
) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(new Uint8Array([cmd]));
  }
};
