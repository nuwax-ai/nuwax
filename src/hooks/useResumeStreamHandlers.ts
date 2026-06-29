import { CONVERSATION_CHAT_SUB_URL } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatParams,
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { createSSEConnection } from '@/utils/fetchEventSourceConversationInfo';
import dayjs from 'dayjs';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * 会话流式恢复(sub)的 SSE 订阅 handlers（共享）
 *
 * conversationInfo / conversationAgent 两个 model 的状态是隔离的，但「订阅 sub 流、
 * 用 handleChangeMessageList 重建执行中的助手消息」这段逻辑完全相同，集中在此避免双份维护漂移。
 *
 * 各 model 只需把自身的 setMessageList / handleChangeMessageList / messageViewRef /
 * allowAutoScrollRef / resetResumeMessageState 传入即可。refs（abort 句柄、占位 id）由本 hook 持有。
 */
export interface UseResumeStreamHandlersDeps {
  setMessageList: Dispatch<SetStateAction<MessageInfo[]>>;
  handleChangeMessageList: (
    params: ConversationChatParams,
    res: ConversationChatResponse,
    currentMessageId: string,
  ) => void;
  messageViewRef: MutableRefObject<HTMLDivElement | null>;
  allowAutoScrollRef: MutableRefObject<boolean>;
  /**
   * 重置 model 内会被 handleChangeMessageList 写入的流式状态（如 messageIdRef）。
   * 在 sub 开/关时调用，避免恢复流的工作流多步骤输出因上次残留 id 误插重复行。
   */
  resetResumeMessageState?: () => void;
}

export function useResumeStreamHandlers(deps: UseResumeStreamHandlersDeps) {
  const {
    setMessageList,
    messageViewRef,
    allowAutoScrollRef,
    resetResumeMessageState,
  } = deps;

  // sub 专用 abort 句柄：独立于各 model 的 abortConnectionRef，避免与 live 发送互相覆盖
  const resumeAbortRef = useRef<(() => void) | null>(null);
  // 本次恢复已追加的占位 id（防重复追加）
  const resumeMessageIdRef = useRef<string | null>(null);
  // 用 ref 持有最新的 handleChangeMessageList：onMessage 是异步回调，若直接闭包捕获会拿到
  // 首次渲染的旧版本（其读取的 conversationInfo?.agent?.hideDesktop 等会过期）。改读 ref.current。
  const handleChangeMessageListRef = useRef(deps.handleChangeMessageList);
  handleChangeMessageListRef.current = deps.handleChangeMessageList;

  // 中断会话流式恢复(sub)连接，并重置占位记忆
  const abortResumeStream = useCallback(() => {
    if (resumeAbortRef.current) {
      resumeAbortRef.current();
      resumeAbortRef.current = null;
    }
    resumeMessageIdRef.current = null;
  }, []);

  // 追加一条空白 assistant 占位消息用于接收 sub 流式重建，返回其 id。
  // 仅复用「本次恢复已追加的占位」（resumeMessageIdRef 记忆），【不】复用历史里的任何消息——
  // 否则会把别的（崩溃/旧）任务残留的 Incomplete 气泡当成占位，把本任务输出合并进去。
  // 按从头重放语义，历史不含执行中消息，故始终追加新占位。
  const ensureResumeAssistantPlaceholder = useCallback(
    (currentList: MessageInfo[]): string => {
      if (
        resumeMessageIdRef.current &&
        currentList.some((m) => m.id === resumeMessageIdRef.current)
      ) {
        return resumeMessageIdRef.current;
      }
      const placeholderId = uuidv4();
      resumeMessageIdRef.current = placeholderId;
      const placeholder = {
        role: AssistantRoleEnum.ASSISTANT,
        type: MessageModeEnum.CHAT,
        text: '',
        think: '',
        time: dayjs().toString(),
        id: placeholderId,
        messageType: MessageTypeEnum.ASSISTANT,
        status: MessageStatusEnum.Loading,
      } as MessageInfo;
      setMessageList((prev) => [...(prev || []), placeholder]);
      return placeholderId;
    },
    [],
  );

  // 订阅 EXECUTING 会话的流式恢复(sub)接口：用与 live chat 相同的 handleChangeMessageList 重建执行中的助手消息。
  const resumeConversationStream = useCallback(
    (
      conversationId: number | string,
      currentList: MessageInfo[],
      onClose?: () => void,
    ) => {
      abortResumeStream();
      // 开流前重置 model 的流式状态（messageIdRef 等），保证重放从头正确，不受上次残留影响
      resetResumeMessageState?.();
      const currentMessageId = ensureResumeAssistantPlaceholder(currentList);
      const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
      resumeAbortRef.current = createSSEConnection({
        url: `${CONVERSATION_CHAT_SUB_URL}/${conversationId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json, text/plain, */*',
        },
        onMessage: (res: ConversationChatResponse) => {
          // 读 ref.current 取最新的 handleChangeMessageList，避免 stale 闭包
          handleChangeMessageListRef.current(
            { conversationId } as ConversationChatParams,
            res,
            currentMessageId,
          );
          // 会话执行失败(ERROR)：主动断开 sub，使轮询恢复——FAILED 不属于「执行中」，
          // 也要继续轮询检测后续重试等状态变化（轮询只在「执行中 / document.hidden」时暂停）
          if (res?.eventType === ConversationEventTypeEnum.ERROR) {
            abortResumeStream();
          }
          // 流式恢复期间跟随自动滚动
          if (allowAutoScrollRef.current) {
            requestAnimationFrame(() => {
              const element = messageViewRef?.current;
              if (element) {
                // 标记程序滚动,避免被 useConversationScrollDetection 误判为用户滚动
                // 而把 allowAutoScrollRef 置 false,导致恢复流「滚一半就停」
                // (与 useUnifiedChatScroll.performScroll 的标志写法保持一致)
                (element as any).__isProgrammaticScroll = true;
                element.scrollTo({
                  top: element.scrollHeight,
                  behavior: 'instant',
                });
                setTimeout(() => {
                  (element as any).__isProgrammaticScroll = false;
                }, 100);
              }
            });
          }
        },
        onClose: () => {
          resumeAbortRef.current = null;
          // 关闭时再次重置，避免恢复流的残留 id 影响后续 live 发送
          resetResumeMessageState?.();
          onClose?.();
        },
      });
    },
    [
      abortResumeStream,
      ensureResumeAssistantPlaceholder,
      resetResumeMessageState,
    ],
  );

  // 仅暴露外部需要的两个 action；ensureResumeAssistantPlaceholder 仅供内部使用（避免死公共接口）
  return { resumeConversationStream, abortResumeStream };
}
