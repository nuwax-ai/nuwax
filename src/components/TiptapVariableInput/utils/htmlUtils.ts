/*
 * HTML Utils
 * HTML 工具函数
 */

/**
 * 匹配事件标签的正则表达式
 * 匹配 <div class="event" ...>...</div>
 * 使用更通用的正则：只要是 div 且包含 class="event" 就匹配，忽略属性顺序和内容
 */
export const EVENT_TAG_REGEX =
  /<div\s+class="event"\s+event-type="[^"]*"\s+data='[^']*'>\[([^\]]*)\]<\/div>/g;

/**
 * 转义 HTML 特殊字符
 * @param text 需要转义的文本
 * @returns 转义后的文本
 */
export const escapeHTML = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * StarterKit 支持的 HTML 标签列表
 * 这些标签不会被转义，会被 Tiptap 正常解析
 */
const SUPPORTED_HTML_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'hardBreak',
];

/**
 * Tiptap 自定义节点使用的 class 名称列表
 * 这些 class 的 span 标签不会被转义
 */
const TIPTAP_NODE_CLASSES = [
  'tool-block-chip',
  'variable-block-chip',
  'variable-block-chip-editable',
  'mention-node',
  'raw-content',
];

/**
 * 转义不被 StarterKit 支持的 HTML 标签
 * @param html HTML 内容
 * @returns 转义后的 HTML 内容
 */
export const escapeUnsupportedHTMLTags = (html: string): string => {
  if (!html) return html;

  // 匹配所有 HTML 标签
  const tagRegex =
    /<\/?([a-zA-Z][a-zA-Z0-9]*)(?:\s+[^>]*)?>|<([a-zA-Z][a-zA-Z0-9]*)\s+[^>]*>/g;

  return html.replace(tagRegex, (match, tagName1, tagName2) => {
    const tagName = tagName1 || tagName2;
    const lowerTagName = tagName.toLowerCase();

    // 如果标签被 StarterKit 支持（不包括 span），不转义
    if (SUPPORTED_HTML_TAGS.includes(lowerTagName)) {
      return match;
    }

    // 对于 span 标签，检查是否包含 Tiptap 节点相关的 class
    if (lowerTagName === 'span') {
      const hasNodeClass = TIPTAP_NODE_CLASSES.some(
        (cls) =>
          match.includes(`class="${cls}"`) || match.includes(`class='${cls}'`),
      );
      if (hasNodeClass) {
        return match; // 保留 Tiptap 节点的 span
      }
    }

    // 转义不被支持的标签
    return escapeHTML(match);
  });
};

/**
 * 转义事件标签
 * 将 <div class="event" event-type="xxx" data='xxx'>[xxx]</div> 格式的事件标签转义为纯文本显示
 * @param text 需要处理的文本
 * @returns 处理后的文本
 */
export const escapeEventTags = (text: string): string => {
  if (!text) return '';

  return text.replace(EVENT_TAG_REGEX, (match) => {
    // 将整个事件标签转义
    return match
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  });
};

/**
 * 转义自定义 XML 标签（如 <OutputFormat>、<Constrains>、<task_result>、<task-result> 等）
 * 这些标签在提示词中常用，需要被转义以避免被浏览器解析为 HTML 元素
 *
 * 支持的标签格式：
 * - 开始标签：<OutputFormat>、<task_result attr="value">
 * - 结束标签：</OutputFormat>、</task-result>
 * - 自闭合标签：<OutputFormat />、<task_result/>、<task-result attr="value" />
 *
 * 支持的标签命名：
 * - 大写字母开头的标签：<OutputFormat>、<Constrains>
 * - 小写字母开头包含下划线的标签：<task_result>、<tool_call>
 * - 小写字母开头包含连字符的标签：<task-result>、<tool-call>
 *
 * @param text 需要处理的文本
 * @returns 处理后的文本（自定义标签被转义为 &lt; 和 &gt;）
 */
