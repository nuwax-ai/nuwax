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
import { createLogger } from '@/utils/logger';
import dayjs from 'dayjs';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const resumeStreamLogger = createLogger('[ResumeStreamHandlers]');

const isFrontendUuidMessageId = (id: unknown): boolean =>
  typeof id === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );

const isIncompleteStatus = (status: unknown): boolean =>
  status === MessageStatusEnum.Loading ||
  status === MessageStatusEnum.Incomplete;

const hasVisibleAssistantPayload = (message: MessageInfo): boolean =>
  !!(
    message.text ||
    message.think ||
    message.finalResult ||
    message.processingList?.length
  );

const hasPersistedCompleteAssistantTail = (
  list: MessageInfo[] | undefined | null,
): boolean => {
  const lastMessage = list?.[list.length - 1];
  return !!(
    lastMessage &&
    lastMessage.role === AssistantRoleEnum.ASSISTANT &&
    !isFrontendUuidMessageId(lastMessage.id) &&
    !isIncompleteStatus(lastMessage.status) &&
    hasVisibleAssistantPayload(lastMessage)
  );
};

const isResumeUserMessageEvent = (res: ConversationChatResponse): boolean =>
  res?.eventType === ConversationEventTypeEnum.MESSAGE &&
  (res.data?.role === AssistantRoleEnum.USER ||
    res.data?.messageType === MessageTypeEnum.USER);

const isSameUserMessage = (left: MessageInfo, right: MessageInfo): boolean => {
  if (left.id && right.id) {
    return String(left.id) === String(right.id);
  }
  return (
    left.role === AssistantRoleEnum.USER &&
    right.role === AssistantRoleEnum.USER &&
    (left.text || '').trim() === (right.text || '').trim() &&
    !!(left.text || right.text)
  );
};

const buildResumeUserMessage = (res: ConversationChatResponse): MessageInfo => {
  const data = res.data || {};
  return {
    ...data,
    role: AssistantRoleEnum.USER,
    type: data.type || MessageModeEnum.CHAT,
    text: data.text || '',
    think: data.think || '',
    time: data.time || dayjs().toString(),
    id: data.id || uuidv4(),
    messageType: MessageTypeEnum.USER,
    status: MessageStatusEnum.Complete,
  } as MessageInfo;
};

const summarizeMessage = (message: MessageInfo | undefined) =>
  message
    ? {
        id: message.id,
        role: message.role,
        type: message.type,
        status: message.status,
        textLength: (message.text || '').length,
        thinkLength: (message.think || '').length,
      }
    : null;

