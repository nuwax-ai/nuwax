import { describe, expect, it } from 'vitest';

import { resolvePasteAction, resolvePasteText } from './resolvePasteAction';

const img = (type = 'image/png') => ({ kind: 'file', type });
const text = (type = 'text/plain') => ({ kind: 'string', type });

describe('resolvePasteAction (NW-128 粘贴转图)', () => {
  it('只有可见 HTML 文字才能压过图片，隐藏节点及隐藏样式不参与取文', () => {
    const html = `<div hidden>隐藏</div><div style="display: none">隐藏</div>
      <div style="visibility: hidden">隐藏</div><div style="mso-hide:all">隐藏</div>
      <img alt="截图" src="x">`;
    const value = resolvePasteText('', html);
    expect(value).toBe('');
    expect(resolvePasteAction({ items: [img()], text: value })).toBe(
      'upload-files',
    );
    expect(resolvePasteText('', `${html}<p>可见正文</p>`)).toBe('可见正文');
  });

  it('HTML PRE 保留制表、换行和连续空白，普通段落仍按段落分行', () => {
    expect(
      resolvePasteText('', '<p>前言</p><pre>A\tB\nC  D</pre><p>结尾</p>'),
    ).toBe('前言\nA\tB\nC  D\n结尾');
    expect(resolvePasteText('', '<pre>  A\n\tB  </pre>')).toBe('  A\n\tB  ');
  });

  it('空白 plain 回退到可见 HTML；无可见文字时保留截图上传', () => {
    expect(resolvePasteText(' \n\t', '<p>可见正文</p>')).toBe('可见正文');
    const value = resolvePasteText(
      ' \n\t',
      '<div hidden>隐藏</div><img src="x">',
    );
    expect(value).toBe('');
    expect(resolvePasteAction({ items: [img()], text: value })).toBe(
      'upload-files',
    );
    expect(resolvePasteText('  原始\t文本\n', '<p>其他</p>')).toBe(
      '  原始\t文本\n',
    );
    expect(resolvePasteAction({ items: [img()], text: ' \n\t' })).toBe(
      'upload-files',
    );
  });

  it('HTML 仅在 plain 为空时补文字；表格换行，不读取图片 alt 或脚本样式', () => {
    expect(resolvePasteText('原始\t文本\n', '<p>另一份</p>')).toBe(
      '原始\t文本\n',
    );
    const html =
      '<style>bad</style><script>bad()</script><table><tr><td>甲 &amp; 乙</td><td>丙</td></tr><tr><td>丁</td><td>戊</td></tr></table><img alt="截图描述" src="x">';
    expect(resolvePasteText('', html)).toBe('甲 & 乙\t丙\n丁\t戊');
    expect(
      resolvePasteAction({ items: [img()], text: resolvePasteText('', html) }),
    ).toBe('insert-plain-text');
    expect(
      resolvePasteAction({
        items: [img()],
        text: resolvePasteText('', '<img alt="图片" src="x">'),
      }),
    ).toBe('upload-files');
    expect(
      resolvePasteAction({
        items: [img(), { kind: 'file', type: 'application/pdf' }],
        text: resolvePasteText('', html),
      }),
    ).toBe('upload-files');
  });

  it('纯图片截图（无文字）：继续上传附件（截图粘贴流不变）', () => {
    expect(
      resolvePasteAction({
        items: [img(), text()],
        text: '',
      }),
    ).toBe('upload-files');
  });

  it('Word/PPT 文字+渲染快照图（file 全为 image/*）：文字优先，不再转图', () => {
    expect(
      resolvePasteAction({
        items: [img('image/tiff'), text()],
        text: '季度汇总表',
      }),
    ).toBe('insert-plain-text');
  });

  it('纯文本剪贴板（无 file 项）：纯文本插入（去样式）', () => {
    expect(
      resolvePasteAction({
        items: [text(), { kind: 'string', type: 'text/html' }],
        text: 'hello',
      }),
    ).toBe('insert-plain-text');
  });

  it('同一组文字+快照图格式始终按文字优先分诊', () => {
    expect(
      resolvePasteAction({
        items: [img(), text()],
        text: '明确要文字',
      }),
    ).toBe('insert-plain-text');
  });

  it('文字混非图片文件实体（复制文件上传）：维持上传', () => {
    expect(
      resolvePasteAction({
        items: [img(), { kind: 'file', type: 'application/zip' }, text()],
        text: '/path/to/file.zip',
      }),
    ).toBe('upload-files');
  });

  it('items 为 null/空（老浏览器或异常 DataTransfer）：按纯文本处理', () => {
    expect(resolvePasteAction({ items: null, text: 'x' })).toBe(
      'insert-plain-text',
    );
    expect(resolvePasteAction({ items: [], text: '' })).toBe(
      'insert-plain-text',
    );
  });
});