export const escapeCustomHTMLTags = (text: string): string => {
  if (!text) return '';

  // 标准 HTML 标签列表（小写）
  // 这些标签不会被转义，会被浏览器正常解析
  const standardTags = [
    // 文档结构
    'html',
    'head',
    'body',
    'title',
    'meta',
    'link',
    'script',
    'style',
    'base',
    // 文本内容
    'p',
    'br',
    'hr',
    'span',
    'div',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'del',
    'ins',
    'sub',
    'sup',
    'small',
    'big',
    'mark',
    'abbr',
    'address',
    'cite',
    'q',
    'blockquote',
    'code',
    'pre',
    'kbd',
    'samp',
    'var',
    // 标题
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    // 列表
    'ul',
    'ol',
    'li',
    'dl',
    'dt',
    'dd',
    // 链接和媒体
    'a',
    'img',
    'audio',
    'video',
    'source',
    'track',
    'picture',
    'figure',
    'figcaption',
    'map',
    'area',
    'canvas',
    'svg',
    'iframe',
    'embed',
    'object',
    'param',
    // 表格
    'table',
    'caption',
    'colgroup',
    'col',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    // 表单
    'form',
    'input',
    'button',
    'select',
    'option',
    'optgroup',
    'textarea',
    'label',
    'fieldset',
    'legend',
    'datalist',
    'output',
    'progress',
    'meter',
    // 语义化
    'header',
    'footer',
    'main',
    'nav',
    'aside',
    'section',
    'article',
    'details',
    'summary',
    'dialog',
    'menu',
    'menuitem',
    // 其他
    'template',
    'slot',
    'noscript',
    'wbr',
    'bdi',
    'bdo',
    'ruby',
    'rt',
    'rp',
    'data',
    'time',
    // 废弃但仍常用
    'font',
    'center',
    'tt',
    'frame',
    'frameset',
    'noframes',
  ];

  // 检查标签名是否是标准 HTML 标签
  const isStandardTag = (tagName: string): boolean => {
    return standardTags.includes(tagName.toLowerCase());
  };

  // 检查标签名是否是自定义 XML 标签（需要被转义）
  // 自定义标签的特征：
  // 1. 以大写字母开头（如 <OutputFormat>）
  // 2. 包含下划线（如 <task_result>）
  // 3. 包含连字符（如 <task-result>）
  const isCustomXmlTag = (tagName: string): boolean => {
    // 如果是标准 HTML 标签，不是自定义标签
    if (isStandardTag(tagName)) {
      return false;
    }
    // 如果以大写字母开头，是自定义标签
    if (/^[A-Z]/.test(tagName)) {
      return true;
    }
    // 如果包含下划线或连字符，是自定义标签
    if (tagName.includes('_') || tagName.includes('-')) {
      return true;
    }
    return false;
  };

  // 统一的标签正则表达式
  // 匹配所有 XML 风格的标签（包括自闭合、开始、结束标签）
  // 标签名可以包含字母、数字、下划线、连字符
  const allTagRegex = /<\/?([a-zA-Z][a-zA-Z0-9_-]*)(?:\s+[^>]*)?\s*\/?>/g;

  // 处理所有标签
  const result = text.replace(allTagRegex, (match, tagName) => {
    // 检查是否已经被转义（避免重复处理）
    if (match.includes('&lt;') || match.includes('&gt;')) {
      return match;
    }
    // 如果是自定义 XML 标签，转义
    if (isCustomXmlTag(tagName)) {
      return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    // 标准 HTML 标签不转义
    return match;
  });

  return result;
};

// ... (intermediate code omitted) ...

/**
 * 从 Tiptap HTML 中提取纯文本内容
 * 将 mentions 和 variables 节点转换为对应的文本格式
 * @param html Tiptap HTML 内容
 * @returns 纯文本内容（原始格式：{{xxx}}、{#ToolBlock ...#}...{#/ToolBlock#}、@xxx）
 */
/**
 * 匹配不被 StarterKit 支持的 HTML 标签的正则表达式
 * 匹配所有 HTML 标签，但排除 StarterKit 支持的标签
 */
const UNSUPPORTED_HTML_TAG_REGEX = /<\/?([a-zA-Z][a-zA-Z0-9]*)(?:\s+[^>]*)?>/g;

export const extractTextFromHTML = (html: string): string => {
  if (!html) return '';

  // 在使用 innerHTML 解析之前，先转义不被 StarterKit 支持的 HTML 标签
  // 参照事件标签的处理逻辑，直接使用正则匹配并转义
  // 这样可以防止浏览器将这些标签（如 <a>、<div>、<span> 等）解析为真正的 HTML 元素
  // 从而避免在提取文本时丢失这些标签
  // 但保留 Tiptap 节点相关的 span 标签（如 tool-block-chip、variable-block-chip 等）
  const escapedHtml = html.replace(
    UNSUPPORTED_HTML_TAG_REGEX,
    (match, tagName) => {
      const lowerTagName = tagName.toLowerCase();

      // 如果标签被 StarterKit 支持，不转义
      if (SUPPORTED_HTML_TAGS.includes(lowerTagName)) {
        return match;
      }

      // 对于 span 标签，检查是否包含 Tiptap 节点相关的 class
      if (lowerTagName === 'span') {
        const hasNodeClass = TIPTAP_NODE_CLASSES.some(
          (cls) =>
            match.includes(`class="${cls}"`) ||
            match.includes(`class='${cls}'`),
        );
        if (hasNodeClass) {
          return match; // 保留 Tiptap 节点的 span
        }
      }

      // 转义不被支持的标签（参照 escapeEventTags 的处理方式）
      return match
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
  );

  // 创建临时 DOM 元素
  const temp = document.createElement('div');
  temp.innerHTML = escapedHtml;

  // 处理 tool-blocks（优先处理，因为可能包含其他内容）
  // Tiptap 实际渲染为 span.tool-block-chip（标准 HTML 标签）
  const toolBlocks = temp.querySelectorAll('span.tool-block-chip');
  toolBlocks.forEach((toolBlock) => {
    const id = toolBlock.getAttribute('data-tool-id') || '';
    const type = toolBlock.getAttribute('data-tool-type') || 'undefined';
    const name = toolBlock.getAttribute('data-tool-name') || '';
    const content =
      toolBlock.getAttribute('data-tool-content') ||
      toolBlock.textContent ||
      '';
    const toolBlockText = `{#ToolBlock id="${id}" type="${type}" name="${name}"#}${content}{#/ToolBlock#}`;
    const textNode = document.createTextNode(toolBlockText);
    toolBlock.parentNode?.replaceChild(textNode, toolBlock);
  });

  // 处理 variables（包括可编辑和不可编辑的变量节点）
  // Tiptap 实际渲染为 span.variable-block-chip 或 span.variable-block-chip-editable（标准 HTML 标签）
  const variables = temp.querySelectorAll(
    'span.variable-block-chip, span.variable-block-chip-editable',
  );
  variables.forEach((variable) => {
    // 变量转换为 {{key}} 格式
    // 从 data-key 属性获取 key，或者从文本内容获取（新格式中文本内容就是 key）
    let key =
      variable.getAttribute('data-key') ||
      variable.getAttribute('data-variable-name') ||
      '';

    // 如果 key 为空，从文本内容获取（新格式中文本内容就是 key，不包含大括号）
    if (!key) {
      const textContent = variable.textContent || '';
      // 检查是否是旧格式（包含大括号）
      const match = textContent.match(/\{\{([^}]+)\}\}/);
      if (match) {
        key = match[1];
      } else {
        // 新格式：文本内容就是 key
        key = textContent.trim();
      }
    }

    const textNode = document.createTextNode(`{{${key}}}`);
    variable.parentNode?.replaceChild(textNode, variable);
  });

  // 处理 mentions
  // Tiptap 实际渲染为 span.mention-node（标准 HTML 标签）
  const mentions = temp.querySelectorAll('span.mention-node');
  mentions.forEach((mention) => {
    const label =
      mention.getAttribute('data-label') || mention.textContent || '';
    const textNode = document.createTextNode(`@${label}`);
    mention.parentNode?.replaceChild(textNode, mention);
  });

  // 处理 Raw 节点（用于展示 HTML/XML 原始内容）
  // Tiptap 实际渲染为 pre.raw-content 或 pre[data-raw]
  const rawNodes = temp.querySelectorAll('pre[data-raw], pre.raw-content');
  rawNodes.forEach((rawNode) => {
    const content =
      rawNode.getAttribute('data-content') || rawNode.textContent || '';
    // Raw 节点内容直接作为文本输出，不进行任何转换
    const textNode = document.createTextNode(content);
    rawNode.parentNode?.replaceChild(textNode, rawNode);
  });

  // 提取纯文本（保留段落结构和硬换行）
  // 规则：每个段落（包括空段落）都转换为一个换行符
  // <p>text</p> -> text\n
  // <p></p> -> \n
  // <p>text1</p><p>text2</p> -> text1\ntext2\n
  // <p>text</p><p></p> -> text\n\n
  // <p></p><p>text</p> -> \ntext\n
  // <p></p><p></p> -> \n\n

  let result = '';

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // 处理文本节点
      // 注意：如果 HTML 中包含转义的标签（&lt; 和 &gt;），
      // 当通过 innerHTML 解析时，浏览器会自动将它们转换为 < 和 >
      // 所以这里直接使用 textContent 即可
      result += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const childNodes = Array.from(node.childNodes);

      // 处理硬换行（<br> 或 <br/>）
      if (element.tagName === 'BR') {
        result += '\n';
        return;
      }

      // 处理段落
      if (element.tagName === 'P') {
        // 递归处理子节点（获取段落内容）
        childNodes.forEach((child) => {
          processNode(child);
        });

        // 每个段落结束后都添加换行符（包括空段落）
        // 这样空段落就会转换为一个换行符
        result += '\n';
      } else {
        // 其他元素，递归处理子节点
        childNodes.forEach((child) => {
          processNode(child);
        });
      }
    }
  };

  // 处理所有根节点
  Array.from(temp.childNodes).forEach((node) => {
    processNode(node);
  });

  // 清理多余的连续换行（最多保留两个连续换行）
  // 注意：不使用 trim()，保留首尾的换行符以保留空行
  // 同时移除零宽度空格 (\u200B)
  return result.replace(/\n{3,}/g, '\n\n').replace(/\u200B/g, '');
};

