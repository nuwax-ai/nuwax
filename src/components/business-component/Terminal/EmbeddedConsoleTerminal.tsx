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
      [wireProtocol],
    );

    const connect = useCallback(
      (url?: string) => {
        const targetUrl = url || wsUrl;
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
          ws = wsSubprotocols
            ? new WebSocket(targetUrl, wsSubprotocols)
            : new WebSocket(targetUrl);
          ws.binaryType = 'arraybuffer';
          wsRef.current = ws;
        } catch (err) {
          console.error('[EmbeddedTerminal] WebSocket creation failed:', err);
          // 尝试重连
          if (
            reconnect.enabled !== false &&
            reconnectCountRef.current < (reconnect.maxRetries ?? 5) &&
            !isManualDisconnectRef.current
          ) {
            const delay =
              (reconnect.retryDelay ?? 2000) *
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
          // 清理可能残留的旧重连 timer
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          scheduleFit(
            () => fitAddonRef.current?.fit(),
            () => {
              syncBackendSize(ws, { sendTtydInit: true });
              // 刷掉 WS 早于 xterm 就绪时暂存的输出
              const pending = pendingWritesRef.current.splice(0);
              const term = terminalRef.current;
              if (term && pending.length > 0) {
                for (const chunk of pending) {
                  term.write(chunk);
                }
              }
              onConnect?.();
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
            // xterm 尚未就绪，暂存数据
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
          onDisconnect?.(event);

          if (
            reconnect.enabled !== false &&
            reconnectCountRef.current < (reconnect.maxRetries ?? 5) &&
            !isManualDisconnectRef.current
          ) {
            const delay =
              (reconnect.retryDelay ?? 2000) *
              Math.pow(2, reconnectCountRef.current);
            reconnectCountRef.current += 1;
            console.log(
              `[EmbeddedTerminal] Reconnecting in ${delay}ms (attempt ${
                reconnectCountRef.current
              }/${reconnect.maxRetries ?? 5})`,
            );
            // 确保清理旧 timer
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
            }
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              connect(targetUrl);
            }, delay);
          } else if (
            !isManualDisconnectRef.current &&
            reconnectCountRef.current >= (reconnect.maxRetries ?? 5)
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
      [
        onConnect,
        onDisconnect,
        reconnect,
        syncBackendSize,
        wireProtocol,
        wsSubprotocols,
        wsUrl,
      ],
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
    }, [autoConnect, connect, disconnect, wsUrl]);

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