const summarizeListTail = (list: MessageInfo[] | undefined | null) =>
  (list || []).slice(-5).map(summarizeMessage);

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
  // 当前 sub 订阅的会话 id：同会话重入直接复用，避免无条件 abort 重建
  //（多实例共享同一 model 单例句柄时，这是防「互相踢线」的兜底）
  const resumeConversationIdRef = useRef<number | string | null>(null);
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
    resumeConversationIdRef.current = null;
    resumeMessageIdRef.current = null;
  }, []);

  // 追加一条空白 assistant 占位消息用于接收 sub 流式重建，返回其 id。
  // 仅复用「本次恢复已追加的占位」（resumeMessageIdRef 记忆），【不】复用历史里的任何消息——
  // 否则会把别的（崩溃/旧）任务残留的 Incomplete 气泡当成占位，把本任务输出合并进去。
  // 按从头重放语义，历史不含执行中消息，故始终追加新占位。
  const ensureResumeAssistantPlaceholder = useCallback(
    (currentList: MessageInfo[], debugSource: string): string => {
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
      setMessageList((prev) => {
        const prevList = prev || [];
        // reload 快照是 sub 恢复前的权威历史，里面可能刚补上外部写入的 user。
        // 不能因为旧 prev 更长就沿用 prev，否则会把这个 user 丢掉，只显示 assistant 占位。
        const baseList = currentList.length ? currentList : prevList;
        if (baseList.some((m) => m.id === placeholderId)) {
          resumeStreamLogger.info('placeholder exists', {
            source: debugSource,
            placeholderId,
            baseTail: summarizeListTail(baseList),
          });
          return baseList;
        }
        resumeStreamLogger.info('append assistant placeholder', {
          source: debugSource,
          placeholderId,
          baseTail: summarizeListTail(baseList),
        });
        return [...baseList, placeholder];
      });
      return placeholderId;
    },
    [setMessageList],
  );

  const upsertResumeUserMessage = useCallback(
    (
      res: ConversationChatResponse,
      assistantPlaceholderId: string,
      debugSource: string,
    ) => {
      const userMessage = buildResumeUserMessage(res);
      setMessageList((prev) => {
        const list = prev || [];
        const existingIndex = list.findIndex((item) =>
          isSameUserMessage(item, userMessage),
        );
        const assistantIndex = list.findIndex(
          (item) => item.id === assistantPlaceholderId,
        );

        if (existingIndex >= 0) {
          // 如果之前误插在 assistant 后面，移动回当前轮 assistant 前，避免 user/assistant 顺序跳错。
          if (assistantIndex >= 0 && existingIndex > assistantIndex) {
            const next = [...list];
            const [existing] = next.splice(existingIndex, 1);
            const nextAssistantIndex = next.findIndex(
              (item) => item.id === assistantPlaceholderId,
            );
            next.splice(nextAssistantIndex, 0, existing);
            resumeStreamLogger.info('move existing user before placeholder', {
              source: debugSource,
              assistantPlaceholderId,
              user: summarizeMessage(existing),
              beforeTail: summarizeListTail(list),
              afterTail: summarizeListTail(next),
            });
            return next;
          }
          resumeStreamLogger.info('skip user upsert: already exists', {
            source: debugSource,
            assistantPlaceholderId,
            user: summarizeMessage(userMessage),
            tail: summarizeListTail(list),
          });
          return list;
        }

        const insertIndex = assistantIndex >= 0 ? assistantIndex : list.length;
        const next = [
          ...list.slice(0, insertIndex),
          userMessage,
          ...list.slice(insertIndex),
        ];
        resumeStreamLogger.info('insert sub user before placeholder', {
          source: debugSource,
          assistantPlaceholderId,
          insertIndex,
          user: summarizeMessage(userMessage),
          beforeTail: summarizeListTail(list),
          afterTail: summarizeListTail(next),
        });
        return next;
      });
    },
    [setMessageList],
  );

  // 订阅 EXECUTING 会话的流式恢复(sub)接口：用与 live chat 相同的 handleChangeMessageList 重建执行中的助手消息。
  const resumeConversationStream = useCallback(
    (
      conversationId: number | string,
      currentList: MessageInfo[],
      onClose?: () => void,
      debugSource = 'unknown',
    ) => {
      // 同会话重入直接复用：连接仍在订阅中时不 abort 重建。
      // 注意此处不调 onClose——连接还活着，调用方保持「已订阅」标记是正确的。
      if (
        resumeAbortRef.current &&
        resumeConversationIdRef.current === conversationId
      ) {
        resumeStreamLogger.info('skip resume: already subscribed', {
          source: debugSource,
          conversationId,
        });
        return;
      }
      abortResumeStream();
      resumeConversationIdRef.current = conversationId;
      resumeStreamLogger.info('resume stream:start', {
        source: debugSource,
        conversationId,
        currentTail: summarizeListTail(currentList),
      });
      // reload 快照已经带着最新落库 assistant 时，不再创建本地 UUID 占位去接 sub 重放。
      // 否则会出现一条 persisted assistant + 一条 resume placeholder 的重复气泡。
      if (hasPersistedCompleteAssistantTail(currentList)) {
        resumeStreamLogger.info('skip resume: persisted assistant tail', {
          source: debugSource,
          conversationId,
          currentTail: summarizeListTail(currentList),
        });
        resetResumeMessageState?.();
        onClose?.();
        return;
      }
      // 开流前重置 model 的流式状态（messageIdRef 等），保证重放从头正确，不受上次残留影响
      resetResumeMessageState?.();
      const currentMessageId = ensureResumeAssistantPlaceholder(
        currentList,
        debugSource,
      );
      const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
      resumeAbortRef.current = createSSEConnection({
        url: `${CONVERSATION_CHAT_SUB_URL}/${conversationId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json, text/plain, */*',
        },
        onMessage: (res: ConversationChatResponse) => {
          if (isResumeUserMessageEvent(res)) {
            upsertResumeUserMessage(res, currentMessageId, debugSource);
            return;
          }
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
          resumeConversationIdRef.current = null;
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
      upsertResumeUserMessage,
    ],
  );

  // 仅暴露外部需要的两个 action；ensureResumeAssistantPlaceholder 仅供内部使用（避免死公共接口）
  return { resumeConversationStream, abortResumeStream };
}
