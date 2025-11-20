/*
 * HTML Utils
 * HTML 工具函数
 */

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

  // 提取纯文本（保留段落结构，但简化换行）
  let result = '';
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      // 段落之间添加换行
      if (element.tagName === 'P' && result && !result.endsWith('\n')) {
        result += '\n';
      }
      // 递归处理子节点
      Array.from(node.childNodes).forEach(processNode);
    }
  };

  Array.from(temp.childNodes).forEach(processNode);

  // 清理多余的换行和空格
  return result.replace(/\n{3,}/g, '\n\n').trim();
};

/**
 * 将纯文本转换为 Tiptap HTML
 * 识别 {{variable}} 和 @mentions 格式
 * @param text 纯文本内容
 * @returns Tiptap HTML 内容
 */
export const convertTextToHTML = (text: string): string => {
  if (!text) return '';

  let html = text;

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
  html = html.replace(
    /@(\w+)/g,
    '<span class="mention-node" data-id="$1" data-label="$1" data-type="user">@$1</span>',
  );

  // 包装在段落中
  return `<p>${html}</p>`;
};
