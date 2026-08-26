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
//
// 性能注意：
// 本函数对文本逐字符扫描，escapedBracketRule 内部还会对每个位置做 slice+startsWith。
// 当文本里包含 base64 data URL（单张图片可达数 MB）时，复杂度退化为 O(N^2)，
// 会长时间阻塞主线程导致页面无响应。
// data URL 内部不可能出现 \(\)/\[\] 数学定界符，因此扫描时整段跳过即可。
//
// 字符集说明：base64 编码只用 A-Za-z0-9+/=，中间不会出现空格或换行。
// 不匹配 \s：否则当两个 data URL 仅用空格分隔时，贪心匹配会把第一个 URL 尾部、
// 中间分隔空白、以及第二个 URL 的 "data" 前缀一起吞进第一个匹配，破坏后续渲染。
const DATA_URL_PLACEHOLDER_RE =
  /data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi;

/**
 * 若行内代码整体就是 $...$ / $$...$$ 公式，返回该公式文本；否则返回 null。
 * 模型常写成 `` `$a^2$` ``，需去掉反引号才能被 KaTeX 解析。
 */
function extractDollarWrappedMath(code: string): string | null {
  const s = code.trim();
  if (!s) return null;
  if (/^\$\$[\s\S]+\$\$$/.test(s)) return s;
  // 整段被一对 $ 包裹，且中间不再出现未转义的 $
  if (
    s.length >= 3 &&
    s.startsWith('$') &&
    s.endsWith('$') &&
    !s.startsWith('$$')
  ) {
    const inner = s.slice(1, -1);
    if (inner.length > 0 && !inner.includes('$')) return s;
  }
  return null;
}

/**
 * 常见 LaTeX 命令白名单（不含前导反斜杠）。
 * looksLikeLatex 只把「命中白名单的反斜杠命令」当作公式信号，
 * 避免 `\mycomputer`（Windows 路径目录段）、`\n`（JSON 转义）、
 * `\d+`（正则）等形似命令的普通文本被误判为 LaTeX。
 */
