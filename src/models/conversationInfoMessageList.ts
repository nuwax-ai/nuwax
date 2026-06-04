import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

export function appendOutgoingConversationMessages(
  messageList: MessageInfo[] | undefined,
  chatMessage: MessageInfo,
  currentMessage: MessageInfo,
): MessageInfo[] {
  const completeMessageList =
    messageList?.map((item: MessageInfo) => {
      if (item.status === MessageStatusEnum.Incomplete) {
        return {
          ...item,
          status: MessageStatusEnum.Complete,
        };
      }
      return item;
    }) || [];

  return [...completeMessageList, chatMessage, currentMessage];
}
