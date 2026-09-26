import type { ConversationEventReducerAdapters } from '@/features/conversation/domain/reduceConversationEvent';
import {
  isTerminalTaskStatus,
  resolveTerminalTaskStatus,
} from '@/features/conversation/domain/taskStatus';
import { shouldRefreshWorkspaceFiles } from '@/features/conversation/domain/workspaceFileChange';
import {
  AssistantRoleEnum,
  DefaultSelectedEnum,
  MessageModeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  AttachmentFile,
  ConversationChatParams,
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
// 直连纯函数模块：勿改回 '@/utils' 桶——桶转发组件链会在非 umi 环境（vitest/parity）
// 拉起 @umijs/bundler-utils 的 esbuild 触发 TextEncoder 不变量崩溃
import {
  emitConversationListTaskStatus,
  fetchConversationTaskStatus,
} from '@/utils/conversationTaskStatusSync';
import { extractTaskResult } from '@/utils/taskResult';
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
  /** 会话是否开启问题建议（FINAL 后拉取） */
  isSuggestEnabled?: boolean;
  /** isSync 语义（false = 隔离入口：不发乐观列表标记、不更新主题） */
  topicGate?: { isSync: boolean };
  /** 附加参数面（透传 chat 请求体，与旧线 SendMessageParams 对齐） */
  modelId?: number;
  agentMode?: string;
  skillIds?: number[];
  /** 选中的资料库文档（能力弹窗资料库 chip，与旧线 selectedDocs 对齐） */
  selectedDocs?: SelectedDocInfo[];
  sandboxId?: string;
  infos?: unknown[];
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
  /**
   * 干预事件必须先于通用 reducer 消费，否则 ASK/ACP 会被当作普通 PROCESSING，
   * 导致 DockPanel 丢失。具体协议解析由绑定层注入，runtime 核心不反向依赖组件层。
   */
  interventionAdapter?: {
    patchEvent: (
      event: ConversationChatResponse,
      currentMessage: MessageInfo,
      contextMessages: MessageInfo[],
    ) => MessageInfo | null;
    reconcileMessages?: (messages: MessageInfo[]) => MessageInfo[];
  };
  /** 历史详情与轮询快照进入 store 前的统一 hydrate（ASK 等历史协议重建）。 */
  hydrateHistoryMessages?: (messages: MessageInfo[]) => MessageInfo[];
  /** 后端 stop 请求句柄 */
  stopRequest?: (conversationId: string) => Promise<unknown>;
  /** 会话详情查询句柄（load 用；返回 hydrate 后的消息列表由绑定层负责） */
  loadRequest?: (
    conversationId: number,
  ) => Promise<{ data?: ConversationInfo } | undefined>;
  /**
   * 终态 taskStatus 写回通道（绑定层注入：写 conversationInfo）。
   * ERROR 事件 / onError / onClose 兜底查询统一经此写回，与旧线一致。
   */
  applyTaskStatus?: (
    conversationId: number | string,
    status: TaskStatus,
  ) => void;
}

