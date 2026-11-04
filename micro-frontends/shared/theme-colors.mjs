/** 可信上游 CSS 的中性色适配；保留原值作为独立运行时的回退。 */
export function rewriteThemeColors(root) {
  const text = new Map([
    ...[
      '#000',
      '#000000',
      '#111',
      '#111111',
      '#111827',
      '#18181b',
      '#1d2129',
      '#1f2329',
      '#262626',
      '#333',
      '#333333',
    ].map((c) => [c, 'text-primary']),
    ...[
      '#555',
      '#555555',
      '#4c4c4c',
      '#4e5969',
      '#666',
      '#666666',
      '#646a73',
      '#6b7280',
      '#71717a',
      '#8f959e',
      '#86909c',
      '#999',
      '#999999',
    ].map((c) => [c, 'text-secondary']),
    ...['#bbb', '#bbbbbb', '#bbbfc4', '#b0b6bf', '#9ca3af'].map((c) => [
      c,
      'text-disabled',
    ]),
    ['#fff', 'text-inverse'],
    ['#ffffff', 'text-inverse'],
  ]);
  const background = new Map([
    ...['#fff', '#ffffff', '#fcfcfc'].map((c) => [c, 'elevated-bg']),
    ...[
      '#fafafa',
      '#f7f8fa',
      '#f8f9fa',
      '#f8fafc',
      '#f9fafb',
      '#f6f7f8',
      '#f9f9f9',
      '#f5f5f5',
      '#f3f4f6',
      '#f2f2f2',
      '#f2f3f5',
      '#f0f0f0',
    ].map((c) => [c, 'surface-bg']),
    ...['#f1f2f3', '#eff0f1', '#eee', '#eeeeee', '#eceef1', '#e4e6ea'].map(
      (c) => [c, 'hover-bg'],
    ),
  ]);
  const blue = new Set(['#1677ff', '#1664ff', '#3370ff', '#337fff', '#3385ff']);
  // 上游既有 hex 也有 rgb/rgba；只适配已知中性色，保留状态色和内容色。
  const normalize = (value) => {
    if (value.startsWith('#')) return { color: value.toLowerCase(), alpha: 1 };
    const values = value
      .match(/[\d.]+%?/g)
      ?.map((v, i) =>
        v.endsWith('%') ? parseFloat(v) * (i < 3 ? 2.55 : 0.01) : Number(v),
      );
    if (!values || values.length < 3) return null;
    return {
      color:
        '#' +
        values
          .slice(0, 3)
          .map((v) => Math.round(v).toString(16).padStart(2, '0'))
          .join(''),
      alpha: values[3] ?? 1,
    };
  };
  root.walkDecls((declaration) => {
    if (
      !/^(?:color|background(?:-color)?|border(?:-[a-z-]+)?|outline(?:-[a-z-]+)?)$/.test(
        declaration.prop,
      )
    )
      return;
    if (/url\s*\(|["']/i.test(declaration.value)) return;
    // 编辑器内容、文档纸张和代码语法由各自渲染器管理，不做文字颜色替换。
    if (
      /ProseMirror|tiptap|univer|doc-paper|page-paper|hljs|\.token\b/.test(
        declaration.parent?.selector ?? '',
      )
    )
      return;
    const border = /^(border|outline)/.test(declaration.prop);
    const isBackground = declaration.prop.startsWith('background');
    declaration.value = declaration.value.replace(
      /#[a-f0-9]{3,8}\b|rgba?\([^()]+\)/gi,
      (original) => {
        const parsed = normalize(original);
        if (!parsed || parsed.alpha === 0) return original;
        const { color, alpha } = parsed;
        if (alpha < 1) {
          if (!isBackground && !border && color === '#000000') {
            const token =
              alpha >= 0.8
                ? 'text-primary'
                : alpha > 0.25
                ? 'text-secondary'
                : 'text-disabled';
            return `var(--nuwax-${token}, ${original})`;
          }
          if (blue.has(color))
            return `color-mix(in srgb, var(--nuwax-primary, ${color}) ${
              alpha * 100
            }%, transparent)`;
          return original;
        }
        const token =
          border &&
          (text.has(color) ||
            background.has(color) ||
            [
              '#d9d9d9',
              '#d1d5db',
              '#e5e7eb',
              '#e4e6ea',
              '#e5e6eb',
              '#e2e8f0',
              '#f1f5f9',
            ].includes(color))
            ? 'border-default'
            : blue.has(color)
            ? 'primary'
            : (isBackground ? background : text).get(color);
        return token ? `var(--nuwax-${token}, ${original})` : original;
      },
    );
  });
}
