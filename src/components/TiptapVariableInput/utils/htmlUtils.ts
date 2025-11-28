/*
 * HTML Utils
 * HTML 工具函数
 */

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
 * 转义事件标签
 * 将 <div class="event" event-type="xxx" data='xxx'>[xxx]</div> 格式的事件标签转义为纯文本显示
 * @param text 需要处理的文本
 * @returns 处理后的文本
 */
export const escapeEventTags = (text: string): string => {
  if (!text) return '';

  // 匹配事件标签: <div class="event" event-type="xxx" data='xxx'>[xxx]</div>
  // 其中 xxx 是可变的
  const eventTagRegex =
    /<div\s+class="event"\s+event-type="[^"]*"\s+data='[^']*'>\[([^\]]*)\]<\/div>/g;

  return text.replace(eventTagRegex, (match) => {
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
 * 从 Tiptap HTML 中提取纯文本内容
 * 将 mentions 和 variables 节点转换为对应的文本格式
 * @param html Tiptap HTML 内容
 * @returns 纯文本内容（原始格式：{{xxx}}、{#ToolBlock ...#}...{#/ToolBlock#}、@xxx）
 */
export const extractTextFromHTML = (html: string): string => {
  if (!html) return '';

  // 创建临时 DOM 元素
  const temp = document.createElement('div');
  temp.innerHTML = html;

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

  // 处理 variables
  // Tiptap 实际渲染为 span.variable-block-chip（标准 HTML 标签）
  const variables = temp.querySelectorAll('span.variable-block-chip');
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
  return result.replace(/\n{3,}/g, '\n\n');
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
 * @returns Tiptap HTML 内容
 */
export const convertTextToHTML = (
  text: string,
  disableMentions: boolean = false,
): string => {
  if (!text) return '';

  // 首先转义事件标签,使其显示为纯文本而不是被浏览器解析
  let html = escapeEventTags(text);

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
  html = html.replace(
    /\{\{([^}]+)\}\}/g,
    '<span class="variable-block-chip" data-key="$1" data-label="$1" data-variable-name="$1">$1</span>',
  );

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