export interface ConversationRuntimeSession {
  readonly store: ConversationMessageStore;
  readonly runtime: ConversationRuntime;
  send(input: RuntimeSessionSendInput): void;
  stop(conversationId: number | string): void;
  /** 切换会话时完整释放上一会话连接、消息与派生态。 */
  resetForConversationSwitch(): void;
  /** 对齐 legacy 的轮询/sub/live 终态统一清算。 */
  finalizeConversationTerminal(
    conversationId: number | string,
    status: TaskStatus,
  ): void;
  /** 仅清理前端活跃态，不中断连接、不发送后端 stop 请求。 */
  disableConversationActive(): void;
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

/**
 * 新线（runtime line）的会话运行时核心（双线方案 §3.2-3，R2 片）。
 *
 * 本片覆盖：乐观发送 → live 连接（transport）→ 事件投影（runtime reducer → store）
 * → recent/taskStatus 副作用（effects）→ stop/关闭/错误收尾。
 * 编排顺序逐字对齐旧线 model（handleConversation / onMessageSend / handleChangeMessageList
 * 的消息面），差异仅：写入经 store、副作用经 effects、连接经 transport。
 * load/snapshot/干预/恢复编排在 R3 片补全。
 *
 * 活跃态复位语义：所有非活跃路径（用户停止 stop / 连接关闭 onClose / 网络
 * 错误 onError / 协议终态）一律走 disableConversationActive 强制复位，
 * 不做「发送后 N 秒保活」——保活窗口会让发送后快速停止的会话永久卡在
 * 「执行中」（禅道 bug2528），且旧线停止路径同样是强制复位（user-stop）。
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
  /**
   * 当前会话的智能体快照（TaskAgent 收尾 / 版本管理判定用）：
   * load 详情与 send 快照双路写入，切会话时随 reset 清空
   *（对齐旧线 conversationInfoRef.current?.agent 的读取口径）。
   */
  let currentAgent: ConversationInfo['agent'] | undefined;
  /**
   * 本会话已确认的协议终态：终态后到达的轮询快照可能仍带滞后的 EXECUTING
   * 消息（服务端 messageList 落库晚于 taskStatus），reconcile 的稳定 ID 覆盖
   * 语义会把已收敛的 processing 盖回执行中——归并后按终态重新收敛
   *（对齐旧线 useConversationTerminalFinalizer 的 taskStatus 监听 sweep）。
   * send（新一轮）/ 切会话时清空。
   */
  let settledTerminalStatus: TaskStatus | null = null;
  // 停止接口跨异步边界：同会话新一轮或切页后，旧停止成功不得取消当前轮。
  let stopRequestGeneration = 0;
  const stateListeners = new Set<RuntimeSessionListener>();

  const notifyState = () => {
    stateListeners.forEach((listener) => {
      listener.onStateChanged?.();
    });
  };

  const disableConversationActive = () => {
    isConversationActive = false;
    notifyState();
  };

  const stop = (conversationId: number | string) => {
    const stopGeneration = ++stopRequestGeneration;
    // 1. 同时中断 live/sub；恢复流已接管时，只关闭 live 会使订阅标记与轮询永久悬挂。
    runtime.liveConnection.abortCurrent();
    resumeController.abortResumeStream();
    runtime.resetStreamProjection();
    // 2. 消息终态：Loading → Stopped，执行中 processing → FAILED
    store.finalizeOnClose();
    // 3. 活跃态：用户主动停止必须强制复位（对齐旧线 runStopConversation 的
    //    disabledConversationActive('user-stop')），不走 setConversationActive——
    //    它受「发送后 3s 保活」窗口约束，发送后快速停止时活跃态会被窗口
    //    拒绝落 false 而永久卡「执行中」，输入框停止/发送双双失效（禅道 bug2528）
    isAwaitingChatTerminal = false;
    disableConversationActive();
    // 4. 后端 stop 请求（绑定层注入句柄）
    if (config.stopRequest) {
      void config
        .stopRequest(String(conversationId))
        .then(() => {
          if (
            stopGeneration !== stopRequestGeneration ||
            String(currentConversationId) !== String(conversationId)
          ) {
            return;
          }
          // 等待停止接口期间可能已续接 sub，再清理一次；成功终态须写回绑定层，
          // 否则页面仍被 conversationInfo 的 EXECUTING 撑住，发送按钮不能恢复。
          resumeController.abortResumeStream();
          finalizeConversationTerminal(conversationId, TaskStatus.CANCEL);
          runtime.effects.dispatch({
            type: 'recent.status.patch',
            conversationId,
            status: TaskStatus.CANCEL,
          });
        })
        .catch((error) => {
          console.error('[runtimeSession] stop request failed:', error);
        });
    }
  };

  const finalizeConversationTerminal = (
    conversationId: number | string,
    status: TaskStatus,
  ) => {
    if (
      status === TaskStatus.EXECUTING ||
      (currentConversationId !== null &&
        String(currentConversationId) !== String(conversationId))
    ) {
      return;
    }
    isConversationActive = false;
    isAwaitingChatTerminal = false;
    settledTerminalStatus = status;
    store.finalizeOnTerminalTaskStatus(status);
    config.applyTaskStatus?.(conversationId, status);
    notifyState();
  };

