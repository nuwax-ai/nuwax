import { getToolPresentationKind } from '@/components/MarkdownCustomProcess/toolPresentation';
import type { AgentComponentTypeEnum } from '@/types/enums/agent';
import { normalizeFileDiffItems } from '@/utils/fileChangeDiff';

export interface FileMutatingToolCallInput {
  componentType?: AgentComponentTypeEnum | string;
  name?: string;
  result?: unknown;
}

const readSemanticKind = (result: unknown): unknown => {
  if (!result || typeof result !== 'object') {
    return undefined;
  }
  const record = result as Record<string, unknown>;
  const input =
    record.input && typeof record.input === 'object'
      ? (record.input as Record<string, unknown>)
      : undefined;
  return record.kind ?? input?.kind;
};

/**
 * 是否会改动工作区文件，从而需要刷新文件树。
 * 与会话渲染的工具文件对比同一口径：展示类型为 file-edit，或结果能解析出 diff。
 * 删除不一定带 diff，额外认 kind=delete/remove 和删除类工具名。
 */
export function isFileMutatingToolCall(
  input: FileMutatingToolCallInput,
): boolean {
  if (getToolPresentationKind(input) === 'file-edit') {
    return true;
  }
  if (normalizeFileDiffItems(input.result).length > 0) {
    return true;
  }
  const semanticKind = readSemanticKind(input.result);
  if (semanticKind === 'delete' || semanticKind === 'remove') {
    return true;
  }
  return /(删除|delete_file|remove_file|unlink)/i.test(input.name || '');
}
