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
  reconnect?: {
    enabled?: boolean;
    maxRetries?: number;
    retryDelay?: number;
  };
  onConnect?: () => void;
  onDisconnect?: (event?: CloseEvent) => void;
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
      reconnect = { enabled: true, maxRetries: 5, retryDelay: 2000 },
      onConnect,
      onDisconnect,
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

    /**
     * 将回调和配置存入 ref，保持 connect/disconnect 的引用稳定，
     * 避免因父组件每次渲染传入新的 onConnect/onDisconnect/reconnect 对象
     * 导致 useEffect 反复触发 disconnect → connect 循环。
     */
    const onConnectRef = useRef(onConnect);
    onConnectRef.current = onConnect;
    const onDisconnectRef = useRef(onDisconnect);
    onDisconnectRef.current = onDisconnect;
    const reconnectConfigRef = useRef(reconnect);
    reconnectConfigRef.current = reconnect;
    const wsUrlRef = useRef(wsUrl);
    wsUrlRef.current = wsUrl;
    const wsSubprotocolsRef = useRef(wsSubprotocols);
    wsSubprotocolsRef.current = wsSubprotocols;

    const syncBackendSize = useCallback(
      (ws: WebSocket, options?: { sendTtydInit?: boolean }) => {
        const term = terminalRef.current;
        if (!term || ws.readyState !== WebSocket.OPEN) return;

        const { cols, rows } = ensureDimensions(term);
        if (wireProtocol === 'ttyd') {
          if (options?.sendTtydInit && !ttydInitSentRef.current) {
            ws.send(encodeTtydInit(cols, rows));
            ttydInitSentRef.current = true;
          } else if (ttydInitSentRef.current) {
            ws.send(encodeTtydResize(cols, rows));
          }
        }
      },
      // wireProtocol 是基本值，几乎不会变化；此处保持稳定引用
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

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
          const reconnectConfig = reconnectConfigRef.current;
          if (
            reconnectConfig.enabled !== false &&
            reconnectCountRef.current < (reconnectConfig.maxRetries ?? 5) &&
            !isManualDisconnectRef.current
          ) {
            const delay =
              (reconnectConfig.retryDelay ?? 2000) *
              Math.pow(2, reconnectCountRef.current);
            reconnectCountRef.current += 1;
            reconnectTimerRef.current = setTimeout(() => {
              connect(targetUrl);
            }, delay);
          }
          return;
        }

        ws.onopen = () => {
          console.log('[EmbeddedTerminal] WebSocket connected');
          reconnectCountRef.current = 0;
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          scheduleFit(
            () => fitAddonRef.current?.fit(),
            () => {
              syncBackendSize(ws, { sendTtydInit: true });
              const pending = pendingWritesRef.current.splice(0);
              const term = terminalRef.current;
              if (term && pending.length > 0) {
                for (const chunk of pending) {
                  term.write(chunk);
                }
              }
              onConnectRef.current?.();
            },
          );
        };

        ws.onmessage = (event: MessageEvent) => {
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
          console.log(
            '[EmbeddedTerminal] WebSocket closed:',
            event.code,
            event.reason,
          );
          ttydInitSentRef.current = false;
          wsRef.current = null;
          onDisconnectRef.current?.(event);

          const reconnectConfig = reconnectConfigRef.current;
          if (
            reconnectConfig.enabled !== false &&
            reconnectCountRef.current < (reconnectConfig.maxRetries ?? 5) &&
            !isManualDisconnectRef.current
          ) {
            const delay =
              (reconnectConfig.retryDelay ?? 2000) *
              Math.pow(2, reconnectCountRef.current);
            reconnectCountRef.current += 1;
            console.log(
              `[EmbeddedTerminal] Reconnecting in ${delay}ms (attempt ${
                reconnectCountRef.current
              }/${reconnectConfig.maxRetries ?? 5})`,
            );
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
            }
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              connect(targetUrl);
            }, delay);
          } else if (
            !isManualDisconnectRef.current &&
            reconnectCountRef.current >= (reconnectConfig.maxRetries ?? 5)
          ) {
            console.error(
              '[EmbeddedTerminal] Max reconnection attempts reached',
            );
          }
        };

        ws.onerror = (event) => {
          console.error('[EmbeddedTerminal] WebSocket error:', event);
        };
      },
      // 所有外部依赖已通过 ref 访问，保持 connect 引用稳定
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [syncBackendSize, wireProtocol],
    );

    const disconnect = useCallback(() => {
      isManualDisconnectRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      pendingWritesRef.current = [];
      ttydInitSentRef.current = false;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        writeln: (data: string) => {
          terminalRef.current?.writeln(data);
        },
        getTerminal: () => terminalRef.current,
      }),
      [],
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
          wsRef.current?.readyState === WebSocket.OPEN &&
          wireProtocol === 'ttyd'
        ) {
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

      return () => {
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
      if (!autoConnect || !wsUrl) return;
      connect(wsUrl);
      return () => disconnect();
    }, [autoConnect, wsUrl]);

    useEffect(() => {
      if (!terminalRef.current) return;
      terminalRef.current.options.theme = theme;
    }, [theme]);

    return (
      <div
        className={classNames(className)}
        ref={viewportRef}
        style={{ width: '100%', height: '100%' }}
      />
    );
  },
);

export default EmbeddedConsoleTerminal;
