/** 会话打开工作区文件时的预览刷新策略，沿用已有文件树行为。 */
export interface ConversationFilePreviewOptions {
  forceRefresh?: boolean;
  skipFileTreeRefresh?: boolean;
}

/**
 * 入口负责工作区的预览和文件选择，会话展示层只发出打开文件的动作。
 * Promise 完成表示预览切换、文件选中与重复选择触发已执行。
 */
export interface ConversationWorkspaceActions {
  openFile: (
    conversationId: number,
    fileId: string,
    options?: ConversationFilePreviewOptions,
  ) => void | Promise<void>;
}
