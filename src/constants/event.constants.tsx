import { EventTypeEnum } from '@/types/enums/event';

export const EVENT_TYPE: Record<string, EventTypeEnum> = {
  NewNotifyMessage: EventTypeEnum.NewNotifyMessage, // 新消息
  RefreshChatMessage: EventTypeEnum.RefreshChatMessage, // 刷新会话
  RefreshFileList: EventTypeEnum.RefreshFileList, // 刷新文件列表
};
