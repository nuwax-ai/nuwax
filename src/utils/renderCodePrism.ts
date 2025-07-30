import markdownIt from 'markdown-it';
import Prism from 'prismjs';

// 引入 Prism.js 语言支持
import 'prismjs/components/prism-bash.min.js';
import 'prismjs/components/prism-icon.min.js';
import 'prismjs/components/prism-java.min.js';
import 'prismjs/components/prism-javascript.min.js';
import 'prismjs/components/prism-jq.min.js';
import 'prismjs/components/prism-json.min.js';
import 'prismjs/components/prism-jsx.min.js';
import 'prismjs/components/prism-kotlin.min.js';
import 'prismjs/components/prism-log.min.js';
import 'prismjs/components/prism-markdown.min.js';
import 'prismjs/components/prism-mermaid.min.js';
import 'prismjs/components/prism-perl.min.js';
import 'prismjs/components/prism-powershell.min.js';
import 'prismjs/components/prism-python.min.js';
import 'prismjs/components/prism-regex.min.js';
import 'prismjs/components/prism-sass.min.js';
import 'prismjs/components/prism-sql.min.js';
import 'prismjs/components/prism-tsx.min.js';
import 'prismjs/components/prism-typescript.min.js';
import 'prismjs/themes/prism.css';

// 创建安全的 HTML 转义函数
const escapeHtml = (text: string): string => {
  if (typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// 获取 markdown-it 的 utils（如果可用）
const mdUtils = (() => {
  try {
    const md = markdownIt();
    return md.utils;
  } catch (e) {
    return null;
  }
})();

// 安全的转义函数，优先使用 markdown-it 的 utils，否则使用自定义实现
export const safeEscapeHtml = (text: string): string => {
  if (mdUtils && mdUtils.escapeHtml) {
    return mdUtils.escapeHtml(text);
  }
  return escapeHtml(text);
};

export const renderCodePrismInline = (token: any) => {
  const lang = token.info?.trim().split(/\s+/g)[0] || 'text';
  const content = token.content;
  let result = '';
  if (lang && Prism.languages[lang]) {
    try {
      result = Prism.highlight(content, Prism.languages[lang], lang);
    } catch (__) {
      result = safeEscapeHtml(content);
    }
  } else {
    result = safeEscapeHtml(content);
  }

  return result;
};

const renderCodePrism = (token: any) => {
  const lang = token.info?.trim().split(/\s+/g)[0] || 'text';
  const content = token.content;
  let result = '';
  let inlineString = safeEscapeHtml(content);
  if (lang && Prism.languages[lang]) {
    try {
      inlineString = renderCodePrismInline(token);
      result = `<pre class="language-${lang}"><code class="language-${lang}">${inlineString}</code></pre>`;
    } catch (__) {
      result = `<pre><code>${inlineString}</code></pre>`;
    }
  } else {
    result = `<pre><code>${inlineString}</code></pre>`;
  }

  return result;
};

export default renderCodePrism;
