/**
 * MarkdownRenderer utils 单元测试
 *
 * 重点覆盖 e179d3ae9 引入的性能优化路径：
 * - replaceMathBracket：base64 data URL 占位符 round-trip + 数学定界符替换
 * - groupMarkdownProcesses：快速短路（不含过程标签时直接返回）
 */
import { describe, expect, it } from 'vitest';
import {
  EMPHASIS_FLANKING_ZWSP,
  fixStrongEmphasisFlanking,
  groupMarkdownProcesses,
  looksLikeLatex,
  replaceMathBracket,
  unwrapLatexInlineCode,
} from '../utils';

/** 构造一个合法的 base64 data URL（仅长度可配置，内容不要求是真实图片） */
const makeDataUrl = (bodyLen = 100) =>
  `data:image/png;base64,${'A'.repeat(bodyLen)}`;

describe('replaceMathBracket', () => {
  it('空输入返回空串', () => {
    expect(replaceMathBracket('')).toBe('');
  });

  it('无定界符文本原样返回', () => {
    const text = 'hello world，没有数学公式';
    expect(replaceMathBracket(text)).toBe(text);
  });

  it('替换行内定界符 \\( \\) 为 $...$', () => {
    expect(replaceMathBracket('公式 \\(a + b\\) 结束')).toBe(
      '公式 $a + b$ 结束',
    );
  });

  it('替换块级定界符 \\[ \\] 为 $$...$$', () => {
    expect(replaceMathBracket('块 \\[\\int_0^1 x\\,dx\\] 尾')).toBe(
      '块 $$\\int_0^1 x\\,dx$$ 尾',
    );
  });

  it('base64 data URL 原样还原，不被当作定界符扫描', () => {
    const url = makeDataUrl(200);
    const text = `前缀 ![img](${url}) 后缀`;
    expect(replaceMathBracket(text)).toBe(text);
  });

  it('单个 data URL 内部即便含有形似定界符的片段也不被替换', () => {
    // base64 正文只用 A-Za-z0-9+/=，不会出现反斜杠，因此 \\/\\[ 这类定界符
    // 不可能落在 data URL 内部。这里构造一段不含反斜杠、但形似数学符号的正文，
    // 验证它被当作 data URL 整段跳过，内部的 ( ) 不被误判为行内定界符。
    const url = `data:image/png;base64,abc(def)ghi==`;
    const text = `${url}`;
    expect(replaceMathBracket(text)).toBe(text);
  });

  it('多个 data URL 共存：每个都完整还原，互不吞并（验证 \\s 被移除）', () => {
    // 旧正则字符类含 \s，会把 "URL1 + 空格 + URL2 的 data 前缀" 一起吞进第一个匹配，
    // 导致第二个 URL 丢失 "data" 前缀。这里用空格分隔两个 URL 来回归这一情况。
    const url1 = makeDataUrl(50);
    const url2 = makeDataUrl(60);
    const text = `${url1} ${url2}`;
    const result = replaceMathBracket(text);
    expect(result).toContain(url1);
    expect(result).toContain(url2);
    // 第二个 URL 必须仍以 "data:" 开头出现在结果里
    expect(result).toContain(' data:image/png;base64,');
  });

  it('data URL 与数学公式混合：两边各得其所', () => {
    const url = makeDataUrl(80);
    const text = `![img](${url}) 然后 \\(c = a + b\\)`;
    expect(replaceMathBracket(text)).toBe(`![img](${url}) 然后 $c = a + b$`);
  });

  it('反引号包住的 $...$ 公式会去掉反引号', () => {
    const text =
      '1. `$a^2 + b^2 = c^2$` 平方和\n2. `$\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}$` 分式';
    expect(replaceMathBracket(text)).toBe(
      '1. $a^2 + b^2 = c^2$ 平方和\n2. $\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}$ 分式',
    );
  });

  it('表格中反引号包住的 $...$ 也会拆开以便渲染', () => {
    const text =
      "| 3 | `$\\sqrt[3]{x}$` | $\\sqrt[3]{x}$ |\n| 13 | `$f'(x)$` | $f'(x)$ |";
    expect(replaceMathBracket(text)).toBe(
      "| 3 | $\\sqrt[3]{x}$ | $\\sqrt[3]{x}$ |\n| 13 | $f'(x)$ | $f'(x)$ |",
    );
  });

  it('像 LaTeX 的行内代码会拆成 $...$ 再渲染', () => {
    const text = "命令 `\\sqrt[3]{x}` 与 `f'(x)` 仅作展示";
    expect(replaceMathBracket(text)).toBe(
      "命令 $\\sqrt[3]{x}$ 与 $f'(x)$ 仅作展示",
    );
  });

  it('已有 $ 公式与 \\( \\) 混排时只转换括号定界符', () => {
    const text = '已有 $\\alpha$ 再写 \\(\\beta\\)';
    expect(replaceMathBracket(text)).toBe('已有 $\\alpha$ 再写 $\\beta$');
  });

  it('流式会话常见：反引号包住的 LaTeX 命令列表可转为公式', () => {
    const text =
      '6. 求和：`\\sum_{i=1}^{n}`\n16. 矩阵：`\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}`';
    expect(replaceMathBracket(text)).toBe(
      '6. 求和：$\\sum_{i=1}^{n}$\n16. 矩阵：$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$',
    );
  });

  it('普通代码行内片段保持反引号', () => {
    expect(replaceMathBracket('使用 `const x = 1` 声明')).toBe(
      '使用 `const x = 1` 声明',
    );
  });

  it('Windows 路径反引号保持原样，不被拆成 $...$ 公式', () => {
    const text =
      '工作目录 `D:\\mycomputer\\computer-project-workspace\\1754545591\\1560129`';
    expect(replaceMathBracket(text)).toBe(text);
  });
});

