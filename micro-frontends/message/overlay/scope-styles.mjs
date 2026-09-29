export const MESSAGE_SCOPE = '[data-message-app-scope]';

/** 只拆顶层逗号，不破坏 :is/:where/属性值中的选择器。 */
export function splitSelectorList(value) {
  const parts = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '\\') {
      index += 1;
      continue;
    }
    if (quote !== '') {
      if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '(' || char === '[') depth += 1;
    if (char === ')' || char === ']') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

export function scopeSelector(selector) {
  // ConfigProvider 的 antd 私有前缀与 main 业务样式同步，避免动态样式撞主站 antd。
  const value = selector.trim().replace(/\.ant-/g, '.nuwax-im-');
  if (value.startsWith(MESSAGE_SCOPE)) return value;
  if (value === '*') return `${MESSAGE_SCOPE}, ${MESSAGE_SCOPE} *`;
  if (/^(?:html|body|:root|#root)(?=[.#[:\s>+~]|$)/i.test(value)) {
    return value.replace(
      /^(?:html\s*(?:>\s*)?)?(?:body|:root|#root|html)(?=[.#[:\s>+~]|$)/i,
      MESSAGE_SCOPE,
    );
  }
  return `${MESSAGE_SCOPE} ${value}`;
}

export function messageScopedStyles() {
  return {
    postcssPlugin: 'nuwax-message-scope',
    Once(root) {
      const animations = new Map();
      root.walkAtRules((rule) => {
        if (!/keyframes$/i.test(rule.name)) return;
        const name = rule.params.trim();
        if (name.startsWith('message-app-')) return;
        animations.set(name, `message-app-${name}`);
        rule.params = `message-app-${name}`;
      });
      root.walkRules((rule) => {
        let parent = rule.parent;
        while (parent != null) {
          if (parent.type === 'atrule' && /keyframes$/i.test(parent.name))
            return;
          parent = parent.parent;
        }
        rule.selector = splitSelectorList(rule.selector)
          .map(scopeSelector)
          .join(', ');
      });
      root.walkDecls((declaration) => {
        declaration.value = declaration.value.replace(
          /\b(\d*\.?\d+)(d?v[hw])\b/g,
          (_match, amount, unit) =>
            `${amount}${unit.endsWith('h') ? 'cqh' : 'cqw'}`,
        );
        if (/^(?:-webkit-)?animation(?:-name)?$/i.test(declaration.prop)) {
          declaration.value = declaration.value.replace(
            /[-\w]+/g,
            (word) => animations.get(word) ?? word,
          );
        }
      });
    },
  };
}
