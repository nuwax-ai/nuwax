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
import {
  createResumeController,
  type ResumeController,
} from './resumeController';

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

/** 绑定层注入的外部句柄（R3）：HTTP 与视图资源不进 session 核心，保持可测试性 */
export interface RuntimeSessionConfig {
  adapters: ConversationEventReducerAdapters;
  effectsAdapter: ConversationEffectsAdapter;
  /** 后端 stop 请求句柄 */
  stopRequest?: (conversationId: string) => Promise<unknown>;
  /** 会话详情查询句柄（load 用；返回 hydrate 后的消息列表由绑定层负责） */
  loadRequest?: (
    conversationId: number,
  ) => Promise<{ data?: ConversationInfo } | undefined>;
}

export interface ConversationRuntimeSession {
  readonly store: ConversationMessageStore;
  readonly runtime: ConversationRuntime;
  send(input: RuntimeSessionSendInput): void;
  stop(conversationId: number | string): void;
  /** 加载会话详情：消息整体替换（保留乐观尾）；返回会话数据供绑定层消费 */
  load(conversationId: number): Promise<ConversationInfo | undefined>;
  /** 轮询/恢复快照归并（conversationId 门禁，与旧线兼容回调同规则） */
  applySnapshot(conversationId: number | string, incoming: MessageInfo[]): void;
  /** sub 流式恢复（resumeController 编排，投影与 live 共用同一事件处理） */
  resumeConversationStream(
    conversationId: number | string,
    currentList: MessageInfo[],
    onClose?: () => void,
    debugSource?: string,
  ): void;
  abortResumeStream(): void;
  /** 绑定层注入滚动 refs（resumeController 的滚动跟随） */
  setViewRefs(
    messageViewRef: { current: HTMLDivElement | null },
    allowAutoScrollRef: { current: boolean },
  ): void;
  dispose(): void;
  getState(): {
    isConversationActive: boolean;
    isAwaitingChatTerminal: boolean;
    currentRequestId: string;
    currentConversationId: number | string | null;
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
export function createConversationRuntimeSession(
  config: RuntimeSessionConfig,
): ConversationRuntimeSession {
  const runtime = createConversationRuntime(config.adapters, {
    effectsAdapter: config.effectsAdapter,
    effectDispatchMode: 'live',
  });
  const store = createConversationMessageStore();

  // 会话级派生态（React 绑定经 subscribeState 消费）
  let isConversationActive = false;
  let isAwaitingChatTerminal = false;
  let currentRequestId = '';
  let currentConversationId: number | string | null = null;
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
    // 4. 后端 stop 请求（绑定层注入句柄）
    if (config.stopRequest) {
      void config.stopRequest(String(conversationId)).catch((error) => {
        console.error('[runtimeSession] stop request failed:', error);
      });
    }
  };

  /**
   * 流事件投影（live 与 sub 恢复共用）：reducer 归并 → store 写入 +
   * requestId 记录 + ERROR 终态的 FAILED 补丁。旧线 handleChangeMessageList 的消息面。
   */
  const applyStreamEvent = (
    res: ConversationChatResponse,
    ownerMessageId: string,
  ) => {
    currentRequestId = res.requestId || '';
    const reduction = runtime.reduceStreamEvent(
      store.getSnapshot(),
      ownerMessageId,
      res,
    );
    store.applyStreamReduction(reduction.messages);

    if (res.eventType === 'ERROR' && currentConversationId !== null) {
      runtime.effects.dispatch({
        type: 'recent.status.patch',
        conversationId: currentConversationId,
        status: TaskStatus.FAILED,
      });
    }
  };

  const load = async (conversationId: number) => {
    currentConversationId = conversationId;
    notifyState();
    if (!config.loadRequest) {
      return undefined;
    }
    const result = await config.loadRequest(conversationId);
    const data = result?.data;
    // 切换会话后丢弃过期返回（与旧线 reload 门禁同语义）
    if (currentConversationId !== conversationId) {
      return undefined;
    }
    if (data?.messageList) {
      store.replaceFromHistory(data.messageList);
    }
    return data;
  };

  const applySnapshot = (
    conversationId: number | string,
    incoming: MessageInfo[],
  ) => {
    // 会话不匹配时丢弃（与旧线 syncConversationSnapshotMessages 门禁一致）
    if (
      currentConversationId === null ||
      String(currentConversationId) !== String(conversationId)
    ) {
      return;
    }
    store.mergeSnapshot(incoming);
  };

  const send = (input: RuntimeSessionSendInput) => {
    const { conversationId, message } = input;
    // 取代上一轮连接：中断、重置投影
    runtime.liveConnection.abortCurrent();
    runtime.resetStreamProjection();
    currentConversationId = conversationId;

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

        notifyState();
        // 消息投影 + ERROR 终态补丁（live 与 sub 恢复共用）
        applyStreamEvent(res, currentMessageId);
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

  // sub 恢复编排（resumeController）：消息写入经 store.update（setState 形状兼容），
  // 事件投影与 live 共用 applyStreamEvent；滚动 refs 由绑定层经 setViewRefs 注入。
  let resumeMessageViewRef: { current: HTMLDivElement | null } = {
    current: null,
  };
  let resumeAllowAutoScrollRef: { current: boolean } = { current: true };
  const resumeController: ResumeController = createResumeController({
    runtime,
    setMessageList: (action) => {
      if (typeof action === 'function') {
        store.update(action as (prev: MessageInfo[]) => MessageInfo[]);
      }
    },
    handleChangeMessageList: (_params, res, ownerMessageId) => {
      applyStreamEvent(res, ownerMessageId);
    },
    messageViewRef: (() => ({
      get current() {
        return resumeMessageViewRef.current;
      },
      set current(value) {
        resumeMessageViewRef.current = value;
      },
    }))(),
    allowAutoScrollRef: (() => ({
      get current() {
        return resumeAllowAutoScrollRef.current;
      },
      set current(value) {
        resumeAllowAutoScrollRef.current = value;
      },
    }))(),
  });

  return {
    store,
    runtime,
    send,
    stop,
    load,
    applySnapshot,
    resumeConversationStream: (
      conversationId,
      currentList,
      onClose,
      debugSource,
    ) => {
      currentConversationId = conversationId;
      notifyState();
      resumeController.resumeConversationStream(
        conversationId,
        currentList,
        onClose,
        debugSource,
      );
    },
    abortResumeStream: () => {
      resumeController.abortResumeStream();
    },
    /** 绑定层注入滚动 refs（resumeController 的滚动跟随） */
    setViewRefs(
      messageViewRef: { current: HTMLDivElement | null },
      allowAutoScrollRef: { current: boolean },
    ) {
      resumeMessageViewRef = messageViewRef;
      resumeAllowAutoScrollRef = allowAutoScrollRef;
    },
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
      currentConversationId,
    }),
    subscribeState(listener) {
      stateListeners.add(listener);
      return () => {
        stateListeners.delete(listener);
      };
    },
  };
}
