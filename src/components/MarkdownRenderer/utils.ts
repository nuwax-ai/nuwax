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
    console.warn('提取表格单元格内容失败:', error);
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
    console.warn('提取表格行内容失败:', error);
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
    console.warn('提取表格区域内容失败:', error);
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
    console.warn('提取表格内容失败:', error);
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

export { extractTableToMarkdown, replaceMathBracket };
