import type { ConversationEventReducerAdapters } from '@/features/conversation/domain/reduceConversationEvent';
import { resolveTerminalTaskStatus } from '@/features/conversation/domain/taskStatus';
import {
  AssistantRoleEnum,
  MessageModeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  ConversationChatParams,
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { syncTerminalConversationTaskStatus } from '@/utils/conversationTaskStatusSync';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import {
  createConversationMessageStore,
  type ConversationMessageStore,
} from './conversationMessageStore';
import { openLiveConversationStream } from './conversationTransport';
import {
  createConversationRuntime,
  type ConversationRuntime,
} from './createConversationRuntime';
import type { ConversationEffectsAdapter } from './effectDispatcher';

/** 新线发送输入（对齐旧线 SendMessageParams 的会话面） */
export interface RuntimeSessionSendInput {
  conversationId: number;
  message: string;
  files?: { key?: string; url?: string; name?: string; type?: string }[];
  variableParams?: Record<string, unknown>;
  debug?: boolean;
  isSync?: boolean;
  /** 发起时的会话信息快照（topic.update / 冲突提示等 gate 使用） */
  currentInfo?: ConversationInfo | null;
}

/** session 上报给 React 绑定层的非消息状态变化（R4 绑定消费） */
export interface RuntimeSessionListener {
  /** 会话级派生态变化（活跃/等终态/请求 ID） */
  onStateChanged?: () => void;
}

export interface ConversationRuntimeSession {
  readonly store: ConversationMessageStore;
  readonly runtime: ConversationRuntime;
  send(input: RuntimeSessionSendInput): void;
  stop(conversationId: number | string): void;
  /** 当前连接是否已过期（迟到回调只清理自己的消息） */
  dispose(): void;
  getState(): {
    isConversationActive: boolean;
    isAwaitingChatTerminal: boolean;
    currentRequestId: string;
  };
  subscribeState(listener: RuntimeSessionListener): () => void;
}

const SEND_KEEPALIVE_MS = 3000;

/**
 * 新线（runtime line）的会话运行时核心（双线方案 §3.2-3，R2 片）。
 *
 * 本片覆盖：乐观发送 → live 连接（transport）→ 事件投影（runtime reducer → store）
 * → recent/taskStatus 副作用（effects）→ stop/关闭/错误收尾。
 * 编排顺序逐字对齐旧线 model（handleConversation / onMessageSend / handleChangeMessageList
 * 的消息面），差异仅：写入经 store、副作用经 effects、连接经 transport。
 * load/snapshot/干预/恢复编排在 R3 片补全。
 */
export function createConversationRuntimeSession(config: {
  adapters: ConversationEventReducerAdapters;
  effectsAdapter: ConversationEffectsAdapter;
}): ConversationRuntimeSession {
  const runtime = createConversationRuntime(config.adapters, {
    effectsAdapter: config.effectsAdapter,
    effectDispatchMode: 'live',
  });
  const store = createConversationMessageStore();

  // 会话级派生态（React 绑定经 subscribeState 消费）
  let isConversationActive = false;
  let isAwaitingChatTerminal = false;
  let currentRequestId = '';
  let lastSendAt = 0;
  const stateListeners = new Set<RuntimeSessionListener>();

  const notifyState = () => {
    stateListeners.forEach((listener) => {
      listener.onStateChanged?.();
    });
  };

  const setConversationActive = (value: boolean) => {
    // 发送后保活窗口内拒绝置 false（与旧线「发送后 3s 保活」一致）
    if (!value && Date.now() - lastSendAt < SEND_KEEPALIVE_MS) {
      return;
    }
    isConversationActive = value;
    notifyState();
  };

  const disableConversationActive = () => {
    lastSendAt = 0;
    isConversationActive = false;
    notifyState();
  };

  const stop = (conversationId: number | string) => {
    // 1. 中断 live 连接（Controller 保证 abort exactly-once）并重置投影
    runtime.liveConnection.abortCurrent();
    runtime.resetStreamProjection();
    // 2. 消息终态：Loading → Stopped，执行中 processing → FAILED
    store.finalizeOnClose();
    // 3. 活跃态：与旧线 stop 路径一致——受「发送后 3s 保活」窗口约束（不强制落 false）
    setConversationActive(false);
    // 4. 后端 stop 请求（绑定层注入的 HTTP 句柄在 R3 片接入；本片先落消息面）
    void conversationId;
  };

  const send = (input: RuntimeSessionSendInput) => {
    const { conversationId, message } = input;
    // 取代上一轮连接：中断、重置投影
    runtime.liveConnection.abortCurrent();
    runtime.resetStreamProjection();

    isAwaitingChatTerminal = true;
    isConversationActive = true;
    lastSendAt = Date.now();
    notifyState();

    // 乐观「执行中」标记（经 effects；旧线 eventBus 直发等价）
    if (input.isSync !== false) {
      runtime.effects.dispatch({
        type: 'recent.status.patch',
        conversationId,
        status: TaskStatus.EXECUTING,
        context: {
          agentId: input.currentInfo?.agentId,
          topic: input.currentInfo?.topic,
        },
      });
    }

    const attachments: AttachmentFile[] =
      input.files?.map((file) => ({
        fileKey: file.key || '',
        fileUrl: file.url || '',
        fileName: file.name || '',
        mimeType: file.type || '',
      })) || [];

    const chatMessage = {
      role: AssistantRoleEnum.USER,
      type: MessageModeEnum.CHAT,
      text: message,
      time: dayjs().toString(),
      attachments,
      id: uuidv4(),
    } as MessageInfo;

    const currentMessageId = uuidv4();
    const currentMessage = {
      role: AssistantRoleEnum.ASSISTANT,
      type: MessageModeEnum.CHAT,
      text: '',
      think: '',
      time: dayjs().toString(),
      id: currentMessageId,
      status: MessageStatusEnum.Loading,
    } as MessageInfo;

    store.applyOptimisticRound(chatMessage, currentMessage);

    const params = {
      conversationId,
      variableParams: input.variableParams,
      message,
      attachments,
      debug: input.debug,
    } as unknown as ConversationChatParams;

    // 连接级终态解析记忆（与旧线 hasResolvedTerminalStatus 一致）
    let hasResolvedTerminalStatus = false;
    const liveRunId = runtime.liveConnection.startRun();

    const abortConnection = openLiveConversationStream(params, {
      onMessage: (res: ConversationChatResponse) => {
        if (res.eventType === 'FINAL_RESULT' || res.eventType === 'ERROR') {
          isAwaitingChatTerminal = false;
          notifyState();
        }
        if (res.eventType === 'FINAL_RESULT') {
          hasResolvedTerminalStatus = Boolean(
            resolveTerminalTaskStatus(res.data?.success, res.data, res),
          );
        }

        currentRequestId = res.requestId || '';
        notifyState();

        // 消息投影：reducer 归并 → store 写入（旧线 handleChangeMessageList 的消息面）
        const reduction = runtime.reduceStreamEvent(
          store.getSnapshot(),
          currentMessageId,
          res,
        );
        store.applyStreamReduction(reduction.messages);

        // 错误终态：侧栏列表 FAILED 补丁（经 effects）。
        // 会话信息 taskStatus 写回通道（setConversationInfo）在 R3 片接入绑定层。
        if (res.eventType === 'ERROR' && conversationId) {
          runtime.effects.dispatch({
            type: 'recent.status.patch',
            conversationId,
            status: TaskStatus.FAILED,
          });
        }
      },
      onClose: () => {
        // 过期连接：只清理自己的消息，不触碰新一轮（与旧线 superseded 保护一致）
        if (runtime.liveConnection.isSuperseded(liveRunId)) {
          store.finalizeOwnedOnStaleClose(currentMessageId);
          return;
        }
        lastSendAt = 0;
        store.finalizeOnClose();
        disableConversationActive();

        // FINAL 已解析出明确终态时不重复查询；否则异步兜底（与旧线一致）
        if (conversationId && !hasResolvedTerminalStatus) {
          // 终态兜底查询：taskStatus 写回通道在 R3 接入（本片完成后释放等终态标记）
          void syncTerminalConversationTaskStatus(conversationId, () => {})
            .catch((error) => {
              console.error(
                '[runtimeSession] sync terminal taskStatus failed:',
                error,
              );
            })
            .finally(() => {
              isAwaitingChatTerminal = false;
              notifyState();
            });
        } else {
          isAwaitingChatTerminal = false;
          notifyState();
        }

        if (input.isSync !== false && conversationId) {
          runtime.effects.dispatch({
            type: 'recent.list.refresh',
            conversationId,
            reason: 'stream-closed',
          });
        }
      },
      onError: () => {
        if (runtime.liveConnection.isSuperseded(liveRunId)) {
          store.markStreamError(currentMessageId);
          return;
        }
        store.markStreamError(currentMessageId);
        isAwaitingChatTerminal = false;
        if (conversationId) {
          runtime.effects.dispatch({
            type: 'recent.status.patch',
            conversationId,
            status: TaskStatus.FAILED,
          });
        }
        disableConversationActive();
      },
    });

    runtime.liveConnection.attach(liveRunId, abortConnection);
  };

  return {
    store,
    runtime,
    send,
    stop,
    dispose() {
      runtime.liveConnection.abortCurrent();
      runtime.resetStreamProjection();
      store.reset();
      isAwaitingChatTerminal = false;
      disableConversationActive();
    },
    getState: () => ({
      isConversationActive,
      isAwaitingChatTerminal,
      currentRequestId,
    }),
    subscribeState(listener) {
      stateListeners.add(listener);
      return () => {
        stateListeners.delete(listener);
      };
    },
  };
}
