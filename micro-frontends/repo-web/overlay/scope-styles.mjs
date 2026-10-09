export const REPO_SCOPE = '[data-repo-app-scope]';

/** 按顶层逗号拆选择器，保留 :is/:where/属性值里的逗号。 */
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
  const value = selector.trim();
  if (value.startsWith(REPO_SCOPE)) return value;
  if (value === '*') return `${REPO_SCOPE}, ${REPO_SCOPE} *`;
  // 根样式落到子根本身；body 的类状态（公式栏拖拽）也由适配器放在子根上。
  if (/^(?:html|body|:root|#root)(?=[.#[:\s>+~]|$)/i.test(value)) {
    return value.replace(
      /^(?:html\s*(?:>\s*)?)?(?:body|:root|#root|html)(?=[.#[:\s>+~]|$)/i,
      REPO_SCOPE,
    );
  }
  return `${REPO_SCOPE} ${value}`;
}

export function repoScopedStyles() {
  return {
    postcssPlugin: 'nuwax-repo-scope',
    Once(root) {
      const animations = new Map();
      root.walkAtRules((rule) => {
        if (!/keyframes$/i.test(rule.name)) return;
        const name = rule.params.trim();
        if (name.startsWith('repo-app-')) return;
        animations.set(name, `repo-app-${name}`);
        rule.params = `repo-app-${name}`;
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
        // App 根建立 size container；100vh/100vw 改由资料库可用内容区计算。
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
