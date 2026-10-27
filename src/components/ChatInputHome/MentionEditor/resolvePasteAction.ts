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
  /** text/plain flavor 内容（paste 事件内可同步读取） */
  text: string;
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
