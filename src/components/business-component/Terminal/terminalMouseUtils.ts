import type { Terminal } from './xtermBundle';

/** 关闭 xterm / PTY 侧各类鼠标追踪模式（1000/1002/1003/1006） */
export const DISABLE_TERMINAL_MOUSE_TRACKING =
  '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l';

/** 是否为 xterm 鼠标上报序列（点击 / 滚轮 / 拖拽） */
export const isXtermMouseReport = (data: string): boolean => {
  if (!data) {
    return false;
  }
  // SGR 模式（DECSET 1006 / 1002）
  if (/^\x1b\[<[\d;]*\d[mM]$/.test(data)) {
    return true;
  }
  // 经典模式（DECSET 1000 / 1003）
  if (/^\x1b\[M[\u0020-\u003f\u0060-\u007e]{3}$/.test(data)) {
    return true;
  }
  return false;
};

/**
 * 是否应将用户输入转发到 WebSocket
 * 主缓冲区（shell 提示符）下过滤鼠标序列，避免点击/滚轮污染命令行；
 * 备用屏（vim/less/tmux）内保留鼠标上报。
 */
export const shouldForwardTerminalInput = (
  term: Terminal,
  data: string,
): boolean => {
  if (!isXtermMouseReport(data)) {
    return true;
  }
  return term.buffer.active !== term.buffer.normal;
};
