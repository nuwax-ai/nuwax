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

/** 改了也不用重新打包预览的常见文本后缀 */
const COMMON_TEXT_EXTENSIONS = new Set([
  'md',
  'markdown',
  'mdx',
  'txt',
  'text',
  'json',
  'jsonc',
  'json5',
  'csv',
  'log',
  'xml',
  'yml',
  'yaml',
  'html',
  'htm',
  'ini',
  'conf',
  'rst',
]);

const FILE_PATH_KEYS = [
  'filePath',
  'file_path',
  'filepath',
  'path',
  'targetPath',
  'target_path',
];

/** 从工具记录里取出被操作的文件路径 */
const collectChangedFilePaths = (processing: unknown): string[] => {
  const item = record(processing);
  const result = record(item.result);
  const input = record(result.input);
  const rawInput = record(input.rawInput ?? input.raw_input);
  const paths: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      paths.push(value.trim());
    }
  };
  [input, rawInput, result].forEach((source) => {
    FILE_PATH_KEYS.forEach((key) => push(source[key]));
  });
  [result.data, result.content, input.content].forEach((list) => {
    if (!Array.isArray(list)) {
      return;
    }
    list.forEach((entry) => {
      const diff = record(entry);
      if (diff.type === 'diff') {
        push(diff.path);
      }
    });
  });
  return paths;
};

/** 路径后缀是否属于常见文本。没有后缀的文件不算文本 */
const isCommonTextFile = (filePath: string): boolean => {
  const base = filePath.split(/[/\\?#]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0) {
    return false;
  }
  return COMMON_TEXT_EXTENSIONS.has(base.slice(dot + 1).toLowerCase());
};

const latestRoundMessages = (
  messages: WorkspaceFileChangeMessage[] | null | undefined,
): WorkspaceFileChangeMessage[] => {
  if (!messages?.length) {
    return [];
  }
  let roundStart = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (isUserTurnMessage(messages[index])) {
      roundStart = index + 1;
      break;
    }
  }
  if (roundStart < 0) {
    return [];
  }
  return messages
    .slice(roundStart)
    .filter((message) => !isUserTurnMessage(message));
};

/**
 * 最近一轮用户消息之后，是否出现过实际文件变化。
 * 新增、修改、删除算；读取、搜索不算。终端命令不参与判断。
 */
export const latestRoundChangedWorkspaceFiles = (
  messages: WorkspaceFileChangeMessage[] | null | undefined,
): boolean => {
  try {
    return latestRoundMessages(messages).some((message) =>
      messageChangedWorkspaceFiles(message),
    );
  } catch (error) {
    console.error('判断本轮是否修改文件失败', error);
    return false;
  }
};

/**
 * 本轮改过的文件里，是否有需要重新打包预览的非文本文件。
 * md、txt、json 等常见文本不算。认不出路径时也重新打包，避免漏掉代码或资源。
 */
export const latestRoundNeedsPreviewRebuild = (
  messages: WorkspaceFileChangeMessage[] | null | undefined,
): boolean => {
  try {
    return latestRoundMessages(messages).some((message) => {
      const candidates = [
        ...(message.processingList ?? []),
        ...(message.componentExecutedList ?? []),
        ...(message.finalResult?.componentExecuteResults ?? []),
      ];
      return candidates.some((item) => {
        const processing = toFinishedToolProcessing(item);
        if (!processing || !shouldRefreshWorkspaceFiles(processing)) {
          return false;
        }
        const paths = collectChangedFilePaths(processing);
        if (!paths.length) {
          return true;
        }
        return paths.some((filePath) => !isCommonTextFile(filePath));
      });
    });
  } catch (error) {
    console.error('判断本轮是否需要重新打包预览失败', error);
    return false;
  }
};
