import { describe, expect, it } from 'vitest';

import { resolvePasteAction } from './resolvePasteAction';

const img = (type = 'image/png') => ({ kind: 'file', type });
const text = (type = 'text/plain') => ({ kind: 'string', type });

describe('resolvePasteAction (NW-128 粘贴转图)', () => {
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

  it('文字+快照图场景下，修饰键无从读取也无需区分：结果恒为文字优先', () => {
    // ClipboardEvent 无 shiftKey 属性，文字优先规则使普通粘贴与
    // Ctrl/Cmd+Shift+V 结果一致（均不转图），无需修饰键检测
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
