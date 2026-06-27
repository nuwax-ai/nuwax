import { EventTypeEnum } from '@/types/enums/event';

export const EVENT_TYPE: Record<string, EventTypeEnum> = {
  NewNotifyMessage: EventTypeEnum.NewNotifyMessage, // 新消息
  RefreshChatMessage: EventTypeEnum.RefreshChatMessage, // 刷新会话
  ChatFinished: EventTypeEnum.ChatFinished, // 会话结束后，更新会话状态
  RefreshConversationList: EventTypeEnum.RefreshConversationList, // 静默刷新左侧会话列表
  UpdateConversationListTaskStatus:
    EventTypeEnum.UpdateConversationListTaskStatus, // 乐观更新左侧会话执行状态
};
