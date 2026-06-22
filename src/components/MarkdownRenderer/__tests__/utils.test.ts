/**
 * MarkdownRenderer utils 单元测试
 *
 * 重点覆盖 e179d3ae9 引入的性能优化路径：
 * - replaceMathBracket：base64 data URL 占位符 round-trip + 数学定界符替换
 * - groupMarkdownProcesses：快速短路（不含过程标签时直接返回）
 */
import { describe, expect, it } from 'vitest';
import { groupMarkdownProcesses, replaceMathBracket } from '../utils';

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
