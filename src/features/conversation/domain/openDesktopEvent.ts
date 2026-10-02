import { HideDesktopEnum } from '@/types/enums/agent';

/**
 * 会话流是否要求打开远程桌面。
 * 与旧线一致：PROCESSING 数据的类型是 Event，子类型是 OPEN_DESKTOP。
 *
 * @param processing 一条 PROCESSING 数据
 * @returns 是否应打开远程桌面
 */
export const isOpenDesktopProcessingEvent = (
  processing?: {
    type?: string | null;
    subEventType?: string | null;
  } | null,
): boolean =>
  processing?.type === 'Event' && processing?.subEventType === 'OPEN_DESKTOP';

/** Chat、编排页收到打开桌面事件后的共同判断 */
export interface CanOpenDesktopFromEventInput {
  /** 事件所属会话 */
  conversationId?: number | string | null;
  /** 当前页面会话。传入后必须和事件会话一致 */
  pageConversationId?: number | string | null;
  /** 智能体是否隐藏远程桌面 */
  hideDesktop?: HideDesktopEnum | null;
  /** 当前生效电脑。空值按云电脑处理 */
  sandboxId?: string | number | null;
}

/**
 * 是否允许打开远程桌面。
 * 有会话、没有隐藏桌面、生效电脑是云电脑时才允许。
 * 传入当前页面会话时，事件会话必须对得上。
 *
 * @param input 会话、隐藏开关和生效电脑
 * @returns 是否调用页面的 openDesktopView
 */
export const canOpenDesktopFromEvent = ({
  conversationId,
  pageConversationId,
  hideDesktop,
  sandboxId,
}: CanOpenDesktopFromEventInput): boolean => {
  if (!conversationId) {
    return false;
  }
  if (
    pageConversationId != null &&
    pageConversationId !== '' &&
    Number(conversationId) !== Number(pageConversationId)
  ) {
    return false;
  }
  if (hideDesktop === HideDesktopEnum.Yes) {
    return false;
  }
  return String(sandboxId || '-1') === '-1';
};
