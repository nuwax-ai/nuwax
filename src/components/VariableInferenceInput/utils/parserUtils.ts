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
  /\{#ToolBlock id="([^"]+)" type="([^"]+)" name="([^"]+)"#\}(.*?)\{#\/ToolBlock#\}/gs;

export const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Escape HTML special characters
 */
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Parses raw text value into HTML for contentEditable
 */
export const parseValueToHtml = (
  value: string,
  cursorPosition: number = -1,
): string => {
  if (!value) return '';

  let resultHtml = '';
  let currentIndex = 0;

  // Combine regexes to search for both ToolBlocks and Variables
  const regex = new RegExp(
    `${TOOL_BLOCK_REGEX.source}|${VARIABLE_REGEX.source}`,
    'g',
  );

  let match;
  while ((match = regex.exec(value)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;

    // Append text before match
    const textBefore = value.substring(currentIndex, matchStart);
    resultHtml += escapeHtml(textBefore).replace(/\n/g, '<br>');

    // Handle match - check if it's a ToolBlock or Variable
    // TOOL_BLOCK_REGEX has 4 capturing groups (1-4)
    // VARIABLE_REGEX has 1 capturing group (5)
    if (match[1] !== undefined) {
      // ToolBlock match (groups 1-4)
      const id = match[1];
      const type = match[2];
      const name = match[3];
      const content = match[4];

      resultHtml += `<span
            class="tool-block-chip"
            contenteditable="false"
            data-tool-id="${id}"
            data-tool-type="${type}"
            data-tool-name="${name}"
          >${content}</span>`;
    } else {
      // Variable match (group 5)
      const variableName = match[5];

      // Check if active (cursor is inside this variable)
      const isActive =
        cursorPosition >= matchStart && cursorPosition <= matchEnd;
      const activeClass = isActive ? ' variable-active' : '';

      // Render as editable span
      resultHtml += `<span class="variable-block-chip${activeClass}" data-variable-name="${variableName}">{{${variableName}}}</span>`;
    }

    currentIndex = matchEnd;
  }

  // Append remaining text
  const textAfter = value.substring(currentIndex);
  resultHtml += escapeHtml(textAfter).replace(/\n/g, '<br>');

  return resultHtml;
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
