import type { UploadFileInfo } from './common';

/** 队列中的待发送消息 */
export interface QueuedMessage {
  /** 队列项唯一 ID */
  id: string;
  /** 用户输入的文本内容 */
  text: string;
  /** 入队时间戳 */
  queuedAt: Date;
  /** 入队时快照 - 附件文件 */
  files?: UploadFileInfo[];
}