/**
 * 清理 HTML 内容中的首尾空段落
 * @param html HTML 内容
 * @param preserveEmptyLines 是否保留空行（默认 false，为了向后兼容）
 * @returns 清理后的 HTML 内容
 */
export const cleanHTMLParagraphs = (
  html: string,
  preserveEmptyLines: boolean = false,
): string => {
  if (!html) return '';

  // 如果保留空行，只移除完全为空的内容，不清理首尾空段落
  if (preserveEmptyLines) {
    const trimmed = html.trim();
    // 如果清理后为空，返回空字符串
    if (!trimmed) return '';
    return html; // 保留原始格式，包括首尾的空段落
  }

  let cleaned = html.trim();

  // 移除开头的空段落（<p></p>、<p> </p>、<p><br></p>、<p><br/></p> 等）
  while (/^<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>/i.test(cleaned)) {
    cleaned = cleaned
      .replace(/^<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>/i, '')
      .trim();
  }

  // 移除结尾的空段落
  while (/<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>$/i.test(cleaned)) {
    cleaned = cleaned
      .replace(/<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>$/i, '')
      .trim();
  }

  // 如果清理后为空，返回空字符串
  if (!cleaned.trim()) return '';

  return cleaned;
};

/**
 * 将纯文本转换为 Tiptap HTML
 * 识别 {{variable}} 和 @mentions 格式
 * @param text 纯文本内容或 HTML 内容
 * @param disableMentions 是否禁用 mentions 转换
 * @param enableEditableVariables 是否启用可编辑变量节点，默认开启
 * @param variableMode 变量模式：'node' | 'mark' | 'text'，默认 'text'
 * @returns Tiptap HTML 内容
 */
