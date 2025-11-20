export interface ToolBlockData {
  id: string;
  type: string;
  name: string;
  content: string;
}

// Regex for matching ToolBlocks
// Matches {#ToolBlock id="..." type="..." name="..."#}content{#/ToolBlock#}
// Using [\s\S]*? to match across lines
const TOOL_BLOCK_REGEX =
  /\{#ToolBlock\s+id="([^"]*)"\s+type="([^"]*)"\s+name="([^"]*)"\s*#\}([\s\S]*?)\{#\/ToolBlock#\}/g;

// Regex for matching variables {{variable}}
export const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Parses raw text value into HTML for contentEditable
 */
export const parseValueToHtml = (value: string): string => {
  if (!value) return '';

  // Replace ToolBlocks with HTML spans
  // We need to unescape the content inside the block because it was just escaped above,
  // but the regex runs on the escaped string.
  // Actually, it's better to run regex on the original string and build the HTML.
  // But simply replacing is easier if we are careful.

  // Let's try a tokenizing approach for robustness

  // 1. Replace ToolBlocks
  // We use a placeholder to avoid messing up with variable replacement or HTML escaping
  const toolBlocks: { placeholder: string; html: string }[] = [];
  let toolBlockIndex = 0;

  const valueWithToolPlaceholders = value.replace(
    TOOL_BLOCK_REGEX,
    (match, id, type, name, content) => {
      const placeholder = `__TOOL_BLOCK_${toolBlockIndex++}__`;
      const toolHtml = `<span
      class="tool-block-chip"
      contenteditable="false"
      data-tool-id="${id}"
      data-tool-type="${type}"
      data-tool-name="${name}"
    >${content}</span>`;
      toolBlocks.push({ placeholder, html: toolHtml });
      return placeholder;
    },
  );

  // 2. Escape the remaining text (which contains placeholders and variables)
  let escapedHtml = valueWithToolPlaceholders
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 3. Replace Variables
  escapedHtml = escapedHtml.replace(VARIABLE_REGEX, (match, variableName) => {
    return `<span class="variable-block-chip" contenteditable="false" data-variable-name="${variableName}">{{${variableName}}}</span>`;
  });

  // 4. Restore ToolBlocks
  toolBlocks.forEach(({ placeholder, html }) => {
    escapedHtml = escapedHtml.replace(placeholder, html);
  });

  // 5. Handle newlines
  escapedHtml = escapedHtml.replace(/\n/g, '<br>');

  return escapedHtml;
};

/**
 * Parses HTML content from contentEditable back to raw text value
 */
export const parseHtmlToValue = (html: string): string => {
  if (!html) return '';

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Helper function to traverse and extract text
  const extractText = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // Handle ToolBlocks
      if (element.classList.contains('tool-block-chip')) {
        const id = element.getAttribute('data-tool-id') || '';
        const type = element.getAttribute('data-tool-type') || '';
        const name = element.getAttribute('data-tool-name') || '';
        const content = element.textContent || '';
        return `{#ToolBlock id="${id}" type="${type}" name="${name}"#}${content}{#/ToolBlock#}`;
      }

      // Handle Variables
      if (element.classList.contains('variable-block-chip')) {
        // Just return the text content which should be {{variable}}
        return element.textContent || '';
      }

      // Handle line breaks
      if (element.tagName === 'BR') {
        return '\n';
      }

      // Handle divs (often created by contentEditable for new lines)
      if (element.tagName === 'DIV') {
        // If it's a div, it usually implies a newline before it (unless it's the first child)
        // But browsers vary. Chrome often wraps lines in <div>.
        // A common strategy is to treat <div> as \n + content
        let content = '';
        element.childNodes.forEach((child) => {
          content += extractText(child);
        });

        // If this div is not the first child, prepend a newline
        // actually, standard behavior is usually block elements imply newlines
        // For simplicity, let's assume <div> means a new line if it's not empty or if it's a <br> inside
        return '\n' + content;
      }

      // Recurse for other elements
      let content = '';
      element.childNodes.forEach((child) => {
        content += extractText(child);
      });
      return content;
    }

    return '';
  };

  let rawValue = '';
  tempDiv.childNodes.forEach((child) => {
    rawValue += extractText(child);
  });

  // Clean up initial newline if it was added by the first div
  if (rawValue.startsWith('\n') && !html.startsWith('<div')) {
    // This heuristic might be flaky.
    // Better approach: rely on the structure.
    // If the root has text nodes and divs, divs are new lines.
  }

  // Simple cleanup for common contentEditable artifacts
  // rawValue = rawValue.replace(/^\n/, '');

  return rawValue;
};