const LATEX_COMMANDS = new Set([
  // 希腊字母（含大写变体）
  'alpha',
  'beta',
  'gamma',
  'delta',
  'epsilon',
  'varepsilon',
  'zeta',
  'eta',
  'theta',
  'vartheta',
  'iota',
  'kappa',
  'lambda',
  'mu',
  'nu',
  'xi',
  'omicron',
  'pi',
  'varpi',
  'rho',
  'varrho',
  'sigma',
  'varsigma',
  'tau',
  'upsilon',
  'phi',
  'varphi',
  'chi',
  'psi',
  'omega',
  'Gamma',
  'Delta',
  'Theta',
  'Lambda',
  'Xi',
  'Pi',
  'Sigma',
  'Upsilon',
  'Phi',
  'Psi',
  'Omega',
  // 大运算符 / 积分 / 极限
  'sum',
  'prod',
  'coprod',
  'int',
  'iint',
  'iiint',
  'oint',
  'bigcap',
  'bigcup',
  'bigsqcup',
  'bigvee',
  'bigwedge',
  'bigodot',
  'bigotimes',
  'bigoplus',
  'biguplus',
  'lim',
  'limsup',
  'liminf',
  'sup',
  'inf',
  'max',
  'min',
  'gcd',
  'det',
  'dim',
  'ker',
  'deg',
  'exp',
  'ln',
  'log',
  'lg',
  'arg',
  'mod',
  'bmod',
  'pmod',
  // 初等函数
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'arcsin',
  'arccos',
  'arctan',
  'sinh',
  'cosh',
  'tanh',
  'coth',
  // 分式 / 根式 / 组合
  'frac',
  'dfrac',
  'tfrac',
  'cfrac',
  'sqrt',
  'root',
  'binom',
  'choose',
  'over',
  'atop',
  'overline',
  'underline',
  'overbrace',
  'underbrace',
  // 箭头
  'to',
  'gets',
  'rightarrow',
  'leftarrow',
  'leftrightarrow',
  'uparrow',
  'downarrow',
  'updownarrow',
  'Rightarrow',
  'Leftarrow',
  'Leftrightarrow',
  'mapsto',
  'longrightarrow',
  'longleftarrow',
  'longleftrightarrow',
  'Longrightarrow',
  'Longleftarrow',
  'rightleftharpoons',
  'hookrightarrow',
  'hookleftarrow',
  'nearrow',
  'searrow',
  'swarrow',
  'nwarrow',
  // 关系符
  'leq',
  'leqq',
  'geq',
  'geqq',
  'neq',
  'ne',
  'equiv',
  'sim',
  'simeq',
  'cong',
  'approx',
  'propto',
  'asymp',
  'subset',
  'supset',
  'subseteq',
  'supseteq',
  'subsetneq',
  'supsetneq',
  'in',
  'notin',
  'ni',
  'prec',
  'succ',
  'preceq',
  'succeq',
  'll',
  'gg',
  'lesssim',
  'gtrsim',
  'nless',
  'ngtr',
  // 集合 / 逻辑
  'cup',
  'cap',
  'setminus',
  'uplus',
  'sqcup',
  'sqcap',
  'vee',
  'wedge',
  'oplus',
  'ominus',
  'otimes',
  'oslash',
  'odot',
  'circledast',
  'circ',
  'bullet',
  'forall',
  'exists',
  'nexists',
  'neg',
  'lnot',
  'land',
  'lor',
  'top',
  'bot',
  'perp',
  'parallel',
  'mid',
  'nmid',
  'emptyset',
  'varnothing',
  // 符号常量
  'infty',
  'partial',
  'nabla',
  'aleph',
  'hbar',
  'imath',
  'jmath',
  'ell',
  'wp',
  'Re',
  'Im',
  'mho',
  'prime',
  'angle',
  'measuredangle',
  'because',
  'therefore',
  // 点 / 星号 / 分隔符
  'cdots',
  'ldots',
  'vdots',
  'ddots',
  'dots',
  'cdot',
  'times',
  'div',
  'pm',
  'mp',
  'ast',
  'star',
  'dagger',
  'ddagger',
  'diamond',
  'triangle',
  'square',
  'clubsuit',
  'diamondsuit',
  'heartsuit',
  'spadesuit',
  'langle',
  'rangle',
  'lceil',
  'rceil',
  'lfloor',
  'rfloor',
  'lbrace',
  'rbrace',
  'vert',
  'Vert',
  // 动态尺寸括号
  'left',
  'right',
  'middle',
  'big',
  'Big',
  'bigg',
  'Bigg',
  'bigl',
  'bigr',
  'Bigl',
  'Bigr',
  'biggl',
  'biggr',
  'Biggl',
  'Biggr',
  // 矩阵 / 环境
  'begin',
  'end',
  'array',
  'matrix',
  'pmatrix',
  'bmatrix',
  'vmatrix',
  'Vmatrix',
  'cases',
  'aligned',
  'align',
  'alignat',
  'gathered',
  'gather',
  'split',
  'equation',
  'multline',
  'substack',
  // 字体 / 文本
  'text',
  'mbox',
  'mathrm',
  'mathbf',
  'mathit',
  'mathcal',
  'mathscr',
  'mathfrak',
  'mathbb',
  'mathsf',
  'mathtt',
  'boldsymbol',
  'bm',
  'operatorname',
  'textbf',
  'textit',
  'textrm',
  'textsf',
  'texttt',
  'textup',
  'textnormal',
  'emph',
  // 重音 / 堆叠
  'hat',
  'widehat',
  'check',
  'tilde',
  'widetilde',
  'acute',
  'grave',
  'dot',
  'ddot',
  'breve',
  'bar',
  'vec',
  'overset',
  'underset',
  'stackrel',
  'limits',
  'nolimits',
  'displaystyle',
  'textstyle',
  'scriptstyle',
  // 间距 / 其他
  'quad',
  'qquad',
  'enspace',
  'thinspace',
  'medspace',
  'thickspace',
  'hspace',
  'vspace',
  'phantom',
  'hphantom',
  'vphantom',
  'newline',
  'tag',
  'label',
  'ref',
  'eqref',
  'pageref',
  'cite',
  'not',
  'colon',
  'coloneqq',
  'triangleq',
  'doteq',
  'fallingdotseq',
  'risingdotseq',
]);