export const convertTextToHTML = (
  text: string,
  disableMentions: boolean = false,
  enableEditableVariables: boolean = true,
  variableMode: 'node' | 'mark' | 'text' = 'text',
): string => {
  if (!text) return '';

  // 首先转义事件标签,使其显示为纯文本而不是被浏览器解析
  let html = escapeEventTags(text);

  // 转义自定义 XML 标签（如 <OutputFormat>、<Constrains> 等）
  // 这些标签需要被转义以避免被浏览器解析为 HTML 元素，但保留在文本中
  html = escapeCustomHTMLTags(html);

  // 转义不被 StarterKit 支持的 HTML 标签（如 <a>、<div>、<span> 等）
  // 这些标签在 Tiptap 解析时会被移除，需要转义以保留原始标签
  html = escapeUnsupportedHTMLTags(html);

  // 检查是否已经是 HTML 格式（包含 HTML 标签）
  const isHTML = /<[^>]+>/.test(html);

  // 如果已经是 HTML 格式，保留空行，不清理首尾的空段落
  if (isHTML) {
    // 保留空行，不清理首尾空段落
    const trimmed = html.trim();
    if (!trimmed) return '';
    // 直接返回，保留原始格式包括空段落
    // html = cleanHTMLParagraphs(html, true);
  }

  // 转换 {#ToolBlock ...#}...{#/ToolBlock#} 格式
  html = html.replace(
    /\{#ToolBlock id="([^"]+)" type="([^"]+)" name="([^"]+)"#\}(.*?)\{#\/ToolBlock#\}/gs,
    '<span class="tool-block-chip" data-tool-id="$1" data-tool-type="$2" data-tool-name="$3" data-tool-content="$4">$4</span>',
  );

  // 转换 {{variable}} 格式
  // 如果是 'text' 模式，不进行转换，保留纯文本
  if (variableMode !== 'text') {
    // 根据 enableEditableVariables 配置决定使用可编辑或不可编辑节点
    // 移除零宽度空格，避免光标跳动和输出污染
    const variableClass = enableEditableVariables
      ? 'variable-block-chip-editable'
      : 'variable-block-chip';
    html = html.replace(
      /\{\{([^}]+)\}\}/g,
      `<span class="${variableClass}" data-key="$1" data-label="$1" data-variable-name="$1">$1</span>`,
    );
  }

  // 转换 @mentions 格式（简单匹配，实际应该更智能）
  if (!disableMentions) {
    html = html.replace(
      /@(\w+)/g,
      '<span class="mention-node" data-id="$1" data-label="$1" data-type="user">@$1</span>',
    );
  }

  // 如果已经是 HTML 格式（包含段落标签），需要处理硬换行
  if (isHTML && /<p[^>]*>/i.test(html)) {
    // 将 <br> 标签转换为硬换行节点（Tiptap 会识别）
    html = html.replace(/<br\s*\/?>/gi, '<br>');
    return html;
  }

  // 如果内容为空，返回空字符串（不添加空段落）
  if (!html.trim()) return '';

  // 对于纯文本，将换行符转换为段落或硬换行
  // 将文本按换行符分割，每行包装在一个 <p> 标签中
  // 连续的空行会被转换为多个空段落
  // 统一换行符为 \n
  const normalizedHtml = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedHtml.split('\n');
  const paragraphs: string[] = [];

  lines.forEach((line) => {
    // 如果行为空，创建空段落（保留空行）
    if (!line) {
      paragraphs.push('<p></p>');
    } else {
      paragraphs.push(`<p>${line}</p>`);
    }
  });

  return paragraphs.join('');
};