describe('looksLikeLatex / unwrapLatexInlineCode', () => {
  it('识别常见 LaTeX 命令与简单上下标', () => {
    expect(looksLikeLatex('\\frac{a}{b}')).toBe(true);
    expect(looksLikeLatex('\\sum_{i=1}^{n}')).toBe(true);
    expect(looksLikeLatex('\\lim_{x \\to 0}')).toBe(true);
    expect(looksLikeLatex('x^2')).toBe(true);
    expect(looksLikeLatex('x_i')).toBe(true);
    expect(looksLikeLatex("f'(x)")).toBe(true);
    expect(looksLikeLatex('|x|')).toBe(true);
    // 无反斜杠命令的代数式（此前会被误判成普通代码）
    expect(looksLikeLatex('a^2 + b^2')).toBe(true);
    expect(looksLikeLatex('a^2 + b^2 = c^2')).toBe(true);
    expect(looksLikeLatex('(a+b)^2 = a^2 + 2ab + b^2')).toBe(true);
  });

  it('排除普通代码', () => {
    expect(looksLikeLatex('const x = 1')).toBe(false);
    expect(looksLikeLatex('npm install')).toBe(false);
    expect(looksLikeLatex('foo.bar.ts')).toBe(false);
    expect(looksLikeLatex('x = 1')).toBe(false);
  });

  it('排除 snake_case 标识符（不误判为下标公式）', () => {
    expect(looksLikeLatex('search_tasks')).toBe(false);
    expect(looksLikeLatex('cancel_task')).toBe(false);
    expect(looksLikeLatex('list_running_tasks')).toBe(false);
    expect(looksLikeLatex('query_progress_or_result')).toBe(false);
    expect(looksLikeLatex('dispatch')).toBe(false);
    expect(looksLikeLatex('user_id')).toBe(false);
    expect(looksLikeLatex('x_axis')).toBe(false);
  });

  it('不把 Windows 路径误判为公式（\mycomputer 等小写目录段形似 LaTeX 命令）', () => {
    expect(
      looksLikeLatex(
        'D:\\mycomputer\\computer-project-workspace\\1754545591\\1560129',
      ),
    ).toBe(false);
    expect(looksLikeLatex('C:\\Users\\Public\\Desktop')).toBe(false);
    expect(looksLikeLatex('\\mycomputer\\project\\src')).toBe(false);
  });

  it('不把 JSON 转义 / 正则等反斜杠文本误判为公式', () => {
    expect(looksLikeLatex('\\n')).toBe(false);
    expect(looksLikeLatex('\\d+')).toBe(false);
    expect(looksLikeLatex('\\mycomputer')).toBe(false);
  });

  it('识别单字符下标公式（x_i、a_1、a_i + b_j）', () => {
    expect(looksLikeLatex('x_i')).toBe(true);
    expect(looksLikeLatex('a_1')).toBe(true);
    expect(looksLikeLatex('a_i + b_j')).toBe(true);
    expect(looksLikeLatex('x_{n+1}')).toBe(true);
  });

  it('unwrap 代数式反引号', () => {
    expect(
      unwrapLatexInlineCode(
        '1. 平方和：`a^2 + b^2`\n4. 完全平方：`(a+b)^2 = a^2 + 2ab + b^2`',
      ),
    ).toContain('$a^2 + b^2$');
    expect(
      unwrapLatexInlineCode('4. 完全平方：`(a+b)^2 = a^2 + 2ab + b^2`'),
    ).toContain('$(a+b)^2 = a^2 + 2ab + b^2$');
  });

  it('不改动围栏代码块内的反引号内容', () => {
    const text = '```\\n`\\frac{a}{b}`\\n```'.replace(/\\n/g, '\n');
    expect(unwrapLatexInlineCode(text)).toBe(text);
  });

  it('unwrap：`$...$` 去反引号，裸 LaTeX 加 $', () => {
    expect(unwrapLatexInlineCode('见 `$a^2$` 与 `\\alpha`')).toBe(
      '见 $a^2$ 与 $\\alpha$',
    );
  });

  it('unwrap：反引号 snake_case 标识符保持原样，不被当成公式', () => {
    const text =
      '`search_tasks` / `cancel_task` / `list_running_tasks` / `dispatch` 的 record/append 均一致 ✓，唯独 `query_progress_or_result` 这一个写错了。';
    expect(unwrapLatexInlineCode(text)).toBe(text);
  });

  it('分类标题后的 7. 8. 公式列表会拆成独立块（避免挤成一行）', () => {
    const input = [
      '**微积分**',
      '7. `$\\int_0^1 x^2 dx = \\frac{1}{3}$` 定积分',
      '8. `$\\frac{d}{dx} e^x = e^x$` 导数',
      '**三角函数**',
      '13. `$\\sin^2 \\theta + \\cos^2 \\theta = 1$` 恒等式',
    ].join('\n');
    const out = unwrapLatexInlineCode(input);
    expect(out).toContain('**微积分**\n\n7. $');
    expect(out).toContain('$ 定积分\n\n8. $');
    expect(out).toContain('$ 导数\n\n**三角函数**\n\n13. $');
  });
});

