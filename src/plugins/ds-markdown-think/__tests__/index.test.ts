import {
  appendThinkChunk,
  finalizeThinkBlock,
  getLegacyThinkBlock,
  hasOpenThinkBlock,
  stripThinkBlocks,
} from '../index';

const THINK_TAG = 'markdown-custom-think';

const encode = (value: string) => encodeURIComponent(value);

describe('ds-markdown-think appendThinkChunk', () => {
  it('无开放块时开新块：content 为 URL 编码文本', () => {
    const result = appendThinkChunk('', '让我分析需求');
    expect(result).toContain(
      `<${THINK_TAG} status="thinking" content="${encode('让我分析需求')}">`,
    );
    expect(hasOpenThinkBlock(result)).toBe(true);
  });

  it('开放块存在且增量未达滞回阈值时不重写', () => {
    let text = appendThinkChunk('', 'abc');
    const before = text;
    text = appendThinkChunk(text, 'abcdef');
    expect(text).toBe(before);
  });

  it('增量达到阈值后原地重写为全量内容', () => {
    let text = appendThinkChunk('', 'abc');
    text = appendThinkChunk(text, 'abc' + 'x'.repeat(120));
    expect(text).toContain(`content="${encode('abc' + 'x'.repeat(120))}"`);
    expect(hasOpenThinkBlock(text)).toBe(true);
  });

  it('finalize 收口：写入全量内容并置 finished', () => {
    let text = appendThinkChunk('', 'abc');
    text = appendThinkChunk(text, 'abcdef', true);
    expect(text).toContain(
      `<${THINK_TAG} status="finished" content="${encode('abcdef')}">`,
    );
    expect(hasOpenThinkBlock(text)).toBe(false);
  });

  it('上一轮收口后，新分片开启新一轮思考块', () => {
    let text = appendThinkChunk('', '第一轮');
    text = appendThinkChunk(text, '第一轮', true);
    text = appendThinkChunk(text, '第二轮');
    expect(hasOpenThinkBlock(text)).toBe(true);
    expect(text).toContain(encode('第一轮'));
    expect(text).toContain(encode('第二轮'));
  });

  it('空内容不产生空块（仅 finished 标记的收尾分片）', () => {
    expect(appendThinkChunk('', '', true)).toBe('');
    const withBody = appendThinkChunk('正文', '', true);
    expect(withBody).toBe('正文');
  });

  it('特殊字符（引号/尖括号/换行）编码后不出现在标签原文中', () => {
    const result = appendThinkChunk('', 'a"b<c>\nd&e');
    expect(result).not.toContain('a"b');
    expect(result).not.toContain('<c>');
    expect(result).toContain(`content="${encode('a"b<c>\nd&e')}"`);
    // 解码还原
    const encoded = result.match(/content="([^"]*)"/)![1];
    expect(decodeURIComponent(encoded)).toBe('a"b<c>\nd&e');
  });
});

describe('ds-markdown-think finalizeThinkBlock', () => {
  it('无开放块时幂等返回原文', () => {
    const text = '正文内容';
    expect(finalizeThinkBlock(text, '')).toBe(text);
  });

  it('收口时 roundContent 为空则保留标签内已写出的内容', () => {
    let text = appendThinkChunk('', '已经流式写出的思考');
    text = finalizeThinkBlock(text, '');
    expect(text).toContain(encode('已经流式写出的思考'));
    expect(text).toContain('status="finished"');
  });

  it('收口写入本轮全量内容（含未达滞回阈值的尾部）', () => {
    let text = appendThinkChunk('', 'abc');
    // 尾部增量只有 3 字符，未达阈值；收口必须补全
    text = finalizeThinkBlock(text, 'abcdef');
    expect(text).toContain(`content="${encode('abcdef')}"`);
  });
});

describe('ds-markdown-think 兼容工具', () => {
  it('getLegacyThinkBlock 生成已完成形态的标签块', () => {
    const block = getLegacyThinkBlock('历史思考');
    expect(block).toContain(
      `<${THINK_TAG} status="finished" content="${encode('历史思考')}">`,
    );
    expect(hasOpenThinkBlock(`正文${block}`)).toBe(false);
  });

  it('stripThinkBlocks 剥离思考标签，保留其余内容', () => {
    const block = getLegacyThinkBlock('思考内容');
    const text = `前文${block}后文`;
    expect(stripThinkBlocks(text)).toBe('前文后文');
  });
});
