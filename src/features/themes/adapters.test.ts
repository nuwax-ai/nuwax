import { getConsoleTerminalTheme } from '@/components/business-component/ConversationBottomConsole/terminalTheme';
import { describe, expect, it, vi } from 'vitest';
import {
  applyMonacoTheme,
  mermaidAppearance,
  monacoFontOptions,
} from './adapters';
import { officialThemePackage, resolveThemePackage } from './core';

describe('independent renderer appearance', () => {
  it('redefines an existing Monaco theme after palette edits without replacing an editor or model', () => {
    const monaco = {
      editor: { defineTheme: vi.fn(), setTheme: vi.fn() },
    } as unknown as typeof import('monaco-editor');
    const snapshot = resolveThemePackage(
      officialThemePackage,
      'dark',
      false,
      1,
    );
    expect(applyMonacoTheme(monaco, snapshot)).toBe('nuwax-dark');
    applyMonacoTheme(monaco, snapshot);
    expect(monaco.editor.defineTheme).toHaveBeenCalledTimes(1);
    applyMonacoTheme(monaco, {
      ...snapshot,
      tokens: { ...snapshot.tokens, 'editor.bg': '#282833' },
    });
    expect(monaco.editor.defineTheme).toHaveBeenLastCalledWith(
      'nuwax-dark',
      expect.objectContaining({
        colors: expect.objectContaining({ 'editor.background': '#282833' }),
      }),
    );
    expect(monaco.editor.setTheme).toHaveBeenCalledWith('nuwax-dark');
  });
  it('uses the same package colors for diagram labels and terminal canvas', () => {
    const snapshot = resolveThemePackage(
      officialThemePackage,
      'dark',
      false,
      1,
    );
    const diagram = mermaidAppearance(snapshot);
    expect(diagram.themeVariables.darkMode).toBe(true);
    expect(monacoFontOptions(snapshot)).toEqual({
      fontFamily: snapshot.tokens['font.code'],
      fontSize: parseFloat(snapshot.tokens['font.size']),
    });
    expect(diagram.themeVariables.primaryTextColor).toBe(
      snapshot.tokens['text.primary'],
    );
    expect(getConsoleTerminalTheme('dark', snapshot)).toMatchObject({
      background: snapshot.tokens['terminal.bg'],
      foreground: snapshot.tokens['terminal.text'],
    });
  });
});
