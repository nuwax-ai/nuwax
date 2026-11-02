/**
 * 粘贴分诊（NW-128 粘贴转图）
 *
 * Word/Excel/PPT/浏览器复制文字时，剪贴板常同时携带文本与渲染快照图
 * （image/tiff、image/png 等 file 项）。旧逻辑只要存在 file 项就整体转
 * 图片上传，文字被丢弃。这里按以下优先级分诊：
 *
 * 1. 有文字且所有 file 项均为图片（快照图场景）→ 纯文本，文字优先。
 *    ClipboardEvent 不带修饰键，只按事件实际提供的文字/文件格式分诊。
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
  if (text.trim() || !html) return text;

  // template 的内容保持 inert，图片、脚本及事件属性均不会在编辑器中生效。
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content
    .querySelectorAll(
      'script, style, title, noscript, template, svg, math, iframe, object, [hidden]',
    )
    .forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('[style]').forEach((node) => {
    // 不挂入页面计算样式，避免触发外部资源；过滤剪贴板明确标记的隐藏内容。
    const style = node.style;
    if (
      style.display === 'none' ||
      ['hidden', 'collapse'].includes(style.visibility) ||
      /(?:^|;)\s*mso-hide\s*:\s*all\b/i.test(node.getAttribute('style') ?? '')
    ) {
      node.remove();
    }
  });

  const parts: { text: string; preserve: boolean }[] = [];
  const append = (value: string, preserve = false) => {
    if (!value) return;
    const last = parts[parts.length - 1];
    if (last?.preserve === preserve) last.text += value;
    else parts.push({ text: value, preserve });
  };
  const newline = () => {
    const last = parts[parts.length - 1];
    if (last && !last.text.endsWith('\n')) append('\n');
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
  const visit = (node: Node, preserve = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent ?? '';
      append(preserve ? value : value.replace(/[\t\r\n ]+/g, ' '), preserve);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (node as Element).tagName;
    if (tag === 'BR') {
      append('\n', preserve);
      return;
    }
    if (blocks.has(tag)) newline();
    node.childNodes.forEach((child) => visit(child, preserve || tag === 'PRE'));
    if (tag === 'TD' || tag === 'TH') append('\t');
    if (blocks.has(tag)) newline();
  };
  template.content.childNodes.forEach((child) => visit(child));
  return parts
    .map((part, index) => {
      if (part.preserve) return part.text;
      let value = part.text
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n');
      if (index === 0) value = value.trimStart();
      if (index === parts.length - 1) value = value.trimEnd();
      return value;
    })
    .join('');
}

export function resolvePasteAction({
  items,
  text,
}: ResolvePasteActionInput): PasteAction {
  const fileItems = (items ?? []).filter((item) => item.kind === 'file');

  if (fileItems.length > 0) {
    // 文字 + 全图片文件（Word/PPT 等快照图）：文字优先，不再转图
    const allImages = fileItems.every((item) => item.type.startsWith('image/'));
    if (text.trim() && allImages) {
      return 'insert-plain-text';
    }

    // 纯图片截图，或混有非图片文件实体（复制文件上传场景）：维持上传
    return 'upload-files';
  }

  return 'insert-plain-text';
}
