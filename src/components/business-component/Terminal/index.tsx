import {
  CloseOutlined,
  CodeOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Alert, Button, Input, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

// xterm.js 核心样式
import '@xterm/xterm/css/xterm.css';

import { createLogger } from '@/utils/logger';

import type { Terminal } from '@xterm/xterm';
import styles from './index.less';
import {
  DEFAULT_TERMINAL_SEARCH_OPTIONS,
  DEFAULT_TTYD_FLOW_CONTROL,
  type ConnectionStatus,
  type ReconnectConfig,
  type SearchOptions,
  type TerminalAddonsMap,
  type TerminalOnConnect,
  type TerminalOnData,
  type TerminalOnDisconnect,
  type TerminalOnError,
  type TerminalOnInput,
  type TerminalSearchOptionsState,
  type TerminalTheme,
  type XtermTerminalProps,
  type XtermTerminalRef,
} from './type';

const terminalLogger = createLogger('[XtermTerminal]');

// ─── 内置主题预设 ────────────────────────────────────────────────
const DARK_THEME = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#d4d4d4',
  cursorAccent: '#1e1e1e',
  selectionBackground: '#264f78',
  selectionForeground: '#d4d4d4',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#ffffff',
};

const LIGHT_THEME = {
  background: '#ffffff',
  foreground: '#383a42',
  cursor: '#383a42',
  cursorAccent: '#ffffff',
  selectionBackground: '#add6ff',
  selectionForeground: '#383a42',
  black: '#383a42',
  red: '#e45649',
  green: '#50a14f',
  yellow: '#c18401',
  blue: '#4078f2',
  magenta: '#a626a4',
  cyan: '#0184bc',
  white: '#fafafa',
  brightBlack: '#4f525e',
  brightRed: '#e06c75',
  brightGreen: '#98c379',
  brightYellow: '#e5c07b',
  brightBlue: '#61afef',
  brightMagenta: '#c678dd',
  brightCyan: '#56b6c2',
  brightWhite: '#ffffff',
};

const resolveTheme = (theme: TerminalTheme = 'dark') => {
  if (theme === 'dark') return DARK_THEME;
  if (theme === 'light') return LIGHT_THEME;
  return theme;
};

/** 根据背景色亮度判断是否为浅色主题（含自定义 ITheme） */
const isLightTerminalTheme = (theme: TerminalTheme = 'dark'): boolean => {
  if (theme === 'light') return true;
  if (theme === 'dark') return false;
  const bg = theme.background;
  if (!bg || typeof bg !== 'string') return false;
  const hex = bg.replace('#', '').slice(0, 6);
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return false;
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
};

/** 延迟执行 fit，确保容器已完成布局 */
const scheduleTerminalFit = (
  getFit: () => (() => void) | undefined,
  afterFit?: () => void,
) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        getFit()?.();
      } catch {
        /* fit 可能在容器尺寸为 0 时失败 */
      }
      afterFit?.();
    });
  });
};

/** 保证终端有效行列（fit 失败时的兜底） */
const ensureTerminalDimensions = (
  term: import('@xterm/xterm').Terminal,
): { cols: number; rows: number } => {
  let cols = term.cols;
  let rows = term.rows;
  if (cols <= 0 || rows <= 0) {
    cols = 80;
    rows = 24;
    term.resize(cols, rows);
  }
  return { cols, rows };
};

/**
 * ttyd WebSocket 帧首字节（与官方 Command 枚举一致）
 *
 * 服务端 → 客户端：'0' OUTPUT | '1' SET_WINDOW_TITLE | '2' SET_PREFERENCES
 * 客户端 → 服务端：'0' INPUT | '1' RESIZE | '2' PAUSE | '3' RESUME
 */
const TTYD_CMD_INPUT = 0x30;
const TTYD_CMD_OUTPUT = 0x30;
/** 客户端 → 服务端：pty_pause()，在 xterm 渲染积压时暂停下行 */
const TTYD_CMD_PAUSE = 0x32;
/** 客户端 → 服务端：pty_resume()，渲染队列消化后恢复下行 */
const TTYD_CMD_RESUME = 0x33;

/** 向 ttyd 发送单字节流控命令（PAUSE / RESUME），无 payload */
const sendTtydFlowControl = (ws: WebSocket | null | undefined, cmd: number) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(new Uint8Array([cmd]));
  }
};

/** ttyd 首包：以 '{' 开头的 JSON，触发 fork shell */
const encodeTtydInit = (cols: number, rows: number): string =>
  JSON.stringify({ columns: cols, rows });

/** ttyd：'0' + 原始输入字节 */
const encodeTtydInput = (data: string): Uint8Array => {
  const bytes = new TextEncoder().encode(data);
  const out = new Uint8Array(bytes.length + 1);
  out[0] = TTYD_CMD_INPUT;
  out.set(bytes, 1);
  return out;
};

