import type { AgentMode } from '@/components/business-component/AgentIntervention';
import type { UploadFileInfo } from '@/types/interfaces/common';

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
  /** 入队时快照 - 选中的技能（@技能），消费时需原样回放，否则会丢失 */
  skillIds?: number[];
  /** 入队时快照 - 选中的模型 ID */
  modelId?: number;
  /** 入队时快照 - 智能体模式 */
  selectedAgentMode?: AgentMode;
}
