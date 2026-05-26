/**
 * 提取表格单元格的内容
 * @param cellNode - 表格单元格节点
 * @returns 单元格文本内容
 */
const extractTableCell = (cellNode: any): string => {
  try {
    let content = '';

    // 递归提取文本内容
    const extractText = (node: any): string => {
      if (typeof node === 'string') {
        return node;
      }

      if (typeof node === 'number') {
        return String(node);
      }

      if (Array.isArray(node)) {
        return node.map(extractText).join('');
      }

      if (node?.props?.children) {
        return extractText(node.props.children);
      }

      return '';
    };

    content = extractText(cellNode);

    // 清理内容，移除多余的空白字符
    return content.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.warn('Failed to extract table cell content:', error);
    return '';
  }
};

/**
 * 提取表格行的内容
 * @param rowNode - 表格行节点
 * @returns Markdown 格式的行字符串
 */
const extractTableRow = (rowNode: any): string => {
  try {
    const cells: string[] = [];

    // 处理行节点的子元素
    const processRowChildren = (children: any) => {
      if (Array.isArray(children)) {
        children.forEach((child: any) => {
          if (child?.type === 'td' || child?.type === 'th') {
            const cellContent = extractTableCell(child);
            cells.push(cellContent);
          } else if (child?.props?.children) {
            processRowChildren(child.props.children);
          }
        });
      } else if (children?.type === 'td' || children?.type === 'th') {
        const cellContent = extractTableCell(children);
        cells.push(cellContent);
      }
    };

    // 处理行节点
    if (rowNode?.props?.children) {
      processRowChildren(rowNode.props.children);
    } else if (rowNode?.children) {
      processRowChildren(rowNode.children);
    }

    // 生成 Markdown 行格式
    if (cells.length > 0) {
      return '|' + cells.map((cell) => ` ${cell.trim()} `).join('|') + '|';
    }

    return '';
  } catch (error) {
    console.warn('Failed to extract table row content:', error);
    return '';
  }
};

/**
 * 提取表格区域（thead 或 tbody）的内容
 * @param sectionNode - 表格区域节点（thead 或 tbody）
 * @returns 该区域的所有行内容数组
 */
const extractTableSection = (sectionNode: any): string[] => {
  try {
    const rows: string[] = [];

    if (sectionNode?.props?.children) {
      const children = sectionNode.props.children;

      if (Array.isArray(children)) {
        children.forEach((child: any) => {
          if (child?.type === 'tr') {
            const rowContent = extractTableRow(child);
            if (rowContent) {
              rows.push(rowContent);
            }
          }
        });
      } else if (children?.type === 'tr') {
        const rowContent = extractTableRow(children);
        if (rowContent) {
          rows.push(rowContent);
        }
      }
    }

    return rows;
  } catch (error) {
    console.warn('Failed to extract table area content:', error);
    return [];
  }
};

/**
 * 从表格 DOM 节点提取 Markdown 格式的表格内容
 * @param tableChildren - 表格的子节点
 * @returns Markdown 格式的表格字符串
 */
const extractTableToMarkdown = (tableChildren: React.ReactNode): string => {
  try {
    // 如果 tableChildren 是字符串，直接返回
    if (typeof tableChildren === 'string') {
      return tableChildren;
    }

    // 如果 tableChildren 是数组，处理每个子节点
    if (Array.isArray(tableChildren)) {
      const rows: string[] = [];
      let hasHeader = false;

      tableChildren.forEach((child: any) => {
        // 处理 thead 标签
        if (child?.type === 'thead') {
          const headerRows = extractTableSection(child);
          rows.push(...headerRows);
          hasHeader = true;
        }
        // 处理 tbody 标签
        else if (child?.type === 'tbody') {
          const bodyRows = extractTableSection(child);
          rows.push(...bodyRows);
        }
        // 处理直接的 tr 标签（没有 thead/tbody 包装的情况）
        else if (child?.type === 'tr') {
          const rowContent = extractTableRow(child);
          if (rowContent) {
            rows.push(rowContent);
          }
        }
        // 处理嵌套的情况
        else if (child?.props?.children) {
          const nestedRows = extractTableToMarkdown(child.props.children);
          if (nestedRows) {
            rows.push(nestedRows);
          }
        }
      });

      // 生成 Markdown 表格格式
      if (rows.length > 0) {
        // 如果有表头，添加表头分隔符
        if (hasHeader && rows.length > 1) {
          const headerRow = rows[0];
          if (headerRow) {
            const columnCount = (headerRow.match(/\|/g) || []).length - 1;
            const separator = '|' + '---|'.repeat(columnCount);
            // 将分隔符插入到第一行（表头）后面
            const resultRows = [rows[0], separator, ...rows.slice(1)];
            return resultRows.join('\n');
          }
        }

        // 没有表头的情况，直接拼接所有行
        return rows.join('\n');
      }
    }

    // 如果 tableChildren 是对象，尝试提取其内容
    if (typeof tableChildren === 'object' && tableChildren !== null) {
      const childProps = (tableChildren as any)?.props;
      if (childProps?.children) {
        return extractTableToMarkdown(childProps.children);
      }
    }

    return '';
  } catch (error) {
    console.warn('Failed to extract table content:', error);
    return '';
  }
};

