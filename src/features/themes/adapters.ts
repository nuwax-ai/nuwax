import type { HostThemeSnapshot } from '@/types/interfaces/hostBridge';
import type * as Monaco from 'monaco-editor';
import { getActiveThemeSnapshot } from './activeTheme';

const monacoSignatures = new WeakMap<object, string>();
/** 更新调色板，不创建或重置 editor/model/selection。 */
export function applyMonacoTheme(
  monaco: typeof Monaco,
  snapshot = getActiveThemeSnapshot(),
): string | undefined {
  if (!snapshot) return undefined;
  const id = `nuwax-${snapshot.mode}`;
  const tokens = snapshot.tokens;
  const signature = JSON.stringify([id, tokens]);
  if (monacoSignatures.get(monaco) !== signature) {
    monaco.editor.defineTheme(id, {
      base: snapshot.mode === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': String(tokens['editor.bg']),
        'editor.foreground': String(tokens['editor.text']),
        'editor.lineHighlightBackground': String(tokens['surface.bg']),
        'editor.selectionBackground': String(tokens['selected.bg']),
        'editorCursor.foreground': String(tokens.primary),
        'editorLineNumber.foreground': String(tokens['text.secondary']),
        'editorWidget.background': String(tokens['elevated.bg']),
        'editorWidget.border': String(tokens['border.default']),
      },
    });
    monacoSignatures.set(monaco, signature);
  }
  monaco.editor.setTheme(id);
  return id;
}

export function mermaidAppearance(snapshot: HostThemeSnapshot) {
  const t = snapshot.tokens;
  return {
    theme: 'base' as const,
    themeVariables: {
      darkMode: snapshot.mode === 'dark',
      background: t['app.bg'],
      primaryColor: t['surface.bg'],
      primaryTextColor: t['text.primary'],
      primaryBorderColor: t['border.default'],
      secondaryColor: t['sidebar.bg'],
      tertiaryColor: t['elevated.bg'],
      lineColor: t['text.secondary'],
      textColor: t['text.primary'],
      edgeLabelBackground: t['app.bg'],
      fontFamily: t['font.family'],
    },
  };
}

/** G2 uses canvas/SVG colors rather than inheriting application CSS. */
export function plotAppearance(snapshot: HostThemeSnapshot) {
  return {
    type: snapshot.mode,
    view: { viewFill: snapshot.tokens['surface.bg'] },
    axis: {
      labelFill: snapshot.tokens['text.secondary'],
      titleFill: snapshot.tokens['text.primary'],
      lineStroke: snapshot.tokens['border.default'],
      gridStroke: snapshot.tokens['border.default'],
    },
    legendCategory: { itemLabelFill: snapshot.tokens['text.primary'] },
  };
}

export function monacoFontOptions(snapshot = getActiveThemeSnapshot()) {
  return snapshot
    ? {
        fontFamily: snapshot.tokens['font.code'],
        fontSize: parseFloat(snapshot.tokens['font.size']),
      }
    : {};
}
