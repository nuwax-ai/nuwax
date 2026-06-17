import '@xterm/xterm/css/xterm.css';

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
        if (!targetUrl) return;

        if (
          wsRef.current?.readyState === WebSocket.OPEN ||
          wsRef.current?.readyState === WebSocket.CONNECTING
        ) {
          return;
        }

        isManualDisconnectRef.current = false;

        const ws = wsSubprotocols
          ? new WebSocket(targetUrl, wsSubprotocols)
          : new WebSocket(targetUrl);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectCountRef.current = 0;
          scheduleFit(
            () => fitAddonRef.current?.fit(),
            () => {
              syncBackendSize(ws, { sendTtydInit: true });
              onConnect?.();
            },
          );
        };

        ws.onmessage = (event: MessageEvent) => {
          const term = terminalRef.current;
          if (!term) return;
          const data =
            wireProtocol === 'ttyd'
              ? decodeTtydMessage(event.data)
              : typeof event.data === 'string'
              ? event.data
              : new TextDecoder().decode(event.data);
          if (data) {
            term.write(data);
          }
        };

        ws.onclose = (event: CloseEvent) => {
          ttydInitSentRef.current = false;
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
            reconnectTimerRef.current = setTimeout(() => {
              connect(targetUrl);
            }, delay);
          }
        };

        ws.onerror = () => {
          /* onclose 会跟进 */
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
      wsRef.current?.close();
      wsRef.current = null;
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

      scheduleFit(() => fitAddon.fit());

      return () => {
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
