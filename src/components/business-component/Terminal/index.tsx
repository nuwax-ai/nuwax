import {
  ClearOutlined,
  CloseOutlined,
  CodeOutlined,
  DownloadOutlined,
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  SearchOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Alert, Button, Input, Space, Spin, Tag, Tooltip } from 'antd';
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

import styles from './index.less';
import type {
  ConnectionStatus,
  ReconnectConfig,
  SearchOptions,
  TerminalTheme,
  XtermTerminalProps,
  XtermTerminalRef,
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

const isLightTheme = (theme: TerminalTheme = 'dark') => theme === 'light';

// ─── 组件实现 ────────────────────────────────────────────────────
const XtermTerminal = forwardRef<XtermTerminalRef, XtermTerminalProps>(
  (
    {
      wsUrl,
      autoConnect = false,
      reconnect,
      title,
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
    const [errorMessage, setErrorMessage] = useState('');
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchOptions, setSearchOptions] = useState<SearchOptions>({
      caseSensitive: false,
      wholeWord: false,
      regex: false,
    });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ─── Refs ────────────────────────────────────────────────
    const wrapperRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<import('@xterm/xterm').Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addonsRef = useRef<Map<string, any>>(new Map());
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const reconnectCountRef = useRef(0);
    const isManualDisconnectRef = useRef(false);

    // 回调 ref 化，避免闭包陈旧值
    const onConnectRef = useRef(onConnect);
    const onDisconnectRef = useRef(onDisconnect);
    const onErrorRef = useRef(onError);
    const onDataRef = useRef(onData);
    const onInputRef = useRef(onInput);

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
    const reconnectConfig: ReconnectConfig = useMemo(
      () => ({
        enabled: reconnect?.enabled ?? true,
        maxRetries: reconnect?.maxRetries ?? 5,
        retryDelay: reconnect?.retryDelay ?? 1000,
      }),
      [reconnect],
    );

    // ─── 加载 Addons ─────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadAddons = useCallback(
      async (terminal: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const addons = new Map<string, any>();

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

        // 初始 fit
        try {
          addons.get('fit')?.fit();
        } catch {
          // fit 可能在 DOM 未完全就绪时失败
        }

        // 监听用户输入 → 发送到 WebSocket + 触发回调
        term.onData((data: string) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
          }
          onInputRef.current?.(data);
        });

        // 终端 resize → 通知后端
        term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
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
      };

      initTerminal();

      // 清理
      return () => {
        disposed = true;

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
            addonsRef.current.get('fit')?.fit();
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
        addonsRef.current.get('fit')?.fit();
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
          const ws = new WebSocket(targetUrl);
          ws.binaryType = 'arraybuffer';
          wsRef.current = ws;

          ws.onopen = () => {
            setStatus('connected');
            reconnectCountRef.current = 0;
            onConnectRef.current?.();
            terminalLogger.log('WebSocket connected:', targetUrl);

            // 连接后立即发送终端尺寸
            if (terminalRef.current) {
              ws.send(
                JSON.stringify({
                  type: 'resize',
                  cols: terminalRef.current.cols,
                  rows: terminalRef.current.rows,
                }),
              );
            }
          };

          ws.onmessage = (event: MessageEvent) => {
            const data =
              typeof event.data === 'string'
                ? event.data
                : new TextDecoder().decode(event.data);
            terminalRef.current?.write(data);
            onDataRef.current?.(data);
          };

          ws.onclose = (event: CloseEvent) => {
            terminalLogger.log('WebSocket closed:', event.code, event.reason);
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
      [wsUrl, reconnectConfig],
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

      setStatus('disconnected');

      // 在微任务后重置标志，以允许 close 事件处理器执行
      setTimeout(() => {
        isManualDisconnectRef.current = false;
      }, 0);
    }, []);

    // ─── wsUrl 变化时重连 ─────────────────────────────────────
    const prevWsUrlRef = useRef(wsUrl);
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

    // ─── 自动连接 ────────────────────────────────────────────
    useEffect(() => {
      if (autoConnect && wsUrl && status === 'disconnected') {
        connect();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect]);

    // ─── 搜索功能 ────────────────────────────────────────────
    const handleFindNext = useCallback(() => {
      if (!searchTerm) return;
      const searchAddon = addonsRef.current.get('search');
      if (!searchAddon) return;
      searchAddon.findNext(searchTerm, {
        caseSensitive: searchOptions.caseSensitive,
        wholeWord: searchOptions.wholeWord,
        regex: searchOptions.regex,
        incremental: true,
      });
    }, [searchTerm, searchOptions]);

    const handleFindPrevious = useCallback(() => {
      if (!searchTerm) return;
      const searchAddon = addonsRef.current.get('search');
      if (!searchAddon) return;
      searchAddon.findPrevious(searchTerm, {
        caseSensitive: searchOptions.caseSensitive,
        wholeWord: searchOptions.wholeWord,
        regex: searchOptions.regex,
      });
    }, [searchTerm, searchOptions]);

    const toggleSearchOption = useCallback((key: keyof SearchOptions) => {
      setSearchOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

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

      const content = serializeAddon.serialize();
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

    // ─── 清屏 ────────────────────────────────────────────────
    const handleClear = useCallback(() => {
      terminalRef.current?.clear();
    }, []);

    // ─── 状态标签渲染 ────────────────────────────────────────
    const renderStatusTag = useCallback(() => {
      switch (status) {
        case 'connected':
          return <Tag color="#52c41a">Connected</Tag>;
        case 'connecting':
          return <Tag color="#1890ff">Connecting</Tag>;
        case 'disconnected':
          return <Tag>Disconnected</Tag>;
        case 'error':
          return <Tag color="#ff4d4f">Error</Tag>;
        default:
          return null;
      }
    }, [status]);

    // ─── 命令式 API ──────────────────────────────────────────
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
        search: () => setSearchVisible(true),
        findNext: (term: string, options?: SearchOptions) => {
          const sa = addonsRef.current.get('search');
          return sa ? sa.findNext(term, options) : false;
        },
        findPrevious: (term: string, options?: SearchOptions) => {
          const sa = addonsRef.current.get('search');
          return sa ? sa.findPrevious(term, options) : false;
        },
        closeSearch: () => setSearchVisible(false),
        getTerminal: () => terminalRef.current,
        getStatus: () => status,
        downloadBuffer: (filename?: string) => handleDownloadBuffer(filename),
      }),
      [connect, disconnect, status, handleDownloadBuffer],
    );

    // ─── 渲染 ────────────────────────────────────────────────
    const isLight = isLightTheme(theme);

    return (
      <div
        ref={wrapperRef}
        className={classNames(
          styles.terminalWrapper,
          { [styles.lightTheme]: isLight },
          className,
        )}
        style={style}
      >
        {/* 工具栏 */}
        <div className={styles.controlsBar}>
          <div className={styles.statusArea}>
            <CodeOutlined className={styles.terminalIcon} />
            {title && <span className={styles.title}>{title}</span>}
            {renderStatusTag()}
          </div>

          <Space size={4} className={styles.actionsArea}>
            <Tooltip title="Search (Ctrl+Shift+F)">
              <Button
                type="text"
                size="small"
                icon={<SearchOutlined />}
                onClick={() => setSearchVisible((v) => !v)}
              />
            </Tooltip>
            <Tooltip title="Clear screen">
              <Button
                type="text"
                size="small"
                icon={<ClearOutlined />}
                onClick={handleClear}
              />
            </Tooltip>
            <Tooltip title="Download buffer">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadBuffer()}
              />
            </Tooltip>
            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              <Button
                type="text"
                size="small"
                icon={
                  isFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </Space>
        </div>

        {/* 搜索面板 */}
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
                  setSearchVisible(false);
                  try {
                    addonsRef.current.get('search')?.clearDecorations?.();
                  } catch {
                    /* ignore */
                  }
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
                onClick={() => {
                  setSearchVisible(false);
                  try {
                    addonsRef.current.get('search')?.clearDecorations?.();
                  } catch {
                    /* ignore */
                  }
                }}
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
