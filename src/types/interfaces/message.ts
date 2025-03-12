import type { MessageReadStatusEnum } from '@/types/enums/menus';
import type { CreatorInfo } from '@/types/interfaces/agent';

// 查询用户消息列表输入参数
export interface NotifyMessageListParams {
  // 最后消息ID
  lastId: number;
  // 查询条数
  size: number;
  // 消息状态,可用值:Unread,Read
  readStatus: MessageReadStatusEnum;
}

// 用户消息信息
export interface NotifyMessageInfo {
  id: number;
  // 消息内容
  content: string;
  // 消息状态,可用值:Unread,Read
  readStatus: MessageReadStatusEnum;
  sender: CreatorInfo;
  // 创建时间（消息发送时间）
  created: string;
}
