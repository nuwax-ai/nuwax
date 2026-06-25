import classNames from 'classnames';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import type { ITheme } from '@xterm/xterm';
import {
  DEFAULT_TERMINAL_RECONNECT,
  getTerminalMaxRetries,
  getTerminalReconnectDelay,
  type TerminalReconnectConfig,
} from './terminalReconnect';
import {
  decodeTtydMessage,
  encodeTtydInit,
  encodeTtydInput,
  encodeTtydResize,
} from './ttydWire';
import type { TerminalWireProtocol } from './type';
import { FitAddon, Terminal } from './xtermBundle';

// xterm.js 核心样式
import './xterm.css';

export interface EmbeddedConsoleTerminalRef {
  writeln: (data: string) => void;
  getTerminal: () => Terminal | null;
  /** 重新计算 cols/rows 以适配容器尺寸（容器从隐藏变为可见后调用） */
  fit: () => void;
  /** fit 后向后端同步 ttyd 尺寸（init 尚未发送时会补发 init） */
  fitAndSyncBackend: () => void;
  /**
   * 面板从 display:none / 折叠恢复可见后调用：
   * 等待容器有尺寸 → fit → 同步 ttyd resize → refresh → focus
   */
  restoreAfterVisibilityChange: () => void;
  /** 聚焦终端以接收键盘输入 */
  focus: () => void;
  /** 建立 WebSocket 连接 */
  connect: (url?: string) => void;
  /** 断开 WebSocket 连接 */
  disconnect: () => void;
  /** 重置重连计数后重新连接 */
  reconnect: (url?: string) => void;
}

export interface EmbeddedConsoleTerminalProps {
  className?: string;
  wsUrl?: string;
  wsSubprotocols?: string | string[];
  wireProtocol?: TerminalWireProtocol;
  theme?: ITheme;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  cursorBlink?: boolean;
  autoConnect?: boolean;
  reconnect?: TerminalReconnectConfig;
  onConnect?: () => void;
  onDisconnect?: (event?: CloseEvent) => void;
  /** 自动重连达到最大次数后触发 */
  onReconnectFailed?: () => void;
}

const scheduleFit = (fit: () => void, afterFit?: () => void) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        fit();
      } catch {
        /* ignore */
      }
      afterFit?.();
    });
  });
};

/** 容器从 display:none / 0 尺寸恢复时，fit 可能无效；等到可见且有宽高再执行 */
const scheduleFitWhenVisible = (
  getViewport: () => HTMLDivElement | null,
  fit: () => void,
  afterFit?: () => void,
  retries = 12,
) => {
  const attempt = (left: number) => {
    const el = getViewport();
    const rect = el?.getBoundingClientRect();
    const visible = !!rect && rect.width > 0 && rect.height > 0;

    if (visible || left <= 0) {
      scheduleFit(fit, afterFit);
      return;
    }
    requestAnimationFrame(() => attempt(left - 1));
  };
  attempt(retries);
};

const ensureDimensions = (term: Terminal): { cols: number; rows: number } => {
  let { cols, rows } = term;
  if (cols <= 0 || rows <= 0) {
    cols = 80;
    rows = 24;
    term.resize(cols, rows);
  }
  return { cols, rows };
};

/**
 * 底部控制台专用轻量终端：仅静态依赖 xterm + FitAddon，避免完整 XtermTerminal 在生产环境分包崩溃
 */
const EmbeddedConsoleTerminal = forwardRef<
  EmbeddedConsoleTerminalRef,
  EmbeddedConsoleTerminalProps