  /**
   * 流事件投影（live 与 sub 恢复共用）：reducer 归并 → store 写入 +
   * requestId 记录 + ERROR 终态的 FAILED 补丁。旧线 handleChangeMessageList 的消息面。
   */
  const applyStreamEvent = (
    res: ConversationChatResponse,
    ownerMessageId: string,
    context?: {
      isSuggestEnabled?: boolean;
    },
  ) => {
    currentRequestId = res.requestId || '';
    const snapshot = store.getSnapshot();
    const currentMessage = snapshot.find(
      (message) => message.id === ownerMessageId,
    );
    const interventionPatch = currentMessage
      ? config.interventionAdapter?.patchEvent(res, currentMessage, snapshot)
      : null;
    if (interventionPatch) {
      const patchedMessages = snapshot.map((message) =>
        message.id === ownerMessageId ? interventionPatch : message,
      );
      store.applyStreamReduction(
        config.interventionAdapter?.reconcileMessages?.(patchedMessages) ??
          patchedMessages,
      );
      return;
    }

    const reduction = runtime.reduceStreamEvent(snapshot, ownerMessageId, res);
    store.applyStreamReduction(reduction.messages);

    const data = (res.data ?? {}) as Record<string, unknown>;
    const conversationId = currentConversationId;

    if (res.eventType === 'ERROR') {
      if (conversationId !== null) {
        finalizeConversationTerminal(conversationId, TaskStatus.FAILED);
        runtime.effects.dispatch({
          type: 'recent.status.patch',
          conversationId,
          status: TaskStatus.FAILED,
        });
      }
      return;
    }

    if (res.eventType === 'PROCESSING' && conversationId !== null) {
      const processing = (reduction.processing ?? data) as Record<string, any>;
      const input = processing?.result?.input ?? {};
      // 编辑/新增等结束后才刷新；搜索和工具开始不代表树有变化。
      // live / sub 与旧线使用同一语义，消费端继续保留 2s 节流与可见性门控。
      if (shouldRefreshWorkspaceFiles(processing)) {
        runtime.effects.dispatch({
          type: 'preview.file.refresh',
          conversationId: conversationId as number,
          mode: 'throttled',
        });
      }
      // 页面预览 / 链接打开（对齐旧线 PROCESSING 分支）
      if (processing?.status === 'EXECUTING' && data.type === 'Page') {
        const uriType = input.uri_type ?? 'Page';
        if (!uriType || uriType === 'Page') {
          runtime.effects.dispatch({
            type: 'preview.page.open',
            preview: {
              uri: input.uri,
              params: input.arguments || {},
              executeId: processing.executeId || data.executeId || '',
              method: input.method,
              request_id: input.request_id,
              data_type: input.data_type,
            },
          });
        }
        if (uriType === 'Link') {
          const queryString = new URLSearchParams(input.arguments).toString();
          runtime.effects.dispatch({
            type: 'preview.link.open',
            url: `${input.uri}?${queryString}`,
          });
        }
      }
      // 卡片
      if (
        processing?.status === 'FINISHED' &&
        processing?.cardBindConfig &&
        processing?.cardData
      ) {
        runtime.effects.dispatch({
          type: 'card.result.apply',
          cardBindConfig: processing.cardBindConfig,
          cardData: processing.cardData,
          append: res.requestId === currentRequestId,
        });
      }
      return;
    }

    if (res.eventType === 'FINAL_RESULT' && conversationId !== null) {
      // 「正在执行任务」冲突：确认后停止（对齐旧线 modalConfirm 分支，执行体经 effect）
      const errorText =
        (res.error as string | undefined) ??
        (data as { error?: string }).error ??
        '';
      if (errorText.includes('正在执行任务')) {
        runtime.effects.dispatch({
          type: 'conflict.confirmStop',
          conversationId: conversationId as number,
        });
      }
      // FINAL 明确终态写回（对齐旧线 applyTerminalTaskStatus(eventReduction.taskStatus)）
      const terminalStatus = resolveTerminalTaskStatus(
        (data as { success?: boolean }).success,
        data,
        res,
      );
      if (terminalStatus) {
        // applyStreamEvent 同时承接 live 与 sub；终态必须在这里统一清算，
        // 否则历史会话通过 sub 恢复时只会更新 taskStatus，Loading/工具态仍残留。
        finalizeConversationTerminal(conversationId, terminalStatus);
      }
      // TaskAgent 收尾组合体（对齐旧线 conversationInfo :1501-1547：立即刷文件树
      // → 按需刷 Git → task-result 文件选中开预览 → 未命中发兜底 trigger；
      // 执行体在消费端 taskResult.settle case，file 传含会话段的原始终路径）
      if (currentAgent?.type === AgentTypeEnum.TaskAgent) {
        const taskResult = extractTaskResult(
          (data as { outputText?: string }).outputText ?? '',
        );
        runtime.effects.dispatch({
          type: 'taskResult.settle',
          conversationId: conversationId as number,
          taskResult: {
            hasTaskResult: taskResult.hasTaskResult,
            file: taskResult.file,
          },
          enableVersionControl:
            // 与 isAgentVersionControlEnabled 同语义（枚举直比，避免引入
            // agent.constants 的 i18nRuntime/umi 重链破坏非 umi 测试环境）
            currentAgent?.enableVersionControl === DefaultSelectedEnum.Yes,
        });
      }
      // 建议：会话开启时拉取
      if (context?.isSuggestEnabled) {
        runtime.effects.dispatch({
          type: 'suggest.fetch',
          params: { conversationId } as never,
        });
      }
      return;
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
    currentAgent = data?.agent;
    if (data?.messageList) {
      const hydratedMessages =
        config.hydrateHistoryMessages?.(data.messageList) ?? data.messageList;
      store.replaceFromHistory(hydratedMessages);
      return { ...data, messageList: hydratedMessages };
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
    store.mergeSnapshot(config.hydrateHistoryMessages?.(incoming) ?? incoming);
    // 终态后的快照归并以终态重收敛收尾：服务端 messageList 可能滞后于
    // taskStatus（EXECUTING 残留），reconcile 覆盖语义不得复活执行中工具
    if (
      settledTerminalStatus !== null &&
      settledTerminalStatus !== TaskStatus.EXECUTING
    ) {
      store.finalizeOnTerminalTaskStatus(settledTerminalStatus);
    }
  };

  const send = (input: RuntimeSessionSendInput) => {
    stopRequestGeneration += 1;
    const { conversationId, message } = input;
    // 取代上一轮连接：中断、重置投影
    runtime.liveConnection.abortCurrent();
    runtime.resetStreamProjection();
    currentConversationId = conversationId;
    // 新一轮发送：清上一轮终态记忆（终态自愈只对本轮快照生效）
    settledTerminalStatus = null;
    // send 携带快照时刷新 agent 快照（TaskAgent 收尾判定；隔离入口可缺省沿用）
    if (input.currentInfo?.agent) {
      currentAgent = input.currentInfo.agent;
    }

    isAwaitingChatTerminal = true;
    isConversationActive = true;
    notifyState();

    // 乐观「执行中」标记（经 effects；旧线 eventBus 直发等价）。
    // isSync 语义统一经 topicGate 携带（false = 隔离入口：不同步会话记录）
    if (input.topicGate?.isSync !== false) {
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
      selectedComponents: input.infos,
      sandboxId: input.sandboxId,
      skillIds: input.skillIds,
      selectedDocs: input.selectedDocs,
      modelId: input.modelId,
      agentMode: input.agentMode,
    } as unknown as ConversationChatParams;

    // 连接级终态解析记忆（与旧线 hasResolvedTerminalStatus 一致）
    let hasResolvedTerminalStatus = false;
    // 首事件即更名（对齐旧线 updateTopicOnce 时机）：本连接首个事件（任意类型）
    // 消费一次。此前分发挂在 FINAL 分支且要求 FINAL 为首事件——正常流式回答前面
    // 必有 MESSAGE/THINK 事件，到 FINAL 时恒为 false，改名接口永不触发（禅道 bug2382）
    let topicUpdateArmed = true;
    const liveRunId = runtime.liveConnection.startRun();

    const abortConnection = openLiveConversationStream(params, {
      onMessage: (res: ConversationChatResponse) => {
        if (!runtime.liveConnection.isCurrent(liveRunId)) {
          return;
        }
        let terminalStatus: TaskStatus | undefined;
        if (res.eventType === 'FINAL_RESULT') {
          terminalStatus = resolveTerminalTaskStatus(
            res.data?.success,
            res.data,
            res,
          );
          hasResolvedTerminalStatus = Boolean(terminalStatus);
        } else if (res.eventType === 'ERROR') {
          terminalStatus = TaskStatus.FAILED;
        }

        // 首轮消息后更新会话主题（gate 与旧线同源：快照存在且【未更名过或还没有
        // 名字】、非隔离入口 isSync 语义；bug2382：/api/project/create 预建的会话
        // 预置 topicUpdated=1+空 topic，仅看标记会被堵死，无名即应尝试命名；
        // 重复防护=执行体 needUpdateTopic 锁+后端 topicUpdated）
        if (topicUpdateArmed) {
          topicUpdateArmed = false;
          if (
            input.currentInfo &&
            (input.currentInfo.topicUpdated !== 1 ||
              !input.currentInfo.topic) &&
            input.topicGate?.isSync !== false
          ) {
            runtime.effects.dispatch({
              type: 'topic.update',
              conversationId,
              firstMessage: message,
              currentInfo: input.currentInfo,
            });
          }
        }

        notifyState();
        // 消息投影 + 事件分支副作用（live 与 sub 恢复共用）
        applyStreamEvent(res, currentMessageId, {
          isSuggestEnabled: input.isSuggestEnabled,
        });
        if (
          !terminalStatus &&
          (res.eventType === 'FINAL_RESULT' || res.eventType === 'ERROR')
        ) {
          isAwaitingChatTerminal = false;
          notifyState();
        }
      },
      onClose: () => {
        const ownsClose = () =>
          currentConversationId === conversationId &&
          !runtime.liveConnection.isSuperseded(liveRunId);
        // 过期连接：只清理自己的消息，不触碰新一轮（与旧线 superseded 保护一致）
        if (!ownsClose()) {
          store.finalizeOwnedOnStaleClose(currentMessageId);
          return;
        }
        store.finalizeOnClose();
        disableConversationActive();

        // FINAL 已解析出明确终态时不重复查询；否则异步兜底（与旧线一致）
        if (conversationId && !hasResolvedTerminalStatus) {
          // runtime 消费明确的状态值，不把 React setter 的函数式 updater
          // 误当对象读取（bug2528）。旧查询迟到时也不能终结新一轮或其列表状态。
          void fetchConversationTaskStatus(conversationId)
            .then((status) => {
              if (!ownsClose() || !status || !isTerminalTaskStatus(status)) {
                return;
              }
              config.applyTaskStatus?.(conversationId, status);
              emitConversationListTaskStatus(conversationId, status);
            })
            .catch((error) => {
              console.error(
                '[runtimeSession] sync terminal taskStatus failed:',
                error,
              );
            })
            .finally(() => {
              if (!ownsClose()) return;
              isAwaitingChatTerminal = false;
              notifyState();
            });
        } else {
          isAwaitingChatTerminal = false;
          notifyState();
        }

        if (input.topicGate?.isSync !== false && conversationId) {
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
          config.applyTaskStatus?.(conversationId, TaskStatus.FAILED);
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

  const resetForConversationSwitch = () => {
    stopRequestGeneration += 1;
    runtime.liveConnection.abortCurrent();
    resumeController.abortResumeStream();
    runtime.resetStreamProjection();
    store.reset();
    isConversationActive = false;
    isAwaitingChatTerminal = false;
    currentRequestId = '';
    currentConversationId = null;
    currentAgent = undefined;
    settledTerminalStatus = null;
    notifyState();
  };

  return {
    store,
    runtime,
    send,
    stop,
    resetForConversationSwitch,
    finalizeConversationTerminal,
    disableConversationActive,
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
      resetForConversationSwitch();
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