/**
 * 判断行内代码是否更像 LaTeX 公式（模型常把公式误包在反引号里）
 * @param code - 行内代码内容（不含反引号）
 */
function looksLikeLatex(code: string): boolean {
  const s = code.trim();
  if (!s || s.length > 800) return false;
  // 整段已是 $...$ 时由 unwrap 直接去反引号；此处不含 $ 的裸 LaTeX
  if (s.includes('$')) return false;

  // Windows 盘符 / UNC 路径不是公式（D:\xxx、\\server\share）
  if (/^[A-Za-z]:[\\/]/.test(s)) return false;
  if (s.startsWith('\\\\')) return false;

  // LaTeX 命令优先（须在编程特征排除之前：`\sum_{i=1}^{n}` 含 `=` 但仍是公式）
  // 只认白名单内的命令，避免 `\mycomputer`、`\n`、`\d+` 等形似命令的
  // 路径 / 转义 / 正则被误判为公式。
  const commands = s.match(/\\[a-zA-Z]+/g);
  if (commands && commands.some((c) => LATEX_COMMANDS.has(c.slice(1)))) {
    return true;
  }

  // 明显编程 / URL（无 LaTeX 命令时）
  if (
    /\b(const|let|var|function|import|export|return|npm|yarn|pnpm|git)\b/.test(
      s,
    )
  ) {
    return false;
  }
  if (/=>|:\/\/|\.(js|ts|tsx|jsx|py|json|css|less)\b/i.test(s)) {
    return false;
  }

  // 代数式上下标：a^2 + b^2、(a+b)^2 = a^2 + 2ab + b^2
  // 允许 + - = () 空格等；上标 ^ 在普通标识符中几乎不出现，作为 LaTeX 强信号。
  // 仅含下划线的不在此判定，走下方下标规则（避免 snake_case 标识符被误判）
  if (
    /\^/.test(s) &&
    /^[A-Za-z0-9\s()[\]{}+\-*=.,'<>|\\^_/]+$/.test(s) &&
    /\^[A-Za-z0-9{(]/.test(s)
  ) {
    return true;
  }

  // 仅下标的 LaTeX（无上标）：
  // - 花括号下标 x_{i}、x_{n+1}：{ } 不是标识符字符，出现即视为公式
  // - 裸下标 x_i、a_1、a_i + b_j：仅当每个 _ 两侧都恰好是单个字母/数字，
  //   从而排除 snake_case 标识符（search_tasks、query_progress_or_result、x_axis）
  if (
    s.includes('_') &&
    !s.includes('^') &&
    /^[A-Za-z0-9\s()[\]{}+\-*=.,'<>|\\_/]+$/.test(s)
  ) {
    if (/[A-Za-z0-9]_\{[^}]*\}/.test(s)) return true;
    const noBraces = s.replace(/[{}]/g, '');
    // 剥离所有"单字符_单字符"片段（x_i、a_1），要求两侧都不是字母/数字
    const stripped = noBraces.replace(
      /(^|[^A-Za-z0-9])[A-Za-z0-9]_[A-Za-z0-9](?![A-Za-z0-9])/g,
      '$1',
    );
    // 残留的 _ 或多字符片段（x_axis 剥离 x_a 后剩 xis）说明是标识符而非公式
    if (stripped.includes('_')) return false;
    if (/[A-Za-z0-9]/.test(stripped)) return false;
    return true;
  }
  // 导数 / 函数：f'(x)、f(x)、sin(x)
  // 函数名限短：单字母可带撇号（导数），或 2-4 位小写初等函数名；
  // 参数限单一简单变量。避免 appendToolResult(mctx, "check_progress", ...)
  // 这类真实代码调用（长名 + 逗号/引号/空格参数）被误判为公式。
  if (/^(?:[A-Za-z]'{0,2}|[a-z]{2,4})\([A-Za-z0-9_]+\)$/.test(s)) return true;
  // 绝对值 |x|
  if (/^\|[^|]{1,40}\|$/.test(s)) return true;

  // 纯赋值类代码：x = 1（无上下标）仍排除
  if (/[=;]/.test(s)) return false;

  return false;
}

/**
 * 保证分类标题与「7. 8. …」公式列表按块级换行显示。
 *
 * CommonMark：有序列表若以非 1 的数字开头，不能打断当前段落。
 * 因此 `**微积分**\n7. $...$` 会被收成同一段，`\n` 变成空格，全部挤在一行。
 * 在标题、编号项前补空行，让每条公式成为独立列表项。
 */
function ensureBlockFormulaListLayout(text: string): string {
  if (!text || (!text.includes('**') && !/^\d+\.\s+/m.test(text))) {
    return text;
  }

  // 保护围栏代码，避免改写代码里的编号行
  const slots: string[] = [];
  const push = (match: string) => {
    const idx = slots.length;
    slots.push(match);
    return `\u0000${idx}\u0000`;
  };
  let protectedText = text.replace(/```[\s\S]*?```/g, push);
  protectedText = protectedText.replace(/~~~[\s\S]*?~~~/g, push);

  const lines = protectedText.split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isNumberedItem = /^\d+\.\s+\S/.test(trimmed);
    const isBoldOnlyHeading = /^\*\*[^*\n]+\*\*$/.test(trimmed);
    const isAtxHeading = /^#{1,6}\s+\S/.test(trimmed);
    const needsBlockBreak = isNumberedItem || isBoldOnlyHeading || isAtxHeading;

    if (
      needsBlockBreak &&
      out.length > 0 &&
      out[out.length - 1].trim() !== ''
    ) {
      out.push('');
    }
    out.push(line);
  }

  return out
    .join('\n')
    .replace(/\u0000(\d+)\u0000/g, (_m, idxStr) => slots[Number(idxStr)] ?? '');
}

/**
 * 将「像 LaTeX 的行内代码」转为 $...$，以便 KaTeX 渲染。
 * 不处理围栏代码块，避免改写真实代码示例。
 * 同时整理「**分类** / 7. 8. …」换行，避免非 1. 列表挤在同一段。
 */
function unwrapLatexInlineCode(text: string): string {
  if (!text) return text;

  let next = text;
  if (text.indexOf('`') !== -1) {
    const slots: string[] = [];
    const push = (match: string) => {
      const idx = slots.length;
      slots.push(match);
      return `\u0000${idx}\u0000`;
    };

    // 先保护围栏代码块
    next = next.replace(/```[\s\S]*?```/g, push);
    next = next.replace(/~~~[\s\S]*?~~~/g, push);

    next = next.replace(/`([^`\n]+)`/g, (full, code: string) => {
      // `` `$a^2$` `` → $a^2$
      const dollarWrapped = extractDollarWrappedMath(code);
      if (dollarWrapped) return dollarWrapped;
      if (!looksLikeLatex(code)) return full;
      return `$${code.trim()}$`;
    });

    next = next.replace(/\u0000(\d+)\u0000/g, (_m, idxStr) => {
      const idx = Number(idxStr);
      return slots[idx] ?? '';
    });
  }

  return ensureBlockFormulaListLayout(next);
}

/**
 * 保护不会被 \(...\) / \[...\] 转换逻辑扫描的片段：
 * - base64 data URL
 * - Markdown 围栏代码块 / 行内代码（避免代码示例里的括号被改写）
 * - 已有的 $...$ / $$...$$ 公式（避免 ds-markdown 宽松正则误伤
 *   如 $\sqrt[3]{x}$、$f'(x)$ 中的 [] / ()）
 */
function protectMathBracketSafeRegions(text: string): {
  text: string;
  restore: (input: string) => string;
} {
  const slots: string[] = [];
  const push = (match: string) => {
    const idx = slots.length;
    slots.push(match);
    return `\u0000${idx}\u0000`;
  };

  let next = text.replace(DATA_URL_PLACEHOLDER_RE, push);
  // 围栏代码块优先于行内代码
  next = next.replace(/```[\s\S]*?```/g, push);
  next = next.replace(/~~~[\s\S]*?~~~/g, push);
  // 行内代码须在 $ 公式之前保护，否则会吃掉 `$...$` 代码示例
  next = next.replace(/`[^`\n]+`/g, push);
  // 已有美元定界公式（先块级再行内）
  next = next.replace(/\$\$[\s\S]+?\$\$/g, push);
  next = next.replace(/\$[^$\n]+?\$/g, push);

  return {
    text: next,
    restore: (input: string) =>
      input.replace(/\u0000(\d+)\u0000/g, (_m, idxStr) => {
        const idx = Number(idxStr);
        return slots[idx] ?? '';
      }),
  };
}

function replaceMathBracket(text: string): string {
  if (!text) return '';

  // 0. 模型常把公式包在反引号里，先拆成 $...$ 再走后续定界符逻辑
  const withUnwrappedLatex = unwrapLatexInlineCode(text);

  // 1. 抽出 data URL / 代码 / 已有 $ 公式，避免误替换与 O(N^2) 扫描大字符串
  const { text: protectedText, restore } =
    protectMathBracketSafeRegions(withUnwrappedLatex);

  // 2. 创建只包含非美元符号分隔符的选项
  const nonDollarDelimiters = defaultDelimiters.filter(
    (delimiter) =>
      !delimiter.left.includes('$') && !delimiter.right.includes('$'),
  );

  const rule = escapedBracketRule(nonDollarDelimiters);
  let result = '';
  let pos = 0;

  while (pos < protectedText.length) {
    const match = rule(protectedText, pos);
    if (match.success) {
      // 添加匹配前的文本
      result += protectedText.slice(pos, match.start);
      // 替换为 $$ 分隔符
      const delimiter = match.display ? '$$' : '$';
      result += `${delimiter}${match.formula}${delimiter}`;
      pos = match.end;
    } else {
      // 没有匹配，添加当前字符
      result += protectedText[pos];
      pos++;
    }
  }

  // 3. 还原受保护片段
  return restore(result);
}

/**
 * 根据规则将连续的 markdown-custom-process 标签合并
 * 规则：
 * 1. 连续 2 个及以上的过程标签合并
 * 2. 中间包含“执行计划”的不合并（作为分隔符）
 * 3. 标签间只包含空白字符时不中断合并
 * 4. markdown-custom-think 思考标签按流式位置穿插保留，并作为分隔内容：
 *    其后到文本末尾仍有非空白内容（正文/后续标签）时标记 autoCollapse，
 *    尾部的活动思考保持展开；任何被后续内容超越的工具组统一标记收起
 * @param text - 待处理的 Markdown 文本
 * @returns 处理后的文本
 */
function groupMarkdownProcesses(text: string): string {
  if (!text) return '';

  // 快速短路：base64 data URL 内部不可能包含 markdown-custom-process 标签，
  // 若文本不含任何过程标签，直接返回原文，避免对大文本（如带 base64 图片的消息）做空正则扫描。
  if (
    text.indexOf('markdown-custom-process') === -1 &&
    text.indexOf('markdown-custom-think') === -1
  ) {
    return text;
  }

  // 匹配 markdown-custom-process 标签及其可选的 div/p 包装器
  // 注意：[^>]*? 虽然简单，但在绝大多数情况下足够。如果以后有更复杂的属性需求（如带 > 的属性），再考虑更复杂的正则
  const blockRegex =
    /(?:\s*<(?:div|p)>\s*)?(<markdown-custom-process\b[^>]*?>(?:<\/markdown-custom-process>)?)(?:\s*<\/(?:div|p)>\s*)?/g;

  // 匹配 markdown-custom-think 思考标签（纯属性、始终闭合）及同样的可选包装器
  const thinkTagRegex =
    /(?:\s*<(?:div|p)>\s*)?(<markdown-custom-think\b[^>]*><\/markdown-custom-think>)(?:\s*<\/(?:div|p)>\s*)?/g;

  // 1. 扫描所有匹配项，提取 executeId、类型并记录位置，以解决重复与连续冗余 Plan 问题
  const matches: {
    index: number;
    endIndex: number;
    executeId: string;
    fullMatch: string;
    tagMatch: string;
    isPlan: boolean;
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
      const isPlan = /type=\\?["']Plan\\?["']/i.test(tagMatch);
      matches.push({
        index: match.index,
        endIndex: blockRegex.lastIndex,
        executeId,
        fullMatch,
        tagMatch,
        isPlan,
      });
      lastIndexMap.set(executeId, match.index);
    }
  }

  // 2. 识别过滤项：只保留每个 executeId 的最后一项，且过滤相邻连续的 Plan（只保留连续 Plan 中的最后一个）
  const ignoreMatchIndices = new Set<number>();
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];

    // 原有的 executeId 去重过滤
    if (lastIndexMap.get(m.executeId) !== m.index) {
      ignoreMatchIndices.add(i);
      continue;
    }

    // 连续相邻 Plan 过滤
    if (m.isPlan) {
      let nextPlanIndex = -1;
      for (let j = i + 1; j < matches.length; j++) {
        const next = matches[j];
        if (next.isPlan) {
          // 只有当两者之间全是空白字符/换行符时，当前 Plan 才是连续冗余的
          const middleText = text.slice(m.endIndex, next.index);
          if (middleText.trim() === '') {
            nextPlanIndex = j;
          }
          break; // 只要遇到任何 Plan，不管连不连续都必须停止向后搜索
        } else {
          // 遇到非 Plan 节点，说明它们之间不连续，不能过滤
          break;
        }
      }

      if (nextPlanIndex !== -1) {
        ignoreMatchIndices.add(i);
      }
    }
  }

  let dedupedText = '';
  let lastPos = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (ignoreMatchIndices.has(i)) {
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

  // 当过程分组后开始输出正文时，说明这一组工具调用已经结束。
  // 将状态写入标签，使渲染组件可在流式正文到达时平滑自动收起分组。
  const flushGroup = (shouldAutoCollapse = false) => {
    if (currentGroup.length > 0) {
      if (currentGroup.length >= 2) {
        // 合并为组标签，增加换行确保不影响后续 markdown 解析，外层嵌套标准块级 div 以防解析为行内 p
        result += `\n\n<div><markdown-custom-process-group autoCollapse="${shouldAutoCollapse}">\n${currentGroup.join(
          '\n',
        )}\n</markdown-custom-process-group></div>\n\n`;
      } else {
        // 只有一个，保持原样
        result += `\n\n<div>${currentGroup[0]}</div>\n\n`;
      }
      currentGroup = [];
    }
  };

  // 3. 对去重后的 dedupedText 进行属性提取、自动安全 URL 编码、格式归一化及合并分组。
  //    过程标签与思考标签按文本位置序统一扫描：思考标签不参与去重，
  //    但作为真实流式位置上的分隔内容参与分组边界判定。
  const scanMatches: {
    index: number;
    endIndex: number;
    tagMatch: string;
    isThink: boolean;
  }[] = [];
  blockRegex.lastIndex = 0;
  while ((groupMatch = blockRegex.exec(dedupedText)) !== null) {
    scanMatches.push({
      index: groupMatch.index,
      endIndex: blockRegex.lastIndex,
      tagMatch: groupMatch[1],
      isThink: false,
    });
  }
  thinkTagRegex.lastIndex = 0;
  let thinkScanMatch: RegExpExecArray | null;
  while ((thinkScanMatch = thinkTagRegex.exec(dedupedText)) !== null) {
    scanMatches.push({
      index: thinkScanMatch.index,
      endIndex: thinkTagRegex.lastIndex,
      tagMatch: thinkScanMatch[1],
      isThink: true,
    });
  }
  scanMatches.sort((a, b) => a.index - b.index);

  for (const scanItem of scanMatches) {
    const tagMatch = scanItem.tagMatch;

    // 处理匹配项之前的文本
    const textBefore = dedupedText.slice(lastIndex, scanItem.index);
    if (textBefore.trim() !== '') {
      flushGroup(true);
      result += textBefore;
    }

    // 思考标签：不参与工具分组，原位置保留；其出现即宣判前面的工具组被超越。
    // 自身是否标记 autoCollapse 取决于其后是否还有内容（正文/后续标签）——
    // 尾部的活动思考块保持展开，被超越的历史思考块自动收起。
    if (scanItem.isThink) {
      flushGroup(true);
      const isThinkSuperseded =
        dedupedText.slice(scanItem.endIndex).trim() !== '';
      const cleanThinkTag = tagMatch.replace(
        /\s*autocollapse=\\?["'][^"']*\\?["']/gi,
        '',
      );
      const thinkTag = cleanThinkTag.replace(
        /^<markdown-custom-think\b/i,
        `<markdown-custom-think autoCollapse="${isThinkSuperseded}"`,
      );
      result += `\n\n<div>${thinkTag}</div>\n\n`;
      lastIndex = scanItem.endIndex;
      continue;
    }

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

    // 检查是否为"执行计划"——在归一化之前用原始标签判断，
    // 否则当 type 排在 name 之后时，归一化会把 type 编码进 name 值，导致 isPlan 漏判、Plan 被误并入 group。
    // 容忍 SSE 流式产生的转义引号（type=\"Plan\" / type=\'Plan\'）
    const isPlan = /type=\\?["']Plan\\?["']/i.test(tagMatch);
    // OpenUI 是对话中的正式交互内容，不是可折叠的执行日志。
    // 识别原始 name，避免属性归一化后 name 被 URL 编码而漏判。
    const isOpenUi =
      /name=\\?["'][^"']*nuwax_render_openui/i.test(tagMatch) ||
      /name=\\?["'][^"']*renderui/i.test(tagMatch);
    // Event 只用于传递内部状态，渲染层本来也不会展示；不能让它参与工具调用分组计数。
    const isEvent = /type=\\?["']Event\\?["']/i.test(tagMatch);

    // Event 默认只用于传递内部状态、不展示；但 RENDER_UI 专用事件
    // （type=Event，name=Backend.Sandbox.Event.renderUI）需作为 OpenUI 产物渲染，不能丢弃。
    if (isEvent && !isOpenUi) {
      lastIndex = scanItem.endIndex;
      continue;
    }

    if (isPlan || isOpenUi) {
      // Plan/OpenUI 是分组边界内容，其出现即宣判前面的工具组被超越，统一收起
      flushGroup(true);
      result += `\n\n<div>${normalizedTag}</div>\n\n`;
    } else {
      currentGroup.push(normalizedTag);
    }

    lastIndex = scanItem.endIndex;
  }

  // 最后一组工具调用后直接输出正文时，不会再进入下一次循环；
  // 这里需要检查尾部文本，确保这种最常见的流式完成场景也能触发自动收起。
  const trailingText = dedupedText.slice(lastIndex);
  flushGroup(trailingText.trim() !== '');
  result += trailingText;

  return result;
}

/**
 * 终态聚合：任务结束后只展示最后一段正文（workbuddy 式终态），
 * 前面的中间正文 / 思考块 / 工具调用（含已成组）统一聚合进单个「执行过程」折叠区。
 * 输入应为 groupMarkdownProcesses 的输出（标签已归一化去重）；
 * 流式进行中的消息不要调用（会破坏逐组折叠的过渡观感）。
 */
function collapseTerminalProcesses(text: string): string {
  if (!text) return '';
  if (
    text.indexOf('markdown-custom-process') === -1 &&
    text.indexOf('markdown-custom-think') === -1
  ) {
    return text;
  }

  // 与 groupMarkdownProcesses 的输出形态对应：块级标签一律包 <div>…</div>
  const groupBlockRegex =
    /<div><markdown-custom-process-group\b[^>]*>([\s\S]*?)<\/markdown-custom-process-group><\/div>/g;
  const processBlockRegex =
    /<div>(<markdown-custom-process\b[^>]*>(?:<\/markdown-custom-process>)?)<\/div>/g;
  const thinkBlockRegex =
    /<div>(<markdown-custom-think\b[^>]*><\/markdown-custom-think>)<\/div>/g;

  const blocks: { start: number; end: number; inner: string }[] = [];
  let blockMatch;
  while ((blockMatch = groupBlockRegex.exec(text)) !== null) {
    blocks.push({
      start: blockMatch.index,
      end: groupBlockRegex.lastIndex,
      inner: blockMatch[1].trim(),
    });
  }
  while ((blockMatch = processBlockRegex.exec(text)) !== null) {
    blocks.push({
      start: blockMatch.index,
      end: processBlockRegex.lastIndex,
      inner: blockMatch[1],
    });
  }
  while ((blockMatch = thinkBlockRegex.exec(text)) !== null) {
    blocks.push({
      start: blockMatch.index,
      end: thinkBlockRegex.lastIndex,
      inner: blockMatch[1],
    });
  }
  if (!blocks.length) return text;
  blocks.sort((a, b) => a.start - b.start);

  // 聚合终点：最后一个过程块之后的非空内容即「最后一段正文」（含 task-result 等产物），保留在外；
  // 尾部无正文（任务以过程收尾）时保留最后一个过程块在外，避免整条消息只剩一个折叠条。
  const lastBlock = blocks[blocks.length - 1];
  const hasTailText = text.slice(lastBlock.end).trim() !== '';
  const splitIndex = hasTailText ? lastBlock.end : lastBlock.start;
  const aggregatable = blocks.filter((block) => block.end <= splitIndex);
  if (!aggregatable.length) return text;

  // 按原顺序收集：块之间的中间正文（保留进折叠区）+ 块内容（组标签摊平，避免嵌套 group）
  const items: string[] = [];
  let cursor = 0;
  for (const block of aggregatable) {
    const between = text.slice(cursor, block.start).trim();
    if (between) items.push(between);
    items.push(block.inner);
    cursor = block.end;
  }
  const betweenTail = text.slice(cursor, splitIndex).trim();
  if (betweenTail) items.push(betweenTail);

  return (
    `\n\n<div><markdown-custom-process-group autoCollapse="false" terminal="true">\n${items.join(
      '\n',
    )}\n</markdown-custom-process-group></div>\n\n` + text.slice(splitIndex)
  );
}

export {
  collapseTerminalProcesses,
  ensureBlockFormulaListLayout,
  extractTableToMarkdown,
  groupMarkdownProcesses,
  looksLikeLatex,
  replaceMathBracket,
  unwrapLatexInlineCode,
};