const defaultDelimiters = [
  { left: '\\[', right: '\\]', display: true },
  { left: '\\(', right: '\\)', display: false },
];
// 转义括号规则 - 通用数学公式解析器
function escapedBracketRule(delimiters: any) {
  return (text: string, startPos: number = 0) => {
    const max = text.length;
    const start = startPos;

    for (const { left, right, display } of delimiters) {
      // 检查是否以左标记开始
      if (!text.slice(start).startsWith(left)) continue;

      // 跳过左标记的长度
      let pos = start + left.length;

      // 寻找匹配的右标记
      while (pos < max) {
        if (text.slice(pos).startsWith(right)) {
          break;
        }
        pos++;
      }

      // 没找到匹配的右标记，跳过，进入下个匹配
      if (pos >= max) continue;

      // 提取数学公式内容
      const content = text.slice(start + left.length, pos);
      const endPos = pos + right.length;

      return {
        formula: content,
        display,
        start,
        end: endPos,
        left,
        right,
        success: true,
      };
    }

    return {
      formula: '',
      display: false,
      start: 0,
      end: 0,
      left: '',
      right: '',
      success: false,
    };
  };
}
// 新的数学公式替换函数 - 直接替换为 $$ 分隔符
function replaceMathBracket(text: string): string {
  // 创建只包含非美元符号分隔符的选项
  const nonDollarDelimiters = defaultDelimiters.filter(
    (delimiter) =>
      !delimiter.left.includes('$') && !delimiter.right.includes('$'),
  );

  const rule = escapedBracketRule(nonDollarDelimiters);
  let result = '';
  let pos = 0;

  while (pos < text.length) {
    const match = rule(text, pos);
    if (match.success) {
      // 添加匹配前的文本
      result += text.slice(pos, match.start);
      // 替换为 $$ 分隔符
      const delimiter = match.display ? '$$' : '$';
      result += `${delimiter}${match.formula}${delimiter}`;
      pos = match.end;
    } else {
      // 没有匹配，添加当前字符
      result += text[pos];
      pos++;
    }
  }

  return result;
}

/**
 * 根据规则将连续的 markdown-custom-process 标签合并
 * 规则：
 * 1. 连续 2 个及以上的过程标签合并
 * 2. 中间包含“执行计划”的不合并（作为分隔符）
 * 3. 标签间只包含空白字符时不中断合并
 * @param text - 待处理的 Markdown 文本
 * @returns 处理后的文本
 */
