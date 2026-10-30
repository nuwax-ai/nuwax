/**
 * 粘贴分诊（NW-128 粘贴转图）
 *
 * Word/Excel/PPT/浏览器复制文字时，剪贴板常同时携带文本与渲染快照图
 * （image/tiff、image/png 等 file 项）。旧逻辑只要存在 file 项就整体转
 * 图片上传，文字被丢弃。这里按以下优先级分诊：
 *
 * 1. 有文字且所有 file 项均为图片（快照图场景）→ 纯文本，文字优先。
 *    该规则同时覆盖 Ctrl/Cmd+Shift+V：修饰键无从读取（ClipboardEvent
 *    无 shiftKey），但文字优先后普通粘贴与 Shift 粘贴结果一致。
 * 2. 其余存在 file 项的情况（纯图片截图 / 混有非图片文件实体）→
 *    上传附件，维持旧行为。
 * 3. 无 file 项 → 纯文本（去样式插入，行为同旧逻辑）。
 */
export type PasteAction = 'upload-files' | 'insert-plain-text';

export interface PasteClipboardItemLike {
  kind: string;
  type: string;
}

export interface ResolvePasteActionInput {
  /** DataTransfer.items 的轻量快照（同步遍历展开） */
  items: readonly PasteClipboardItemLike[] | null;
  /** text/plain 或 HTML 中提取的纯文字（paste 事件内同步读取） */
  text: string;
}

/** plain 缺失时提取 HTML 文字；绝不将剪贴板 DOM 挂入页面。 */
export function resolvePasteText(text: string, html: string): string {
  if (text || !html) return text;

  // template 的内容保持 inert，图片、脚本及事件属性均不会在编辑器中生效。
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content
    .querySelectorAll(
      'script, style, title, noscript, template, svg, math, iframe, object',
    )
    .forEach((node) => node.remove());

  let result = '';
  const newline = () => {
    if (result && !result.endsWith('\n')) result += '\n';
  };
  const blocks = new Set([
    'P',
    'DIV',
    'LI',
    'UL',
    'OL',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'BLOCKQUOTE',
    'PRE',
    'TR',
    'TABLE',
  ]);
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += (node.textContent ?? '').replace(/[\t\r\n ]+/g, ' ');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (node as Element).tagName;
    if (tag === 'BR') {
      result += '\n';
      return;
    }
    if (blocks.has(tag)) newline();
    node.childNodes.forEach(visit);
    if (tag === 'TD' || tag === 'TH') result += '\t';
    if (blocks.has(tag)) newline();
  };
  template.content.childNodes.forEach(visit);
  return result
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
}

export function resolvePasteAction({
  items,
  text,
}: ResolvePasteActionInput): PasteAction {
  const fileItems = (items ?? []).filter((item) => item.kind === 'file');

  if (fileItems.length > 0) {
    // 文字 + 全图片文件（Word/PPT 等快照图）：文字优先，不再转图
    const allImages = fileItems.every((item) => item.type.startsWith('image/'));
    if (text && allImages) {
      return 'insert-plain-text';
    }

    // 纯图片截图，或混有非图片文件实体（复制文件上传场景）：维持上传
    return 'upload-files';
  }

  return 'insert-plain-text';
}
