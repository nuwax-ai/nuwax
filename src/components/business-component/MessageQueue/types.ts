import type { AgentMode } from '@/components/business-component/AgentIntervention';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { SelectedDocInfo } from '@/types/interfaces/repo';

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
  /** 入队时快照 - 选中的资料库文档（selectedDocs），消费时需原样回放 */
  selectedDocs?: SelectedDocInfo[];
  /** 入队时快照 - 专家 chip 组件（随消息合并进 selectedComponents），消费时需原样回放 */
  expertComponents?: AgentSelectedComponentInfo[];
  /** 入队时快照 - 选中的模型 ID */
  modelId?: number;
  /** 入队时快照 - 智能体模式 */
  selectedAgentMode?: AgentMode;
  /** 立即发送中：置位后该条展示 loading 且不可重复点击，实际消费发送后随队列出列移除 */
  sending?: boolean;
}