function groupMarkdownProcesses(text: string): string {
  if (!text) return '';

  // 匹配 markdown-custom-process 标签及其可选的 div/p 包装器
  // 注意：[^>]*? 虽然简单，但在绝大多数情况下足够。如果以后有更复杂的属性需求（如带 > 的属性），再考虑更复杂的正则
  const blockRegex =
    /(?:\s*<(?:div|p)>\s*)?(<markdown-custom-process\b[^>]*?>(?:<\/markdown-custom-process>)?)(?:\s*<\/(?:div|p)>\s*)?/g;

  // 1. 扫描所有匹配项，提取 executeId 并记录它们的位置，以解决 SSE 流式生成 and PROCESSING 阶段追加导致的重复问题
  const matches: {
    index: number;
    endIndex: number;
    executeId: string;
    fullMatch: string;
    tagMatch: string;
  }[] = [];
  let match;
  const lastIndexMap = new Map<string, number>(); // executeId -> last match index

  while ((match = blockRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const tagMatch = match[1];

    // 匹配 executeId 属性（支持可选反斜杠转义及不同引号）
    const executeIdMatch = tagMatch.match(
      /executeId=(?:\\"|"|\\')([^"\\]+)(?:\\"|"|\\')/i,
    );
    const executeId = executeIdMatch ? executeIdMatch[1] : null;

    if (executeId) {
      matches.push({
        index: match.index,
        endIndex: blockRegex.lastIndex,
        executeId,
        fullMatch,
        tagMatch,
      });
      lastIndexMap.set(executeId, match.index);
    }
  }

  // 2. 根据 lastIndexMap 进行过滤，只保留每个 executeId 的最后一项（最新、属性最全的那一项）
  let dedupedText = '';
  let lastPos = 0;

  for (const m of matches) {
    if (lastIndexMap.get(m.executeId) !== m.index) {
      dedupedText += text.slice(lastPos, m.index);
      lastPos = m.endIndex;
    }
  }
  dedupedText += text.slice(lastPos);

  // 3. 对去重后的 dedupedText 进行属性提取、自动安全 URL 编码、格式归一化及合并分组
  let result = '';
  let lastIndex = 0;
  let currentGroup: string[] = [];
  let groupMatch;

  const flushGroup = () => {
    if (currentGroup.length > 0) {
      if (currentGroup.length >= 2) {
        // 合并为组标签，增加换行确保不影响后续 markdown 解析，外层嵌套标准块级 div 以防解析为行内 p
        result += `\n\n<div><markdown-custom-process-group>\n${currentGroup.join(
          '\n',
        )}\n</markdown-custom-process-group></div>\n\n`;
      } else {
        // 只有一个，保持原样
        result += `\n\n<div>${currentGroup[0]}</div>\n\n`;
      }
      currentGroup = [];
    }
  };

  blockRegex.lastIndex = 0;
  while ((groupMatch = blockRegex.exec(dedupedText)) !== null) {
    const tagMatch = groupMatch[1];

    // 自动安全提取并 URL 编码 name 属性以防止换行或引号破坏 markdown HTML 块树解析
    let processedTag = tagMatch;
    const nameStartIdx = tagMatch.search(/name=(?:\\"|"|\\')/);
    if (nameStartIdx !== -1) {
      const markerMatch = tagMatch
        .slice(nameStartIdx)
        .match(/name=(?:\\"|"|\\')/);
      const marker = markerMatch ? markerMatch[0] : '';
      const valueStart = nameStartIdx + marker.length;

      const tagEndIdx = tagMatch.indexOf('></markdown-custom-process>');
      const tagContentEnd =
        tagEndIdx !== -1
          ? tagEndIdx
          : tagMatch.endsWith('/>')
          ? tagMatch.length - 2
          : tagMatch.length - 1;

      const quoteLen = marker.includes('\\') ? 2 : 1;
      const valueEnd = tagContentEnd - quoteLen;

      const rawNameVal = tagMatch.slice(valueStart, valueEnd);

      // 解码 HTML 实体
      let decodedNameVal = rawNameVal
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');

      // 尝试进行 decodeURIComponent 以免重复编码
      try {
        decodedNameVal = decodeURIComponent(decodedNameVal);
      } catch (e) {}

      // 安全 URL 编码成单行字符
      const encodedNameVal = encodeURIComponent(decodedNameVal);

      // 重建标签名属性并统一归一化为 React / rehype-raw 容易挂载的未转义标准 HTML 属性
      const beforeName = tagMatch.slice(0, nameStartIdx);
      const closingTag =
        tagEndIdx !== -1
          ? '></markdown-custom-process>'
          : tagMatch.endsWith('/>')
          ? ' />'
          : '>';

      let normalizedBeforeName = beforeName
        .replace(/executeId=\\"/g, 'executeId="')
        .replace(/executeId=\\'/g, 'executeId="')
        .replace(/type=\\"/g, 'type="')
        .replace(/status=\\"/g, 'status="')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");

      processedTag = `${normalizedBeforeName}name="${encodedNameVal}"${closingTag}`;
    }

    // 规范化标签（确保有闭合）
    let normalizedTag = processedTag;
    if (
      !normalizedTag.endsWith('/>') &&
      !normalizedTag.includes('</markdown-custom-process>')
    ) {
      normalizedTag += '</markdown-custom-process>';
    }

    // 检查是否为“执行计划”
    const isPlan = /type=["']Plan["']/.test(normalizedTag);

    // 处理匹配项之前的文本
    const textBefore = dedupedText.slice(lastIndex, groupMatch.index);
    if (textBefore.trim() !== '') {
      flushGroup();
      result += textBefore;
    }

    if (isPlan) {
      flushGroup();
      result += `\n\n<div>${normalizedTag}</div>\n\n`;
    } else {
      currentGroup.push(normalizedTag);
    }

    lastIndex = blockRegex.lastIndex;
  }

  flushGroup();
  result += dedupedText.slice(lastIndex);

  return result;
}

export { extractTableToMarkdown, groupMarkdownProcesses, replaceMathBracket };