/** ttyd：'1' + { columns, rows } */
const encodeTtydResize = (cols: number, rows: number): string =>
  '1' + JSON.stringify({ columns: cols, rows });

/** 解析 ttyd 二进制下行帧，仅提取 OUTPUT(0x30) 写入 xterm */
const decodeTtydMessage = (raw: ArrayBuffer | string): string => {
  const buf =
    typeof raw === 'string'
      ? new TextEncoder().encode(raw)
      : new Uint8Array(raw);
  if (buf.length === 0 || buf[0] !== TTYD_CMD_OUTPUT) {
    return '';
  }
  return new TextDecoder().decode(buf.subarray(1));
};

// ─── 组件实现 ────────────────────────────────────────────────────
const XtermTerminal = forwardRef<XtermTerminalRef, XtermTerminalProps>(
  (
    {
      wsUrl,
      wsSubprotocols,
      wireProtocol = 'plain',
      ttydFlowControl,
      autoConnect = false,
      reconnect,
      readOnly = false,
      theme = 'dark',
      fontSize = 14,
      fontFamily,
      cursorBlink = true,
      lineHeight = 1.2,
      scrollback = 5000,
      ligatures = false,
      enableWebgl = true,
      enableImages = false,
      embedded = false,
      className,
      style,
      onConnect,
      onDisconnect,
      onError,
      onData,
      onInput,
    },
    ref,
  ) => {
    // ─── 状态 ────────────────────────────────────────────────
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [searchVisible, setSearchVisible] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchOptions, setSearchOptions] =
      useState<TerminalSearchOptionsState>(DEFAULT_TERMINAL_SEARCH_OPTIONS);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    /** xterm 是否已完成 open + addon 加载 */
    const [terminalReady, setTerminalReady] = useState<boolean>(false);

    // ─── Refs ────────────────────────────────────────────────
    const wrapperRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const addonsRef = useRef<TerminalAddonsMap>(new Map());
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const reconnectCountRef = useRef<number>(0);
    const isManualDisconnectRef = useRef<boolean>(false);
    /** WS 早于 xterm 就绪时暂存待写入内容 */
    const pendingWritesRef = useRef<string[]>([]);
    const ttydInitSentRef = useRef<boolean>(false);

    // ─── ttyd 下行背压（PAUSE / RESUME）────────────────────────
    /** 自上次重置以来写入 xterm 的累计字节数，用于触发「带回调」写入 */
    const ttydWrittenRef = useRef(0);
    /** 尚未执行完的 term.write 回调数量，反映前端渲染队列深度 */
    const ttydPendingRef = useRef(0);

    /** 合并 props 与 DEFAULT_TTYD_FLOW_CONTROL，与 ttyd 官方 html 客户端默认值一致 */
    const ttydFlowControlConfig = useMemo(
      () => ({
        enabled: ttydFlowControl?.enabled !== false,
        limit: ttydFlowControl?.limit ?? DEFAULT_TTYD_FLOW_CONTROL.limit,
        highWater:
          ttydFlowControl?.highWater ?? DEFAULT_TTYD_FLOW_CONTROL.highWater,
        lowWater:
          ttydFlowControl?.lowWater ?? DEFAULT_TTYD_FLOW_CONTROL.lowWater,
      }),
      [ttydFlowControl],
    );

    // 回调 ref 化，避免闭包陈旧值（须在 handleWsOpen 之前定义）
    const onConnectRef = useRef<TerminalOnConnect | undefined>(onConnect);
    const onDisconnectRef = useRef<TerminalOnDisconnect | undefined>(
      onDisconnect,
    );
    const onErrorRef = useRef<TerminalOnError | undefined>(onError);
    const onDataRef = useRef<TerminalOnData | undefined>(onData);
    const onInputRef = useRef<TerminalOnInput | undefined>(onInput);

    /** 重置本地背压计数（重连 / 断开后使用） */
    const resetTtydFlowControlState = useCallback(() => {
      ttydWrittenRef.current = 0;
      ttydPendingRef.current = 0;
    }, []);

    /**
     * 释放 ttyd 服务端 pty：先发 RESUME 再清零计数。
     * 防止客户端断开后服务端仍停留在 pause 状态。
     */
    const releaseTtydFlowControl = useCallback(() => {
      if (wireProtocol === 'ttyd') {
        sendTtydFlowControl(wsRef.current, TTYD_CMD_RESUME);
      }
      resetTtydFlowControlState();
    }, [wireProtocol, resetTtydFlowControlState]);

    /**
     * ttyd 下行写入：按官方 writeData 做背压。
     *
     * 1. 累计写入未超 limit：同步 write，低开销。
     * 2. 超过 limit：改用 write(data, callback) 统计 pending。
     * 3. pending > highWater：向服务端发 PAUSE，减缓 WebSocket 下行。
     * 4. 某次回调后 pending < lowWater：发 RESUME，恢复 pty 输出。
     *
     * 适用于 cat 大文件、npm install 等海量终端输出，避免 xterm/浏览器内存溢出。
     */
    const writeTtydOutputWithFlowControl = useCallback(
      (data: string) => {
        if (!data) return;
        const term = terminalRef.current;
        if (!term) {
          pendingWritesRef.current.push(data);
          return;
        }

        const { enabled, limit, highWater, lowWater } = ttydFlowControlConfig;
        if (!enabled) {
          term.write(data);
          return;
        }

        const ws = wsRef.current;
        ttydWrittenRef.current += data.length;

        if (ttydWrittenRef.current > limit) {
          // 带回调写入：pending 反映 xterm 尚未渲染完的块数
          term.write(data, () => {
            ttydPendingRef.current = Math.max(ttydPendingRef.current - 1, 0);
            if (ttydPendingRef.current < lowWater) {
              sendTtydFlowControl(ws, TTYD_CMD_RESUME);
            }
          });
          ttydPendingRef.current += 1;
          ttydWrittenRef.current = 0;
          if (ttydPendingRef.current > highWater) {
            sendTtydFlowControl(ws, TTYD_CMD_PAUSE);
          }
        } else {
          term.write(data);
        }
      },
      [ttydFlowControlConfig],
    );

    /** WS 下行 / 外部写入统一入口；ttyd 协议走背压写入 */
    const writeToTerminal = useCallback(
      (data: string) => {
        if (!data) return;
        if (wireProtocol === 'ttyd') {
          writeTtydOutputWithFlowControl(data);
          return;
        }
        const term = terminalRef.current;
        if (!term) {
          pendingWritesRef.current.push(data);
          return;
        }
        term.write(data);
      },
      [wireProtocol, writeTtydOutputWithFlowControl],
    );

    /** xterm 就绪后刷掉 WS 早到的输出；ttyd 须走同一背压路径 */
    const flushPendingWrites = useCallback(() => {
      const term = terminalRef.current;
      if (!term || pendingWritesRef.current.length === 0) return;
      const chunks = pendingWritesRef.current.splice(0);
      for (const chunk of chunks) {
        if (wireProtocol === 'ttyd') {
          writeTtydOutputWithFlowControl(chunk);
        } else {
          term.write(chunk);
        }
      }
    }, [wireProtocol, writeTtydOutputWithFlowControl]);

    /** fit 后向后端同步尺寸；ttyd 首连发 JSON init，之后发 resize */
    const syncBackendTerminalSize = useCallback(
      (ws: WebSocket, options?: { sendTtydInit?: boolean }) => {
        const term = terminalRef.current;
        if (!term || ws.readyState !== WebSocket.OPEN) return;

        const { cols, rows } = ensureTerminalDimensions(term);

        if (wireProtocol === 'ttyd') {
          if (options?.sendTtydInit && !ttydInitSentRef.current) {
            ws.send(encodeTtydInit(cols, rows));
            ttydInitSentRef.current = true;
          } else if (ttydInitSentRef.current) {
            ws.send(encodeTtydResize(cols, rows));
          }
        } else {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      },
      [wireProtocol],
    );

    const handleWsOpen = useCallback(
      (ws: WebSocket) => {
        setStatus('connected');
        reconnectCountRef.current = 0;
        // 新连接重置背压计数，避免沿用上次的 pending
        resetTtydFlowControlState();
        terminalLogger.log('WebSocket connected');

        scheduleTerminalFit(
          () => addonsRef.current.get('fit')?.fit,
          () => {
            syncBackendTerminalSize(ws, { sendTtydInit: true });
            flushPendingWrites();
            onConnectRef.current?.();
          },
        );
      },
      [flushPendingWrites, resetTtydFlowControlState, syncBackendTerminalSize],
    );

    useEffect(() => {
      onConnectRef.current = onConnect;
    }, [onConnect]);
    useEffect(() => {
      onDisconnectRef.current = onDisconnect;
    }, [onDisconnect]);
    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);
    useEffect(() => {
      onDataRef.current = onData;
    }, [onData]);
    useEffect(() => {
      onInputRef.current = onInput;
    }, [onInput]);

    // 重连配置解构
    const reconnectConfig: Required<ReconnectConfig> = useMemo(
      () => ({
        enabled: reconnect?.enabled ?? true,
        maxRetries: reconnect?.maxRetries ?? 5,
        retryDelay: reconnect?.retryDelay ?? 1000,
      }),
      [reconnect],
    );

    // ─── 加载 Addons ─────────────────────────────────────────
    const loadAddons = useCallback(
      async (terminal: Terminal): Promise<TerminalAddonsMap> => {
        const addons: TerminalAddonsMap = new Map();

        // 1. FitAddon
        try {
          const { FitAddon } = await import('@xterm/addon-fit');
          const fitAddon = new FitAddon();
          terminal.loadAddon(fitAddon);
          addons.set('fit', fitAddon);
        } catch (e) {
          terminalLogger.warn('FitAddon failed to load:', e);
        }

        // 2. WebLinksAddon
        try {
          const { WebLinksAddon } = await import('@xterm/addon-web-links');
          const webLinksAddon = new WebLinksAddon();
          terminal.loadAddon(webLinksAddon);
          addons.set('webLinks', webLinksAddon);
        } catch (e) {
          terminalLogger.warn('WebLinksAddon failed to load:', e);
        }

        // 3. SearchAddon
        try {
          const { SearchAddon } = await import('@xterm/addon-search');
          const searchAddon = new SearchAddon();
          terminal.loadAddon(searchAddon);
          addons.set('search', searchAddon);
        } catch (e) {
          terminalLogger.warn('SearchAddon failed to load:', e);
        }

        // 4. Unicode11Addon
        try {
          const { Unicode11Addon } = await import('@xterm/addon-unicode11');
          const unicode11Addon = new Unicode11Addon();
          terminal.loadAddon(unicode11Addon);
          terminal.unicode.activeVersion = '11';
          addons.set('unicode11', unicode11Addon);
        } catch (e) {
          terminalLogger.warn('Unicode11Addon failed to load:', e);
        }

        // 5. SerializeAddon
        try {
          const { SerializeAddon } = await import('@xterm/addon-serialize');
          const serializeAddon = new SerializeAddon();
          terminal.loadAddon(serializeAddon);
          addons.set('serialize', serializeAddon);
        } catch (e) {
          terminalLogger.warn('SerializeAddon failed to load:', e);
        }

        // 6. ClipboardAddon
        try {
          const { ClipboardAddon } = await import('@xterm/addon-clipboard');
          const clipboardAddon = new ClipboardAddon();
          terminal.loadAddon(clipboardAddon);
          addons.set('clipboard', clipboardAddon);
        } catch (e) {
          terminalLogger.warn('ClipboardAddon failed to load:', e);
        }

        // 7. ProgressAddon
        try {
          const { ProgressAddon } = await import('@xterm/addon-progress');
          const progressAddon = new ProgressAddon();
          terminal.loadAddon(progressAddon);
          addons.set('progress', progressAddon);
        } catch (e) {
          terminalLogger.warn('ProgressAddon failed to load:', e);
        }

        // 8. WebglAddon (条件加载，带回退)
        if (enableWebgl) {
          try {
            const { WebglAddon } = await import('@xterm/addon-webgl');
            const webglAddon = new WebglAddon();
            webglAddon.onContextLoss(() => {
              webglAddon.dispose();
              addons.delete('webgl');
              terminalLogger.warn('WebGL context lost, falling back to canvas');
            });
            terminal.loadAddon(webglAddon);
            addons.set('webgl', webglAddon);
          } catch (e) {
            terminalLogger.warn(
              'WebGL addon failed to load, using canvas renderer:',
              e,
            );
          }
        }

        // 9. UnicodeGraphemesAddon (实验性)
        try {
          const { UnicodeGraphemesAddon } = await import(
            '@xterm/addon-unicode-graphemes'
          );
          const graphemesAddon = new UnicodeGraphemesAddon();
          terminal.loadAddon(graphemesAddon);
          addons.set('unicodeGraphemes', graphemesAddon);
        } catch (e) {
          terminalLogger.warn('UnicodeGraphemesAddon failed to load:', e);
        }

        // 10. ImageAddon (条件加载)
        if (enableImages) {
          try {
            const { ImageAddon } = await import('@xterm/addon-image');
            const imageAddon = new ImageAddon();
            terminal.loadAddon(imageAddon);
            addons.set('image', imageAddon);
          } catch (e) {
            terminalLogger.warn('ImageAddon failed to load:', e);
          }
        }

        // 11. LigaturesAddon (条件加载)
        if (ligatures) {
          try {
            const { LigaturesAddon } = await import('@xterm/addon-ligatures');
            const ligaturesAddon = new LigaturesAddon();
            terminal.loadAddon(ligaturesAddon);
            addons.set('ligatures', ligaturesAddon);
          } catch (e) {
            terminalLogger.warn('LigaturesAddon failed to load:', e);
          }
        }

        return addons;
      },
      [enableWebgl, enableImages, ligatures],
    );

    // ─── 初始化终端 ──────────────────────────────────────────
    useEffect(() => {
      if (!viewportRef.current) return;

      let disposed = false;

      const initTerminal = async () => {
        const { Terminal } = await import('@xterm/xterm');

        if (disposed || !viewportRef.current) return;

        const resolvedTheme = resolveTheme(theme);

        const term = new Terminal({
          cursorBlink,
          fontSize,
          fontFamily:
            fontFamily ||
            "'JetBrains Mono', monospace, 'Fira Code', Consolas, 'Courier New'",
          lineHeight,
          scrollback,
          theme: resolvedTheme,
          cursorStyle: 'block',
          allowProposedApi: true,
          disableStdin: readOnly,
        });

        terminalRef.current = term;

        // 加载 addons
        const addons = await loadAddons(term);
        if (disposed) {
          term.dispose();
          return;
        }
        addonsRef.current = addons;

        // 挂载到 DOM
        term.open(viewportRef.current);

        // 初始 fit（嵌入式面板需延迟等待父级布局）
        if (embedded) {
          scheduleTerminalFit(() => addons.get('fit')?.fit);
        } else {
          try {
            addons.get('fit')?.fit?.();
          } catch {
            /* fit 可能在 DOM 未完全就绪时失败 */
          }
        }

        // 监听用户输入 → 发送到 WebSocket + 触发回调
        term.onData((data: string) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            if (wireProtocol === 'ttyd') {
              wsRef.current.send(encodeTtydInput(data));
            } else {
              wsRef.current.send(data);
            }
          }
          onInputRef.current?.(data);
        });

        // 终端 resize → 通知后端
        term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            if (wireProtocol === 'ttyd') {
              wsRef.current.send(encodeTtydResize(cols, rows));
            } else {
              wsRef.current.send(
                JSON.stringify({ type: 'resize', cols, rows }),
              );
            }
          }
        });

        // 自定义键盘事件处理：Ctrl+Shift+F 打开搜索
        term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
          if (
            (event.ctrlKey || event.metaKey) &&
            event.shiftKey &&
            event.key === 'f'
          ) {
            event.preventDefault();
            setSearchVisible((prev) => !prev);
            return false;
          }
          return true;
        });

        terminalLogger.log('Terminal initialized');
        setTerminalReady(true);

        // 若 WS 已先连上（竞态），补发 ttyd init 并刷新缓冲
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          scheduleTerminalFit(
            () => addons.get('fit')?.fit,
            () => {
              syncBackendTerminalSize(wsRef.current!, { sendTtydInit: true });
              flushPendingWrites();
            },
          );
        }
      };

      initTerminal();

      // 清理
      return () => {
        disposed = true;
        setTerminalReady(false);
        pendingWritesRef.current = [];
        ttydInitSentRef.current = false;
        // 卸载时释放 ttyd 背压，避免服务端 pty 残留 pause
        releaseTtydFlowControl();

        // 关闭 WebSocket
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }

        // 清除重连定时器
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }

        // 释放 addons
        addonsRef.current.forEach((addon) => {
          try {
            addon.dispose?.();
          } catch {
            // ignore
          }
        });
        addonsRef.current.clear();

        // 释放终端
        if (terminalRef.current) {
          try {
            terminalRef.current.dispose();
          } catch {
            // ignore
          }
          terminalRef.current = null;
        }

        terminalLogger.log('Terminal disposed');
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── ResizeObserver → fitAddon.fit() ─────────────────────
    useEffect(() => {
      if (!viewportRef.current) return;

      let resizeTimer: ReturnType<typeof setTimeout> | null = null;

      const observer = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          try {
            addonsRef.current.get('fit')?.fit?.();
          } catch {
            // fit 可能在终端未就绪时抛出
          }
        }, 50);
      });

      observer.observe(viewportRef.current);

      return () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        observer.disconnect();
      };
    }, []);

    // ─── 全屏变化监听 ────────────────────────────────────────
    useEffect(() => {
      const handleChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleChange);
      };
    }, []);

    // ─── Props 变化同步 → 终端配置 ────────────────────────────
    useEffect(() => {
      if (!terminalRef.current) return;
      const resolved = resolveTheme(theme);
      terminalRef.current.options.theme = resolved;

      // 同步背景色
      if (wrapperRef.current) {
        wrapperRef.current.style.backgroundColor =
          resolved.background || '#1e1e1e';
      }
    }, [theme]);

    useEffect(() => {
      if (!terminalRef.current) return;
      terminalRef.current.options.fontSize = fontSize;
      try {
        addonsRef.current.get('fit')?.fit?.();
      } catch {
        /* ignore */
      }
    }, [fontSize]);

    useEffect(() => {
      if (!terminalRef.current) return;
      if (fontFamily) {
        terminalRef.current.options.fontFamily = fontFamily;
      }
    }, [fontFamily]);

    useEffect(() => {
      if (!terminalRef.current) return;
      terminalRef.current.options.cursorBlink = cursorBlink;
    }, [cursorBlink]);

    useEffect(() => {
      if (!terminalRef.current) return;
      terminalRef.current.options.disableStdin = readOnly;
    }, [readOnly]);

    // ─── WebSocket 连接管理 ──────────────────────────────────
    const connect = useCallback(
      (url?: string) => {
        const targetUrl = url || wsUrl;
        if (!targetUrl) {
          setStatus('error');
          setErrorMessage('No WebSocket URL provided');
          return;
        }

        // 防止重复连接
        if (
          wsRef.current?.readyState === WebSocket.OPEN ||
          wsRef.current?.readyState === WebSocket.CONNECTING
        ) {
          return;
        }

        setStatus('connecting');
        setErrorMessage('');
        isManualDisconnectRef.current = false;

        try {
          const ws = wsSubprotocols
            ? new WebSocket(targetUrl, wsSubprotocols)
            : new WebSocket(targetUrl);
          ws.binaryType = 'arraybuffer';
          wsRef.current = ws;

          ws.onopen = () => {
            handleWsOpen(ws);
          };

          ws.onmessage = (event: MessageEvent) => {
            // ttyd：解析 OUTPUT 帧；写入时 wireProtocol=ttyd 会自动 PAUSE/RESUME
            const data =
              wireProtocol === 'ttyd'
                ? decodeTtydMessage(event.data)
                : typeof event.data === 'string'
                ? event.data
                : new TextDecoder().decode(event.data);
            writeToTerminal(data);
            onDataRef.current?.(data);
          };

          ws.onclose = (event: CloseEvent) => {
            terminalLogger.log('WebSocket closed:', event.code, event.reason);
            ttydInitSentRef.current = false;
            // 连接关闭时尽量 RESUME，避免 ttyd 服务端 pty 挂起
            releaseTtydFlowControl();
            setStatus('disconnected');
            onDisconnectRef.current?.(event);

            // 自动重连
            if (
              reconnectConfig.enabled &&
              reconnectCountRef.current < reconnectConfig.maxRetries &&
              !isManualDisconnectRef.current
            ) {
              const delay =
                reconnectConfig.retryDelay *
                Math.pow(2, reconnectCountRef.current);
              reconnectCountRef.current += 1;
              terminalLogger.log(
                `Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current}/${reconnectConfig.maxRetries})`,
              );
              reconnectTimerRef.current = setTimeout(() => {
                connect(targetUrl);
              }, delay);
            } else if (
              !isManualDisconnectRef.current &&
              reconnectCountRef.current >= reconnectConfig.maxRetries
            ) {
              setStatus('error');
              setErrorMessage(
                `Connection lost. Max retries (${reconnectConfig.maxRetries}) reached.`,
              );
            }
          };

          ws.onerror = () => {
            const errMsg = 'WebSocket connection error';
            terminalLogger.error(errMsg);
            setStatus('error');
            setErrorMessage(errMsg);
            onErrorRef.current?.(new Error(errMsg));
          };
        } catch (err) {
          setStatus('error');
          setErrorMessage(String(err));
          onErrorRef.current?.(
            err instanceof Error ? err : new Error(String(err)),
          );
        }
      },
      [
        wsUrl,
        wsSubprotocols,
        wireProtocol,
        reconnectConfig,
        handleWsOpen,
        writeToTerminal,
        releaseTtydFlowControl,
      ],
    );

    /** 嵌入式面板：布局稳定后再次 fit 并同步 ttyd 尺寸 */
    useEffect(() => {
      if (!embedded || status !== 'connected' || !terminalReady) return;
      const timer = window.setTimeout(() => {
        scheduleTerminalFit(
          () => addonsRef.current.get('fit')?.fit,
          () => {
            const ws = wsRef.current;
            if (ws?.readyState === WebSocket.OPEN) {
              syncBackendTerminalSize(ws);
            }
            flushPendingWrites();
          },
        );
      }, 200);
      return () => window.clearTimeout(timer);
    }, [
      embedded,
      status,
      terminalReady,
      flushPendingWrites,
      syncBackendTerminalSize,
    ]);

    const disconnect = useCallback(() => {
      isManualDisconnectRef.current = true;
      ttydInitSentRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // 主动断开前先 RESUME，再 close
      releaseTtydFlowControl();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      setStatus('disconnected');

      // 在微任务后重置标志，以允许 close 事件处理器执行
      setTimeout(() => {
        isManualDisconnectRef.current = false;
      }, 0);
    }, [releaseTtydFlowControl]);

    // ─── wsUrl 变化时重连 ─────────────────────────────────────
    const prevWsUrlRef = useRef<string | undefined>(wsUrl);
    useEffect(() => {
      if (
        wsUrl &&
        wsUrl !== prevWsUrlRef.current &&
        (status === 'connected' || status === 'connecting')
      ) {
        disconnect();
        connect(wsUrl);
      }
      prevWsUrlRef.current = wsUrl;
    }, [wsUrl, status, connect, disconnect]);

    // ─── 自动连接（须等 xterm 就绪，避免首包输出丢失）────────────────
    useEffect(() => {
      if (autoConnect && wsUrl && terminalReady && status === 'disconnected') {
        connect();
      }
    }, [autoConnect, wsUrl, terminalReady, status, connect]);

    // ─── 搜索功能 ────────────────────────────────────────────
    const handleFindNext = useCallback(() => {
      if (!searchTerm) return;
      const findNext = addonsRef.current.get('search')?.findNext;
      if (!findNext) return;
      findNext(searchTerm, {
        caseSensitive: searchOptions.caseSensitive,
        wholeWord: searchOptions.wholeWord,
        regex: searchOptions.regex,
        incremental: true,
      });
    }, [searchTerm, searchOptions]);

    const handleFindPrevious = useCallback(() => {
      if (!searchTerm) return;
      const findPrevious = addonsRef.current.get('search')?.findPrevious;
      if (!findPrevious) return;
      findPrevious(searchTerm, {
        caseSensitive: searchOptions.caseSensitive,
        wholeWord: searchOptions.wholeWord,
        regex: searchOptions.regex,
      });
    }, [searchTerm, searchOptions]);

    const toggleSearchOption = useCallback(
      (key: keyof TerminalSearchOptionsState) => {
        setSearchOptions((prev) => ({ ...prev, [key]: !prev[key] }));
      },
      [],
    );

    // 搜索项变化时自动搜索
    useEffect(() => {
      if (searchVisible && searchTerm) {
        handleFindNext();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchOptions, searchVisible]);

    // ─── 下载缓冲区 ──────────────────────────────────────────
    const handleDownloadBuffer = useCallback((filename?: string) => {
      const serializeAddon = addonsRef.current.get('serialize');
      if (!serializeAddon) return;

      const content = serializeAddon.serialize?.();
      if (!content) return;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `terminal-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, []);

    // ─── 全屏切换 ────────────────────────────────────────────
    const toggleFullscreen = useCallback(async () => {
      if (!wrapperRef.current) return;

      if (!document.fullscreenElement) {
        try {
          await wrapperRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          terminalLogger.warn('Fullscreen request failed:', err);
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }, []);

    const clearSearchDecorations = useCallback(() => {
      try {
        addonsRef.current.get('search')?.clearDecorations?.();
      } catch {
        /* ignore */
      }
    }, []);

    const closeSearchPanel = useCallback(() => {
      setSearchVisible(false);
      clearSearchDecorations();
    }, [clearSearchDecorations]);

    const openSearchPanel = useCallback(() => {
      setSearchVisible(true);
    }, []);

    const toggleSearchPanel = useCallback(() => {
      setSearchVisible((v) => {
        if (v) {
          clearSearchDecorations();
        }
        return !v;
      });
    }, [clearSearchDecorations]);

    const runFindNext = useCallback(
      (term?: string, options?: SearchOptions) => {
        const query = term ?? searchTerm;
        if (!query) return false;
        const sa = addonsRef.current.get('search');
        if (!sa) return false;
        return (
          sa.findNext?.(query, {
            ...searchOptions,
            ...options,
            incremental: true,
          }) ?? false
        );
      },
      [searchTerm, searchOptions],
    );

    const runFindPrevious = useCallback(
      (term?: string, options?: SearchOptions) => {
        const query = term ?? searchTerm;
        if (!query) return false;
        const sa = addonsRef.current.get('search');
        if (!sa) return false;
        return (
          sa.findPrevious?.(query, { ...searchOptions, ...options }) ?? false
        );
      },
      [searchTerm, searchOptions],
    );

    // ─── 命令式 API（原工具栏能力均通过 ref 暴露）────────────────
    useImperativeHandle(
      ref,
      () => ({
        connect,
        disconnect,
        write: (data: string) => terminalRef.current?.write(data),
        writeln: (data: string) => terminalRef.current?.writeln(data),
        clear: () => terminalRef.current?.clear(),
        focus: () => terminalRef.current?.focus(),
        blur: () => terminalRef.current?.blur(),
        search: openSearchPanel,
        toggleSearch: toggleSearchPanel,
        closeSearch: closeSearchPanel,
        isSearchVisible: () => searchVisible,
        setSearchTerm,
        getSearchTerm: () => searchTerm,
        setSearchOptions: (options: Partial<SearchOptions>) => {
          setSearchOptions((prev) => ({ ...prev, ...options }));
        },
        findNext: runFindNext,
        findPrevious: runFindPrevious,
        clearSearchDecorations,
        toggleFullscreen,
        isFullscreen: () => isFullscreen,
        getTerminal: () => terminalRef.current,
        getStatus: () => status,
        downloadBuffer: (filename?: string) => handleDownloadBuffer(filename),
        /** 手动 PAUSE（一般无需调用，大量输出时组件会自动背压） */
        ttydPause: () => sendTtydFlowControl(wsRef.current, TTYD_CMD_PAUSE),
        /** 手动 RESUME */
        ttydResume: () => sendTtydFlowControl(wsRef.current, TTYD_CMD_RESUME),
      }),
      [
        connect,
        disconnect,
        status,
        searchVisible,
        searchTerm,
        handleDownloadBuffer,
        openSearchPanel,
        toggleSearchPanel,
        closeSearchPanel,
        clearSearchDecorations,
        runFindNext,
        runFindPrevious,
        toggleFullscreen,
        isFullscreen,
      ],
    );

    // ─── 渲染 ────────────────────────────────────────────────
    const isLight = isLightTerminalTheme(theme);

    return (
      <div
        ref={wrapperRef}
        className={classNames(
          styles.terminalWrapper,
          { [styles.lightTheme]: isLight, [styles.embedded]: embedded },
          className,
        )}
        style={style}
      >
        {/* 搜索面板（通过 ref.search / ref.toggleSearch 打开） */}
        {searchVisible && (
          <div className={styles.searchPanel}>
            <Input
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={handleFindNext}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  closeSearchPanel();
                }
                if (e.key === 'Enter' && e.shiftKey) {
                  e.preventDefault();
                  handleFindPrevious();
                }
              }}
              autoFocus
              className={styles.searchInput}
            />
            <Tooltip title="Previous (Shift+Enter)">
              <Button
                size="small"
                type="text"
                icon={<UpOutlined />}
                onClick={handleFindPrevious}
              />
            </Tooltip>
            <Tooltip title="Next (Enter)">
              <Button
                size="small"
                type="text"
                icon={<DownOutlined />}
                onClick={handleFindNext}
              />
            </Tooltip>
            <Tooltip title="Case sensitive">
              <Button
                size="small"
                type={searchOptions.caseSensitive ? 'primary' : 'text'}
                className={
                  searchOptions.caseSensitive
                    ? styles.searchOptionActive
                    : undefined
                }
                onClick={() => toggleSearchOption('caseSensitive')}
              >
                Aa
              </Button>
            </Tooltip>
            <Tooltip title="Whole word">
              <Button
                size="small"
                type={searchOptions.wholeWord ? 'primary' : 'text'}
                className={
                  searchOptions.wholeWord
                    ? styles.searchOptionActive
                    : undefined
                }
                onClick={() => toggleSearchOption('wholeWord')}
              >
                W
              </Button>
            </Tooltip>
            <Tooltip title="Regex">
              <Button
                size="small"
                type={searchOptions.regex ? 'primary' : 'text'}
                className={
                  searchOptions.regex ? styles.searchOptionActive : undefined
                }
                onClick={() => toggleSearchOption('regex')}
              >
                .*
              </Button>
            </Tooltip>
            <Tooltip title="Close (Esc)">
              <Button
                size="small"
                type="text"
                icon={<CloseOutlined />}
                onClick={closeSearchPanel}
              />
            </Tooltip>
          </div>
        )}

        {/* 终端视口 */}
        <div className={styles.terminalViewport} ref={viewportRef} />

        {/* 连接中遮罩 */}
        {status === 'connecting' && (
          <div className={styles.loadingOverlay}>
            <Spin size="large" />
            <span className={styles.loadingText}>Connecting...</span>
          </div>
        )}

        {/* 错误遮罩 */}
        {status === 'error' && (
          <div className={styles.errorOverlay}>
            <Alert
              message="Connection Error"
              description={
                errorMessage || 'Failed to connect to the terminal server.'
              }
              type="error"
              showIcon
              action={
                <Button size="small" type="primary" onClick={() => connect()}>
                  Retry
                </Button>
              }
            />
          </div>
        )}

        {/* 断开连接占位 */}
        {status === 'disconnected' && wsUrl && !autoConnect && (
          <div className={styles.placeholderOverlay}>
            <CodeOutlined className={styles.placeholderIcon} />
            <p className={styles.placeholderText}>Terminal is not connected</p>
            <Button type="primary" onClick={() => connect()}>
              Connect
            </Button>
          </div>
        )}
      </div>
    );
  },
);

export default XtermTerminal;