>(
  (
    {
      className,
      wsUrl,
      wsSubprotocols,
      wireProtocol = 'ttyd',
      theme,
      fontSize = 13,
      fontFamily = "'JetBrains Mono', monospace, 'Fira Code', Consolas, 'Courier New'",
      lineHeight = 1.35,
      cursorBlink = true,
      autoConnect = true,
      reconnect = DEFAULT_TERMINAL_RECONNECT,
      onConnect,
      onDisconnect,
      onReconnectFailed,
    },
    ref,
  ) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const ttydInitSentRef = useRef(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const reconnectCountRef = useRef(0);
    const isManualDisconnectRef = useRef(false);
    /** xterm 是否已完成 open，WS 早到的输出暂存于此 */
    const pendingWritesRef = useRef<string[]>([]);
    const terminalReadyRef = useRef(false);

    /** 心跳检测：最后一次收到服务端消息的时间戳 */
    const lastServerMessageTimeRef = useRef<number>(0);
    /** 心跳检测定时器 */
    const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(
      null,
    );

    /**
     * 将回调和配置存入 ref，保持 connect/disconnect 的引用稳定，
     * 避免因父组件每次渲染传入新的 onConnect/onDisconnect/reconnect 对象
     * 导致 useEffect 反复触发 disconnect → connect 循环。
     */
    const onConnectRef = useRef(onConnect);
    onConnectRef.current = onConnect;
    const onDisconnectRef = useRef(onDisconnect);
    onDisconnectRef.current = onDisconnect;
    const onReconnectFailedRef = useRef(onReconnectFailed);
    onReconnectFailedRef.current = onReconnectFailed;
    const reconnectConfigRef = useRef(reconnect);
    reconnectConfigRef.current = reconnect;
    const wsUrlRef = useRef(wsUrl);
    wsUrlRef.current = wsUrl;
    const wsSubprotocolsRef = useRef(wsSubprotocols);
    wsSubprotocolsRef.current = wsSubprotocols;
    const autoConnectRef = useRef(autoConnect);
    autoConnectRef.current = autoConnect;
    /** 连接成功但尚未成功 focus 时置 true，容器变为可见后补 focus */
    const pendingFocusRef = useRef(false);

    const isViewportMeasurable = useCallback(() => {
      const rect = viewportRef.current?.getBoundingClientRect();
      return !!rect && rect.width > 0 && rect.height > 0;
    }, []);

    const syncBackendSize = useCallback(
      (
        ws: WebSocket,
        options?: { sendTtydInit?: boolean; allowFallbackDimensions?: boolean },
      ) => {
        const term = terminalRef.current;
        if (!term || ws.readyState !== WebSocket.OPEN) return;

        if (!isViewportMeasurable()) {
          return;
        }

        let { cols, rows } = term;
        if (cols <= 0 || rows <= 0) {
          if (!options?.allowFallbackDimensions) {
            return;
          }
          ({ cols, rows } = ensureDimensions(term));
        }

        if (wireProtocol === 'ttyd') {
          const shouldSendInit =
            options?.sendTtydInit === true ||
            (options?.sendTtydInit !== false && !ttydInitSentRef.current);
          if (shouldSendInit && !ttydInitSentRef.current) {
            ws.send(encodeTtydInit(cols, rows));
            ttydInitSentRef.current = true;
          } else if (ttydInitSentRef.current) {
            ws.send(encodeTtydResize(cols, rows));
          }
        }
      },
      // wireProtocol 是基本值，几乎不会变化；此处保持稳定引用
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [isViewportMeasurable],
    );

    const fitAndSyncBackend = useCallback(() => {
      if (!isViewportMeasurable()) {
        pendingFocusRef.current = true;
        return;
      }
      try {
        fitAddonRef.current?.fit();
      } catch {
        /* ignore */
      }
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        syncBackendSize(ws, { sendTtydInit: !ttydInitSentRef.current });
      }
    }, [isViewportMeasurable, syncBackendSize]);

    const focusTerminal = useCallback(() => {
      const term = terminalRef.current;
      const viewport = viewportRef.current;
      if (!term || !viewport) return;

      const rect = viewport.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        pendingFocusRef.current = true;
        return;
      }

      term.focus();
      pendingFocusRef.current = false;
    }, []);

    const restoreAfterVisibilityChange = useCallback(() => {
      scheduleFitWhenVisible(
        () => viewportRef.current,
        () => {
          try {
            fitAddonRef.current?.fit();
          } catch {
            /* ignore */
          }
        },
        () => {
          const ws = wsRef.current;
          const term = terminalRef.current;
          if (ws?.readyState === WebSocket.OPEN) {
            syncBackendSize(ws, {
              sendTtydInit: false,
              allowFallbackDimensions: true,
            });
          }
          if (term) {
            try {
              term.refresh(0, Math.max(term.rows - 1, 0));
            } catch {
              /* ignore */
            }
          }
          focusTerminal();
        },
        24,
      );
    }, [focusTerminal, syncBackendSize]);

    /** 停止心跳检测 */
    const stopHeartbeat = useCallback(() => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    }, []);

    /** 启动心跳检测 */
    const startHeartbeat = useCallback(() => {
      stopHeartbeat();
      const cfg = reconnectConfigRef.current;
      const interval =
        cfg.heartbeatInterval ?? DEFAULT_TERMINAL_RECONNECT.heartbeatInterval;
      if (interval <= 0) return;

      lastServerMessageTimeRef.current = Date.now();

      heartbeatTimerRef.current = setInterval(() => {
        const ws = wsRef.current;
        const term = terminalRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN || !term) {
          stopHeartbeat();
          return;
        }

        // 检查是否超时未收到服务端消息
        const timeout =
          cfg.heartbeatTimeout ?? DEFAULT_TERMINAL_RECONNECT.heartbeatTimeout;
        const elapsed = Date.now() - lastServerMessageTimeRef.current;
        if (elapsed > timeout) {
          console.warn(
            `[EmbeddedTerminal] Heartbeat timeout: no message for ${elapsed}ms, reconnecting...`,
          );
          // 强制关闭 WS 触发 onclose → 走自动重连逻辑
          // 不设置 isManualDisconnectRef，让 reconnect 流程处理
          ws.close();
          return;
        }

        // 折叠/隐藏期间容器尺寸为 0，跳过 resize 避免向后端发送错误的 80x24
        if (wireProtocol === 'ttyd') {
          if (!isViewportMeasurable()) {
            return;
          }
          const { cols, rows } = term;
          if (cols <= 0 || rows <= 0) {
            return;
          }
          try {
            ws.send(encodeTtydResize(cols, rows));
          } catch (err) {
            console.warn('[EmbeddedTerminal] Heartbeat send failed:', err);
            ws.close();
          }
        }
      }, interval);
    }, [isViewportMeasurable, stopHeartbeat, wireProtocol]);

    const clearReconnectTimer = useCallback(() => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }, []);

    const connect = useCallback(
      (url?: string) => {
        const targetUrl = url || wsUrlRef.current;
        if (!targetUrl) {
          console.warn('[EmbeddedTerminal] No WebSocket URL provided');
          return;
        }

        if (
          wsRef.current?.readyState === WebSocket.OPEN ||
          wsRef.current?.readyState === WebSocket.CONNECTING
        ) {
          return;
        }

        const scheduleReconnect = () => {
          const reconnectConfig = reconnectConfigRef.current;
          if (
            reconnectConfig.enabled === false ||
            isManualDisconnectRef.current
          ) {
            return;
          }

          const maxRetries = getTerminalMaxRetries(reconnectConfig);
          if (reconnectCountRef.current >= maxRetries) {
            console.error(
              `[EmbeddedTerminal] Max reconnection attempts reached (${maxRetries})`,
            );
            onReconnectFailedRef.current?.();
            return;
          }

          const delay = getTerminalReconnectDelay(
            reconnectCountRef.current,
            reconnectConfig,
          );
          reconnectCountRef.current += 1;
          console.log(
            `[EmbeddedTerminal] Reconnect #${reconnectCountRef.current}/${maxRetries} in ${delay}ms`,
          );

          clearReconnectTimer();
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connect(targetUrl);
          }, delay);
        };

        isManualDisconnectRef.current = false;
        ttydInitSentRef.current = false;
        pendingWritesRef.current = [];

        console.log('[EmbeddedTerminal] Connecting to', targetUrl);

        let ws: WebSocket;
        try {
          const subprotocols = wsSubprotocolsRef.current;
          ws = subprotocols
            ? new WebSocket(targetUrl, subprotocols)
            : new WebSocket(targetUrl);
          ws.binaryType = 'arraybuffer';
          wsRef.current = ws;
        } catch (err) {
          console.error('[EmbeddedTerminal] WebSocket creation failed:', err);
          scheduleReconnect();
          return;
        }

        ws.onopen = () => {
          console.log('[EmbeddedTerminal] WebSocket connected');
          reconnectCountRef.current = 0;
          clearReconnectTimer();
          lastServerMessageTimeRef.current = Date.now();
          startHeartbeat();
          scheduleFitWhenVisible(
            () => viewportRef.current,
            () => fitAddonRef.current?.fit(),
            () => {
              syncBackendSize(ws, {
                sendTtydInit: true,
                allowFallbackDimensions: true,
              });
              const pending = pendingWritesRef.current.splice(0);
              const term = terminalRef.current;
              if (term && pending.length > 0) {
                for (const chunk of pending) {
                  term.write(chunk);
                }
              }
              focusTerminal();
              onConnectRef.current?.();
              // 父组件 onConnect 可能写入提示行，延迟再 fit + focus 确保可输入
              scheduleFitWhenVisible(
                () => viewportRef.current,
                () => fitAddonRef.current?.fit(),
                () => {
                  syncBackendSize(ws, { sendTtydInit: false });
                  focusTerminal();
                },
              );
            },
          );
        };

        ws.onmessage = (event: MessageEvent) => {
          lastServerMessageTimeRef.current = Date.now();
          const term = terminalRef.current;
          const data =
            wireProtocol === 'ttyd'
              ? decodeTtydMessage(event.data)
              : typeof event.data === 'string'
              ? event.data
              : new TextDecoder().decode(event.data);
          if (!data) return;
          if (!term || !terminalReadyRef.current) {
            pendingWritesRef.current.push(data);
            return;
          }
          term.write(data);
        };

        ws.onclose = (event: CloseEvent) => {
          stopHeartbeat();
          console.log(
            '[EmbeddedTerminal] WebSocket closed:',
            event.code,
            event.reason,
          );
          ttydInitSentRef.current = false;
          wsRef.current = null;
          onDisconnectRef.current?.(event);

          if (!isManualDisconnectRef.current) {
            scheduleReconnect();
          }
        };

        ws.onerror = (event) => {
          console.error('[EmbeddedTerminal] WebSocket error:', event);
        };
      },
      // 所有外部依赖已通过 ref 访问，保持 connect 引用稳定
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [clearReconnectTimer, syncBackendSize, wireProtocol],
    );

    const disconnect = useCallback(() => {
      stopHeartbeat();
      isManualDisconnectRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      pendingWritesRef.current = [];
      ttydInitSentRef.current = false;
    }, [clearReconnectTimer, stopHeartbeat]);

    const reconnectTerminal = useCallback(
      (url?: string) => {
        reconnectCountRef.current = 0;
        clearReconnectTimer();
        isManualDisconnectRef.current = false;
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        pendingWritesRef.current = [];
        ttydInitSentRef.current = false;
        window.setTimeout(() => {
          connect(url || wsUrlRef.current);
        }, 0);
      },
      [clearReconnectTimer, connect],
    );

    useImperativeHandle(
      ref,
      () => ({
        writeln: (data: string) => {
          terminalRef.current?.writeln(data);
        },
        getTerminal: () => terminalRef.current,
        fit: () => {
          try {
            fitAddonRef.current?.fit();
          } catch {
            /* ignore */
          }
        },
        fitAndSyncBackend,
        restoreAfterVisibilityChange,
        focus: focusTerminal,
        connect,
        disconnect,
        reconnect: reconnectTerminal,
      }),
      [
        connect,
        disconnect,
        fitAndSyncBackend,
        focusTerminal,
        reconnectTerminal,
        restoreAfterVisibilityChange,
      ],
    );

    useEffect(() => {
      if (!viewportRef.current) return;

      const term = new Terminal({
        cursorBlink,
        fontSize,
        fontFamily,
        lineHeight,
        scrollback: 5000,
        theme,
        cursorStyle: 'block',
        allowProposedApi: false,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(viewportRef.current);

      terminalRef.current = term;
      fitAddonRef.current = fitAddon;
      terminalReadyRef.current = true;

      term.onData((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          if (wireProtocol === 'ttyd') {
            wsRef.current.send(encodeTtydInput(data));
          } else {
            wsRef.current.send(data);
          }
        }
      });

      term.onResize(({ cols, rows }) => {
        if (
          wsRef.current?.readyState !== WebSocket.OPEN ||
          wireProtocol !== 'ttyd'
        ) {
          return;
        }
        if (!ttydInitSentRef.current) {
          wsRef.current.send(encodeTtydInit(cols, rows));
          ttydInitSentRef.current = true;
        } else {
          wsRef.current.send(encodeTtydResize(cols, rows));
        }
      });

      scheduleFit(
        () => fitAddon.fit(),
        () => {
          // xterm 就绪后刷掉 WS 早到的输出
          const pending = pendingWritesRef.current.splice(0);
          if (pending.length > 0) {
            for (const chunk of pending) {
              term.write(chunk);
            }
          }
          // 若 WS 已连接但尚未发 ttyd init（竞态），补发
          const ws = wsRef.current;
          if (ws?.readyState === WebSocket.OPEN) {
            syncBackendSize(ws, { sendTtydInit: true });
          }
        },
      );

      /**
       * 监听容器尺寸变化（如面板折叠/展开、布局切换），
       * 自动调用 fit 重新适配 cols/rows，避免 xterm-screen 停留在旧尺寸。
       * 容器尺寸为 0（处于 display:none 状态）时跳过，防止 fit 出极小值。
       */
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            try {
              fitAddon.fit();
            } catch {
              /* ignore */
            }
            const ws = wsRef.current;
            if (ws?.readyState === WebSocket.OPEN) {
              syncBackendSize(ws, { sendTtydInit: !ttydInitSentRef.current });
            }
            if (pendingFocusRef.current) {
              term.focus();
              pendingFocusRef.current = false;
            }
          }
        }
      });
      resizeObserver.observe(viewportRef.current);

      return () => {
        resizeObserver.disconnect();
        terminalReadyRef.current = false;
        pendingWritesRef.current = [];
        ttydInitSentRef.current = false;
        disconnect();
        fitAddon.dispose();
        term.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
      };
    }, [
      cursorBlink,
      disconnect,
      fontFamily,
      fontSize,
      lineHeight,
      syncBackendSize,
      wireProtocol,
    ]);

    useEffect(() => {
      if (!autoConnect || !wsUrl || !terminalReadyRef.current) return;

      let cancelled = false;
      const tryConnect = (retries = 12) => {
        if (cancelled || !autoConnectRef.current || !wsUrlRef.current) return;

        const viewport = viewportRef.current;
        const rect = viewport?.getBoundingClientRect();
        const visible = !!rect && rect.width > 0 && rect.height > 0;

        if (visible || retries <= 0) {
          connect(wsUrlRef.current);
          return;
        }
        requestAnimationFrame(() => tryConnect(retries - 1));
      };

      tryConnect();
      return () => {
        cancelled = true;
        disconnect();
      };
    }, [autoConnect, wsUrl, connect, disconnect]);

    useEffect(() => {
      if (!terminalRef.current) return;
      terminalRef.current.options.theme = theme;
    }, [theme]);

    return (
      <div
        className={classNames(className)}
        ref={viewportRef}
        style={{ width: '100%', height: '100%' }}
        onMouseDown={(event) => {
          if (event.button !== 0) return;
          focusTerminal();
        }}
      />
    );
  },
);

export default EmbeddedConsoleTerminal;