/**
 * 判断文本是否需要转换为 HTML
 * 检查是否包含工具块、变量、Mentions 或事件标签
 * @param text 需要检查的文本
 * @returns 是否需要转换
 */
export const shouldConvertTextToHTML = (text: string): boolean => {
  if (!text) return false;

  // 检查工具块
  if (text.includes('{#ToolBlock')) return true;

  // 检查变量
  if (text.includes('{{')) return true;

  // 检查 Mentions
  if (text.includes('@')) return true;

  // 检查事件标签 (使用通用的正则)
  // 重置正则的 lastIndex，因为它是全局匹配
  EVENT_TAG_REGEX.lastIndex = 0;
  if (EVENT_TAG_REGEX.test(text)) return true;

  return false;
};

/**
 * 检测内容是否应该使用 Raw 节点展示
 * 判断标准：包含完整的 HTML/XML 结构（如完整的文档、多个嵌套标签等）
 * @param content 需要检测的内容
 * @returns 是否应该使用 Raw 节点
 */
export const shouldUseRawNode = (content: string): boolean => {
  if (!content) return false;

  // 检查是否包含完整的 HTML/XML 文档结构
  // 例如：<!DOCTYPE>、<html>、<xml> 等
  if (
    /<!DOCTYPE/i.test(content) ||
    /<html[\s>]/i.test(content) ||
    /<\?xml/i.test(content)
  ) {
    return true;
  }

  // 检查是否包含多个嵌套的标签结构（可能是完整的 HTML/XML 片段）
  // 例如：<div><p>text</p></div>、<root><child>text</child></root> 等
  const tagMatches = content.match(/<[^>]+>/g);
  if (tagMatches && tagMatches.length >= 3) {
    // 检查是否有开始和结束标签的配对
    const openTags = tagMatches.filter((tag) => !tag.includes('/'));
    const closeTags = tagMatches.filter((tag) => tag.includes('/'));
    // 如果有多个标签对，可能是完整的 HTML/XML 结构
    if (openTags.length >= 2 && closeTags.length >= 1) {
      return true;
    }
  }

  return false;
};

/**
 * 将 HTML/XML 内容转换为 Raw 节点的 HTML 格式
 * @param content 原始 HTML/XML 内容
 * @param type 内容类型：'html' | 'xml'，默认 'html'
 * @returns Raw 节点的 HTML 字符串
 */
export const convertToRawNodeHTML = (
  content: string,
  type: 'html' | 'xml' = 'html',
): string => {
  if (!content) return '';

  // 转义内容中的特殊字符，确保在 HTML 中正确显示
  const escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 返回 Raw 节点的 HTML 格式
  return `<pre data-raw="true" data-content="${escapedContent}" data-type="${type}" class="raw-content">${escapedContent}</pre>`;
};

/**
 * 从 HTML 中提取 Raw 节点的内容
 * @param html 包含 Raw 节点的 HTML
 * @returns Raw 节点的原始内容数组
 */
export const extractRawNodeContents = (html: string): string[] => {
  if (!html) return [];

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const rawNodes = temp.querySelectorAll('pre[data-raw], pre.raw-content');
  const contents: string[] = [];

  rawNodes.forEach((rawNode) => {
    const content =
      rawNode.getAttribute('data-content') || rawNode.textContent || '';
    // 反转义 HTML 实体
    const decodedContent = content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
    contents.push(decodedContent);
  });

  return contents;
};
