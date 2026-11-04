import type { HostThemeSnapshot } from '@/types/interfaces/hostBridge';
import type { Graph } from '@antv/x6';
import type * as Monaco from 'monaco-editor';
import { getActiveThemeSnapshot } from './activeTheme';

const monacoSignatures = new WeakMap<object, string>();
/** 只更新 X6 绘制层；不写 cell/model，避免主题切换进入撤销历史或触发自动保存。 */
export function applyWorkflowAppearance(
  graph: Pick<Graph, 'drawBackground' | 'drawGrid'>,
  snapshot = getActiveThemeSnapshot(),
) {
  if (!snapshot) return;
  graph.drawBackground({ color: snapshot.tokens['app.bg'] });
  graph.drawGrid({
    type: 'dot',
    args: { color: snapshot.tokens['border.strong'], thickness: 1 },
  });
}

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
      // G2 的暗色默认主题会再乘 .45 的 opacity；Token 已是最终可读颜色。
      labelOpacity: 1,
      titleFill: snapshot.tokens['text.primary'],
      titleOpacity: 1,
      lineStroke: snapshot.tokens['border.default'],
      lineStrokeOpacity: 1,
      tickStroke: snapshot.tokens['border.default'],
      tickOpacity: 1,
      gridStroke: snapshot.tokens['border.default'],
      gridStrokeOpacity: 1,
    },
    legendCategory: {
      itemLabelFill: snapshot.tokens['text.primary'],
      itemLabelFillOpacity: 1,
    },
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
