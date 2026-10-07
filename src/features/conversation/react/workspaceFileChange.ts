import { shouldRefreshWorkspaceFiles } from '@/features/conversation/domain/workspaceFileChange';

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/** 判断本轮是否改过文件时用的消息片段 */
export interface WorkspaceFileChangeMessage {
  role?: string;
  messageType?: string;
  processingList?: unknown[];
  componentExecutedList?: unknown[];
  finalResult?: {
    componentExecuteResults?: unknown[];
  } | null;
}

const isUserTurnMessage = (message: WorkspaceFileChangeMessage): boolean => {
  const role = String(message.role ?? '').toUpperCase();
  const messageType = String(message.messageType ?? '').toUpperCase();
  const senderType = String(
    (message as { senderType?: string }).senderType ?? '',
  ).toUpperCase();
  return role === 'USER' || messageType === 'USER' || senderType === 'USER';
};

/** 把终态执行结果收成 shouldRefreshWorkspaceFiles 能识别的工具记录 */
const toFinishedToolProcessing = (value: unknown): unknown => {
  const item = record(value);
  if (typeof item.status === 'string' && item.type) {
    return item;
  }
  const nested = record(item.result);
  const source = nested.type || nested.kind || nested.name ? nested : item;
  if (!source.type && !source.name && !source.kind) {
    return null;
  }
  return {
    type: source.type ?? item.type,
    name: source.name ?? item.name,
    status: source.success === false ? 'FAILED' : 'FINISHED',
    result: source,
  };
};

/** 判断消息是否改过文件 */
const messageChangedWorkspaceFiles = (
  message: WorkspaceFileChangeMessage,
): boolean => {
  const candidates = [
    ...(message.processingList ?? []),
    ...(message.componentExecutedList ?? []),
    ...(message.finalResult?.componentExecuteResults ?? []),
  ];
  return candidates.some((item) => {
    const processing = toFinishedToolProcessing(item);
    return processing ? shouldRefreshWorkspaceFiles(processing) : false;
  });
};

/**
 * 最近一轮用户消息之后，是否出现过实际文件变化。
 * 新增、修改、删除算；读取、搜索不算。终端命令不参与判断。
 */
export const latestRoundChangedWorkspaceFiles = (
  messages: WorkspaceFileChangeMessage[] | null | undefined,
): boolean => {
  try {
    if (!messages?.length) {
      return false;
    }
    let roundStart = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (isUserTurnMessage(messages[index])) {
        roundStart = index + 1;
        break;
      }
    }
    if (roundStart < 0) {
      return false;
    }
    return messages
      .slice(roundStart)
      .some(
        (message) =>
          !isUserTurnMessage(message) && messageChangedWorkspaceFiles(message),
      );
  } catch (error) {
    console.error('判断本轮是否修改文件失败', error);
    return false;
  }
};