describe('fixStrongEmphasisFlanking', () => {
  it('结束 ** 前是标点、后紧跟数字时插入零宽实体', () => {
    const input = '1、**格式化代码（Shift+Option+F）**34';
    expect(fixStrongEmphasisFlanking(input)).toBe(
      `1、**格式化代码（Shift+Option+F）**${EMPHASIS_FLANKING_ZWSP}34`,
    );
  });

  it('结束 ** 前是引号、后紧跟汉字时插入零宽实体', () => {
    const input = '2、**格式化代码“Shift+Option+F）“**佛挡杀佛';
    expect(fixStrongEmphasisFlanking(input)).toBe(
      `2、**格式化代码“Shift+Option+F）“**${EMPHASIS_FLANKING_ZWSP}佛挡杀佛`,
    );
  });

  it('结束 ** 前不是标点时不改写（本身即可加粗）', () => {
    const input = '**加粗**后面的字';
    expect(fixStrongEmphasisFlanking(input)).toBe(input);
  });

  it('结束 ** 后没有紧跟内容时不改写', () => {
    const input = '**格式化代码（Shift+Option+F）**';
    expect(fixStrongEmphasisFlanking(input)).toBe(input);
  });

  it('结束 ** 后是空白时不改写', () => {
    const input = '**格式化代码（Shift+Option+F）** 34';
    expect(fixStrongEmphasisFlanking(input)).toBe(input);
  });

  it('围栏代码块内的 ** 不改写', () => {
    const input = '```\n**（F）**34\n```';
    expect(fixStrongEmphasisFlanking(input)).toBe(input);
  });

  it('行内代码中的 ** 不改写', () => {
    const input = '请输入 `**（F）**34`';
    expect(fixStrongEmphasisFlanking(input)).toBe(input);
  });

  it('聊天正文预处理同样会修复该加粗', () => {
    const input = '1、**格式化代码（Shift+Option+F）**34';
    expect(unwrapLatexInlineCode(input)).toContain(EMPHASIS_FLANKING_ZWSP);
    expect(replaceMathBracket(input)).toContain(EMPHASIS_FLANKING_ZWSP);
  });

  it('开始 ** 前是正文、后紧跟引号时两侧都插入零宽实体', () => {
    const input = '你好，就锁定**"我的、发顺丰"**发撒大概';
    expect(fixStrongEmphasisFlanking(input)).toBe(
      `你好，就锁定${EMPHASIS_FLANKING_ZWSP}**"我的、发顺丰"**${EMPHASIS_FLANKING_ZWSP}发撒大概`,
    );
  });

  it('开始 ** 前是正文、后紧跟引号且结束于行尾时只修开始符', () => {
    const input = '锁定**"我的"**';
    expect(fixStrongEmphasisFlanking(input)).toBe(
      `锁定${EMPHASIS_FLANKING_ZWSP}**"我的"**`,
    );
  });

  it('行首 **"引号加粗"** 后紧跟正文时只修结束符', () => {
    const input = '**"我的"**发撒大概';
    expect(fixStrongEmphasisFlanking(input)).toBe(
      `**"我的"**${EMPHASIS_FLANKING_ZWSP}发撒大概`,
    );
  });
});

