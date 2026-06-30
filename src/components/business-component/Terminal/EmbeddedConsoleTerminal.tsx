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
  DISABLE_TERMINAL_MOUSE_TRACKING,
  shouldForwardTerminalInput,
} from './terminalMouseUtils';
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
  /** 向 shell 发送空行，触发重新输出命令提示符（重连后使用） */
  requestShellPrompt: () => void;
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

    /** 心跳保活定时器：周期性同步终端尺寸 + 借 send 失败检测断连 */
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
    /** 是否曾成功连通过（用于区分首次连接与自动重连） */
    const hasEverConnectedRef = useRef(false);

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

        let { cols, rows } = term;
        if (cols <= 0 || rows <= 0) {
          if (isViewportMeasurable()) {
            try {
              fitAddonRef.current?.fit();
            } catch {
              /* ignore */
            }
            ({ cols, rows } = term);
          }
          if (cols <= 0 || rows <= 0) {
            if (!options?.allowFallbackDimensions) {
              return;
            }
            ({ cols, rows } = ensureDimensions(term));
          }
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

    /** 重置 xterm 本地鼠标追踪状态，避免 shell 提示符下点击/滚轮产生乱码输入 */
    const resetLocalMouseTracking = useCallback(() => {
      terminalRef.current?.write(DISABLE_TERMINAL_MOUSE_TRACKING);
    }, []);

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

    const fitAndSyncBackend = useCallback(() => {
      const ws = wsRef.current;
      const term = terminalRef.current;
      if (!term || ws?.readyState !== WebSocket.OPEN) {
        if (!isViewportMeasurable()) {
          pendingFocusRef.current = true;
        }
        return;
      }

      if (isViewportMeasurable()) {
        try {
          fitAddonRef.current?.fit();
        } catch {
          /* ignore */
        }
      }

      syncBackendSize(ws, {
        sendTtydInit: !ttydInitSentRef.current,
        allowFallbackDimensions: true,
      });
      focusTerminal();
    }, [focusTerminal, isViewportMeasurable, syncBackendSize]);

    /** 向 shell 发送换行，触发 bash 等重新输出 `user@host:path$` 提示符 */
    const requestShellPrompt = useCallback(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }
      try {
        if (wireProtocol === 'ttyd') {
          ws.send(encodeTtydInput('\n'));
        } else {
          ws.send('\n');
        }
      } catch {
        /* ignore */
      }
    }, [wireProtocol]);

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
              sendTtydInit: !ttydInitSentRef.current,
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

    /**
     * 启动保活定时器
     *
     * 1. 周期性把 xterm 尺寸同步给后端（ttyd 协议；折叠/隐藏时跳过，避免发错误的 80x24）
     * 2. 借 ws.send 失败检测连接是否已断，失败则 close 触发自动重连
     *
     * 不再以「无服务端消息超时」判活：ttyd 是被动协议，终端空闲时本就没有输出，
     * 误判会让连接每 ~90s 被关一次（前端表现为 close 1005、随后自动重连）。
     * 连接真正断开由浏览器 onclose（TCP FIN/RST）兜底，触发自动重连流程。
     */
    const startHeartbeat = useCallback(() => {
      stopHeartbeat();
      const cfg = reconnectConfigRef.current;
      const interval =
        cfg.heartbeatInterval ?? DEFAULT_TERMINAL_RECONNECT.heartbeatInterval;
      if (interval <= 0) return;

      heartbeatTimerRef.current = setInterval(() => {
        const ws = wsRef.current;
        const term = terminalRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN || !term) {
          stopHeartbeat();
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
            if (!ttydInitSentRef.current) {
              syncBackendSize(ws, {
                sendTtydInit: true,
                allowFallbackDimensions: true,
              });
            } else {
              ws.send(encodeTtydResize(cols, rows));
            }
          } catch (err) {
            console.warn('[EmbeddedTerminal] Heartbeat send failed:', err);
            ws.close();
          }
        }
      }, interval);
    }, [isViewportMeasurable, stopHeartbeat, syncBackendSize, wireProtocol]);

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

        // 关闭尚未完全释放的旧连接，避免 CLOSING 期间新建 WS 后旧 onclose 误清空 wsRef
        const existingWs = wsRef.current;
        if (existingWs) {
          isManualDisconnectRef.current = true;
          try {
            existingWs.close();
          } catch {
            /* ignore */
          }
          wsRef.current = null;
          isManualDisconnectRef.current = false;
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
          if (wsRef.current !== ws) {
            return;
          }
          console.log('[EmbeddedTerminal] WebSocket connected');
          reconnectCountRef.current = 0;
          clearReconnectTimer();

          const isReconnect = hasEverConnectedRef.current;
          const term = terminalRef.current;

          // ttyd 必须在首包发送 JSON init 才会 fork shell；同步发送，避免 fit 异步竞态
          if (wireProtocol === 'ttyd') {
            if (term) {
              let { cols, rows } = term;
              if (cols <= 0 || rows <= 0) {
                ({ cols, rows } = ensureDimensions(term));
              }
              ws.send(encodeTtydInit(cols, rows));
              ttydInitSentRef.current = true;
            }
          }

          hasEverConnectedRef.current = true;

          startHeartbeat();
          scheduleFitWhenVisible(
            () => viewportRef.current,
            () => fitAddonRef.current?.fit(),
            () => {
              if (wsRef.current !== ws) {
                return;
              }
              syncBackendSize(ws, {
                sendTtydInit: !ttydInitSentRef.current,
                allowFallbackDimensions: true,
              });
              resetLocalMouseTracking();
              const pending = pendingWritesRef.current.splice(0);
              const term = terminalRef.current;
              if (term && pending.length > 0) {
                for (const chunk of pending) {
                  term.write(chunk);
                }
              }
              focusTerminal();
              onConnectRef.current?.();
              if (isReconnect) {
                window.setTimeout(() => {
                  if (
                    wsRef.current !== ws ||
                    ws.readyState !== WebSocket.OPEN
                  ) {
                    return;
                  }
                  requestShellPrompt();
                  focusTerminal();
                }, 80);
                window.setTimeout(() => {
                  if (
                    wsRef.current !== ws ||
                    ws.readyState !== WebSocket.OPEN
                  ) {
                    return;
                  }
                  requestShellPrompt();
                  focusTerminal();
                }, 280);
              }
              // 父组件 onConnect 可能写入提示行，延迟再 fit + init + focus 确保重连后可输入
              scheduleFitWhenVisible(
                () => viewportRef.current,
                () => fitAddonRef.current?.fit(),
                () => {
                  if (wsRef.current !== ws) {
                    return;
                  }
                  syncBackendSize(ws, {
                    sendTtydInit: !ttydInitSentRef.current,
                    allowFallbackDimensions: true,
                  });
                  resetLocalMouseTracking();
                  focusTerminal();
                },
              );
              window.setTimeout(() => {
                if (wsRef.current !== ws || ws.readyState !== WebSocket.OPEN) {
                  return;
                }
                syncBackendSize(ws, {
                  sendTtydInit: !ttydInitSentRef.current,
                  allowFallbackDimensions: true,
                });
                focusTerminal();
              }, 300);
            },
          );
        };

        ws.onmessage = (event: MessageEvent) => {
          if (wsRef.current !== ws) {
            return;
          }
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
          // 忽略已被新连接取代的旧 WebSocket 的 close，防止误清空 wsRef 导致「已连接但无法输入」
          if (wsRef.current !== ws) {
            return;
          }
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
          if (wsRef.current !== ws) {
            return;
          }
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
        requestShellPrompt,
      }),
      [
        connect,
        disconnect,
        fitAndSyncBackend,
        focusTerminal,
        reconnectTerminal,
        requestShellPrompt,
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
        const termInstance = terminalRef.current;
        if (termInstance && !shouldForwardTerminalInput(termInstance, data)) {
          return;
        }
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
