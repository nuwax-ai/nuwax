import type { ITheme } from '@xterm/xterm';

/** 底部控制台终端外观：深色 / 浅色 */
export type TerminalAppearanceMode = 'dark' | 'light';

/** 默认终端外观：浅色（白底） */
export const DEFAULT_TERMINAL_APPEARANCE: TerminalAppearanceMode = 'light';

/**
 * 深色终端（VS Code Dark+）
 * 黑底 + 高对比 ANSI，对应图一
 */
export const CONSOLE_TERMINAL_THEME_DARK: ITheme = {
  background: '#000000',
  foreground: '#d4d4d4',
  cursor: '#4ec9b0',
  cursorAccent: '#000000',
  selectionBackground: '#264f78',
  selectionForeground: '#ffffff',
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

/**
 * 浅色终端（IDE 白底风格）
 * 白底 + 深色正文，青绿提示符 / 蓝色路径，对应图二
 */
export const CONSOLE_TERMINAL_THEME_LIGHT: ITheme = {
  background: '#ffffff',
  foreground: '#1a1a1a',
  cursor: '#4078f2',
  cursorAccent: '#ffffff',
  selectionBackground: '#b4d7ff',
  selectionForeground: '#1a1a1a',
  black: '#1a1a1a',
  red: '#cd3131',
  green: '#098658',
  yellow: '#9a6f00',
  blue: '#0451a5',
  magenta: '#a626a4',
  cyan: '#0598bc',
  white: '#fafafa',
  brightBlack: '#6e7681',
  brightRed: '#e51400',
  brightGreen: '#0d9c6c',
  brightYellow: '#bf8803',
  brightBlue: '#0078d4',
  brightMagenta: '#a626a4',
  brightCyan: '#0598bc',
  brightWhite: '#ffffff',
};

/** @deprecated 使用 CONSOLE_TERMINAL_THEME_DARK */
export const CONSOLE_TERMINAL_THEME = CONSOLE_TERMINAL_THEME_DARK;

/** 等宽字体栈，与 IDE 终端保持一致 */
export const CONSOLE_TERMINAL_FONT_FAMILY =
  '"SF Mono", Menlo, Monaco, Consolas, "DejaVu Sans Mono", "Microsoft YaHei", monospace';

export const getConsoleTerminalTheme = (mode: TerminalAppearanceMode): ITheme =>
  mode === 'light' ? CONSOLE_TERMINAL_THEME_LIGHT : CONSOLE_TERMINAL_THEME_DARK;