describe('groupMarkdownProcesses', () => {
  it('空输入返回空串', () => {
    expect(groupMarkdownProcesses('')).toBe('');
  });

  it('不含 markdown-custom-process 标签时原样返回（短路）', () => {
    const text = `![img](${makeDataUrl(500)}) 普通文本，没有过程标签`;
    // 短路返回的是同一个引用，既验证行为也验证未进入正则扫描
    expect(groupMarkdownProcesses(text)).toBe(text);
  });

  it('含 base64 data URL 但无过程标签时不进入正则扫描', () => {
    const url = makeDataUrl(2000);
    const text = `![big](${url}) 文本`;
    // 大字符串下若误入正则扫描会明显变慢甚至改变内容，这里断言原样返回
    expect(groupMarkdownProcesses(text)).toBe(text);
  });

  it('单个过程标签被 div 包装保留', () => {
    const tag =
      '<markdown-custom-process executeId="e1" name="step1" type="Action"></markdown-custom-process>';
    const result = groupMarkdownProcesses(`前文\n${tag}\n后文`);
    expect(result).toContain('<div>');
    expect(result).toContain('<markdown-custom-process executeId="e1"');
    // 单个标签不合并为 group
    expect(result).not.toContain('markdown-custom-process-group');
  });

  it('连续多个过程标签合并为 markdown-custom-process-group', () => {
    const t1 =
      '<markdown-custom-process executeId="e1" name="a" type="Action"></markdown-custom-process>';
    const t2 =
      '<markdown-custom-process executeId="e2" name="b" type="Action"></markdown-custom-process>';
    const result = groupMarkdownProcesses(`${t1}\n${t2}`);
    expect(result).toContain('markdown-custom-process-group');
    expect(result).toContain('autoCollapse="false"');
  });

  it('工具调用组后开始输出正文时标记为自动收起', () => {
    const t1 =
      '<markdown-custom-process executeId="e1" name="a" type="ToolCall"></markdown-custom-process>';
    const t2 =
      '<markdown-custom-process executeId="e2" name="b" type="ToolCall"></markdown-custom-process>';
    const result = groupMarkdownProcesses(`${t1}\n${t2}\n执行完成后的正文`);

    expect(result).toContain(
      'markdown-custom-process-group autoCollapse="true"',
    );
  });

  it('忽略 Event，避免单条工具调用被错误包装为分组', () => {
    const toolExecuting =
      '<markdown-custom-process executeId="tool-1" name="new_page" type="ToolCall" status="EXECUTING"></markdown-custom-process>';
    const event =
      '<markdown-custom-process executeId="event-1" name="打开桌面" type="Event" status="FINISHED"></markdown-custom-process>';
    const toolFinished =
      '<markdown-custom-process executeId="tool-1" name="new_page" type="ToolCall" status="FINISHED"></markdown-custom-process>';
    const result = groupMarkdownProcesses(
      `${toolExecuting}\n${event}\n${toolFinished}`,
    );

    expect(result).not.toContain('markdown-custom-process-group');
    expect(result).not.toContain('event-1');
    expect(result).toContain('status="FINISHED"');
  });

  it('OpenUI 渲染调用始终单独成块，不进入默认收起的过程分组', () => {
    const openUi =
      '<markdown-custom-process executeId="openui-1" name="nuwax-openui_nuwax_render_openui" type="ToolCall" status="EXECUTING"></markdown-custom-process>';
    const action =
      '<markdown-custom-process executeId="action-1" name="read_file" type="ToolCall" status="FINISHED"></markdown-custom-process>';
    const result = groupMarkdownProcesses(`${openUi}\n${action}`);

    expect(result).not.toContain('markdown-custom-process-group');
    expect(result).toContain('executeId="openui-1"');
    expect(result).toContain('executeId="action-1"');
  });

  it('连续多个 OpenUI 调用均保持独立展开', () => {
    const first =
      '<markdown-custom-process executeId="openui-1" name="nuwax-openui_nuwax_render_openui" type="ToolCall" status="FINISHED"></markdown-custom-process>';
    const second =
      '<markdown-custom-process executeId="openui-2" name="nuwax-openui__nuwax_render_openui" type="ToolCall" status="EXECUTING"></markdown-custom-process>';
    const result = groupMarkdownProcesses(`${first}\n${second}`);

    expect(result).not.toContain('markdown-custom-process-group');
    expect(result.match(/<div><markdown-custom-process/g)).toHaveLength(2);
  });

  it('type=Plan 标签单独成块，type 排在 name 之前时不并入 group', () => {
    const plan =
      '<markdown-custom-process executeId="p1" type="Plan" name="plan"></markdown-custom-process>';
    const action =
      '<markdown-custom-process executeId="a1" type="Action" name="act"></markdown-custom-process>';
    const result = groupMarkdownProcesses(`${plan}\n${action}`);
    // Plan 单独成块，仅剩 1 个 Action 也单独成块，不形成 group
    expect(result).not.toContain('markdown-custom-process-group');
  });

  it('type=Plan 标签单独成块，type 排在 name 之后时也不并入 group', () => {
    // 回归：归一化把 name 之后的属性编码进 name 值，
    // 若 isPlan 在归一化后才判断，会因 type 被吞入 name 而漏判，导致 Plan 被误并入 group。
    const plan =
      '<markdown-custom-process executeId="p1" name="plan" type="Plan"></markdown-custom-process>';
    const action =
      '<markdown-custom-process executeId="a1" name="act" type="Action"></markdown-custom-process>';
    const result = groupMarkdownProcesses(`${plan}\n${action}`);
    // Plan 单独成块，仅剩 1 个 Action 也单独成块，不形成 group
    expect(result).not.toContain('markdown-custom-process-group');
  });

  it('同一 executeId 的重复标签只保留最后一个（去重）', () => {
    // SSE 流式追加可能产生同 executeId 的重复标签，实现应只保留最新一项
    const dup1 =
      '<markdown-custom-process executeId="dup" name="v1"></markdown-custom-process>';
    const dup2 =
      '<markdown-custom-process executeId="dup" name="v2"></markdown-custom-process>';
    const result = groupMarkdownProcesses(`${dup1}\n${dup2}`);
    expect(result).toContain('name="v2"');
    expect(result).not.toContain('name="v1"');
  });
});
