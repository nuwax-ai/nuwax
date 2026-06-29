/**
 * ConversationAgent 页面专用会话状态 Model
 *
 * 与 conversationInfo 逻辑一致但状态完全隔离，
 * 避免 ConversationAgent 与 Chat / EditAgent 等页面共享同一会话状态。
 * 请勿修改 conversationInfo.ts，本文件独立维护。
 */
import {
  hydrateMcpAskInteractionsInMessageList,
  prependAndHydrateMcpAskMessageList,
  processInterventionSsePatch,
  useAgentInterventionHandlers,
} from '@/components/business-component/AgentIntervention';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  CONVERSATION_CONNECTION_URL,
  MESSAGE_PAGE_SIZE,
} from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { isSessionStreamBusy } from '@/hooks/useExecutingTaskStatusPoll';
import { useResumeStreamHandlers } from '@/hooks/useResumeStreamHandlers';
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import {
  apiAgentConversation,
  apiAgentConversationChatStop,
  apiAgentConversationChatSuggest,
  apiAgentConversationMessageList,
} from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import { AgentTypeEnum, OpenCloseEnum } from '@/types/enums/space';
import {
  AgentManualComponentInfo,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import type {
  AttachmentFile,
  ConversationChatParams,
  ConversationChatResponse,
  ConversationChatSuggestParams,
  ConversationInfo,
  MessageInfo,
  MessageQuestionExtInfo,
  ProcessingInfo,
  SendMessageParams,
} from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import { modalConfirm } from '@/utils/ant-custom';
import {
  createSyncConversationTaskStatus,
  subscribeChatFinishedTaskSync,
} from '@/utils/conversationTaskStatusSync';
import { createSSEConnection } from '@/utils/fetchEventSourceConversationInfo';
import {
  perfTracker,
  type MessagePerfLifecycle,
} from '@/utils/nuwaClawBridge/perfTracker';
import { adjustScrollPositionAfterDOMUpdate } from '@/utils/scrollUtils';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';

export default () => {
  const { showPagePreview, handleChatProcessingList } = useModel('chat');

  // 会话信息
  const [conversationInfo, setConversationInfo] =
    useState<ConversationInfo | null>();
  const conversationInfoRef = useRef<ConversationInfo | null>(null);
  useEffect(() => {
    conversationInfoRef.current = conversationInfo || null;
  }, [conversationInfo]);

  const syncConversationTaskStatus = useCallback(
    createSyncConversationTaskStatus(setConversationInfo),
    [],
  );

  useEffect(() => {
    return subscribeChatFinishedTaskSync(
      conversationInfo?.id,
      conversationInfo?.taskStatus,
      syncConversationTaskStatus,
    );
  }, [
    conversationInfo?.id,
    conversationInfo?.taskStatus,
    syncConversationTaskStatus,
  ]);

  // 是否用户问题建议
  // const [isSuggest, setIsSuggest] = useState<boolean>(false);
  const isSuggest = useRef(false);
  const setIsSuggest = (suggest: boolean) => {
    isSuggest.current = suggest;
  };
  // 是否还有更多消息, 默认没有更多消息，这样默认隐藏加载更多按钮
  const [isMoreMessage, setIsMoreMessage] = useState<boolean>(false);
  // 加载更多消息的状态
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);

  // 当前会话 ID（用于停止会话、干预回执等操作）
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);

  const { respondAcpPermission, respondMcpAsk } = useAgentInterventionHandlers({
    setMessageList,
    conversationId: currentConversationId,
  });

  // 缓存消息列表，用于消息会话错误时，修改消息状态（将当前会话的loading状态的消息改为Error状态）
  const messageListRef = useRef<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<
    string[] | GuidQuestionDto[]
  >([]);
  /** 发送新消息（含队列自动消费）时递增，用于丢弃过期的 suggest 响应 */
  const suggestGenerationRef = useRef(0);
  const pendingSuggestGenerationRef = useRef(0);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortConnectionRef = useRef<unknown>();
  // 会话消息ID
  const messageIdRef = useRef<string>('');
  // 是否正在加载会话
  const [, setIsLoadingConversation] = useState<boolean>(false);

  // 其它调用接口的情况下判断是否正在加载中用于禁用聊天发送按钮
  const [isLoadingOtherInterface, setIsLoadingOtherInterface] =
    useState<boolean>(false);

  // 会话是否正在进行中（有消息正在流式处理 Loading/Incomplete）
  const [isConversationActive, setIsConversationActiveRaw] =
    useState<boolean>(false);
  // 发送后 3s 内拒绝置 false，避免 SSE 回流间隙覆盖乐观 true
  const lastSendAtRef = useRef(0);
  const setIsConversationActive = useCallback((v: boolean) => {
    if (!v && Date.now() - lastSendAtRef.current < 3000) {
      return;
    }
    setIsConversationActiveRaw(v);
  }, []);

  // 添加一个 ref 来控制是否允许自动滚动
  const allowAutoScrollRef = useRef<boolean>(true);
  // 是否显示点击下滚按钮
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  // 可手动选择的组件列表
  const [manualComponents, setManualComponents] = useState<
    AgentManualComponentInfo[]
  >([]);

  // 当前会话请求 ID（用于停止临时会话等操作）
  const [currentConversationRequestId, setCurrentConversationRequestId] =
    useState<string>('');

  // 获取当前会话 ID
  const getCurrentConversationId = useCallback(() => {
    return currentConversationId;
  }, [currentConversationId]);

  // 获取当前会话请求 ID
  const getCurrentConversationRequestId = useCallback(() => {
    return currentConversationRequestId;
  }, [currentConversationRequestId]);

  // 滚动到底部
  const messageViewScrollToBottom = () => {
    // 只有在允许自动滚动时才执行滚动
    if (!allowAutoScrollRef.current) {
      return;
    }
    // 滚动到底部
    const element = messageViewRef.current;
    if (element) {
      // 标记为程序触发的滚动，避免被误判为用户滚动
      // 通过设置一个临时属性来标记
      (element as any).__isProgrammaticScroll = true;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
      // 在滚动完成后清除标记（smooth 滚动大约需要 500ms）
      setTimeout(() => {
        (element as any).__isProgrammaticScroll = false;
      }, 600);
    }
  };

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const handleScrollBottom = () => {
    if (allowAutoScrollRef.current) {
      scrollTimeoutRef.current = setTimeout(() => {
        // 滚动到底部
        messageViewScrollToBottom();
      }, 400);
    }
  };

  // 设置所有的详细信息
  const setChatProcessingList = (messages: MessageInfo[]) => {
    const list: any[] = [];
    messages
      .filter((item) => item.role === AssistantRoleEnum.ASSISTANT)
      .forEach((item) => {
        const componentExecutedList = item?.componentExecutedList || [];
        // 补充执行ID，过滤掉 result 为空或无 executeId 的条目（如 SandboxStart 类型）
        const _list = componentExecutedList
          .filter((item: any) => item?.result?.executeId)
          .map((item: any) => ({
            ...item,
            executeId: item.result.executeId,
          }));
        list.push(..._list);
      });

    handleChatProcessingList(list);
  };

  // 查询会话消息列表
  const { runAsync: runQueryConversationMessageList } = useRequest(
    apiAgentConversationMessageList,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  // 加载更多消息
  const handleLoadMoreMessage = async (conversationId: number) => {
    if (
      !conversationId ||
      loadingMore ||
      !isMoreMessage ||
      messageList?.length === 0
    ) {
      return;
    }

    // 使用消息列表第一项的 index 属性值作为查询的起始索引
    // 如果没有第一项或第一项没有 index 属性，则使用 0 作为默认值
    const firstMessage = messageList?.[0] as MessageInfo;
    const currentIndex = firstMessage?.index || 0;

    // 记录加载前的滚动高度和位置，用于保持滚动位置
    const messageView = messageViewRef.current;
    const oldScrollHeight = messageView?.scrollHeight || 0;
    const oldScrollTop = messageView?.scrollTop || 0;

    setLoadingMore(true);
    try {
      const { code, data } = await runQueryConversationMessageList({
        conversationId,
        index: currentIndex,
        size: MESSAGE_PAGE_SIZE,
      });

      if (code === SUCCESS_CODE) {
        // 如果查询到的消息数量大于0，则表示有更多消息
        if (!!data?.length) {
          // 将新消息追加到消息列表前面，并重建历史 MCP Ask 交互状态
          setMessageList((prev) =>
            prependAndHydrateMcpAskMessageList(data, prev),
          );

          // 如果查询到的消息数量小于20，则表示没有更多消息
          if (data.length < MESSAGE_PAGE_SIZE) {
            setIsMoreMessage(false);
          } else {
            setIsMoreMessage(true);
          }
          // 保持滚动位置（加载更多后，滚动位置应该保持在原来的位置）
          // 使用MutationObserver监听DOM变化，确保所有元素都渲染完成后再调整滚动位置
          adjustScrollPositionAfterDOMUpdate(
            messageView,
            oldScrollTop,
            oldScrollHeight,
          );
        } else {
          // 如果查询到的消息数量为0，则表示没有更多消息
          setIsMoreMessage(false);
        }
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  /** 根据最近消息是否含 Loading/Incomplete / processing 执行中 更新流式活跃状态 */
  const checkConversationActive = useCallback((messages: MessageInfo[]) => {
    const recentMessages = messages?.slice(-5) || [];
    setIsConversationActive(isSessionStreamBusy(recentMessages));
  }, []);

  const disabledConversationActive = () => {
    setIsConversationActive(false);
  };

  // 查询会话
  const {
    run: runQueryConversation,
    runAsync,
    loading: loadingConversation,
  } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    loadingDelay: 300, // 300ms内不显示loading
    onSuccess: (result: RequestResponse<ConversationInfo>) => {
      setIsLoadingConversation(false);
      const { data } = result;
      // 设置所有的详细信息
      setChatProcessingList(data?.messageList || []);
      // 设置会话信息
      setConversationInfo(data);
      // 记录当前会话 ID（用于停止会话等操作）
      setCurrentConversationId(data?.id ?? null);

      // 是否开启用户问题建议
      setIsSuggest(data?.agent?.openSuggest === OpenCloseEnum.Open);
      // 可手动选择的组件列表
      setManualComponents(data?.agent?.manualComponents || []);
      // 消息列表：拉取后重建 MCP Ask 交互（与 conversationInfo 对齐）
      const _messageList = hydrateMcpAskInteractionsInMessageList(
        data?.messageList || [],
      );
      const len = _messageList?.length || 0;
      if (len) {
        setMessageList(() => {
          checkConversationActive(_messageList);
          return _messageList;
        });
        // 最后一条消息为"问答"时，获取问题建议
        const lastMessage = _messageList[len - 1];
        if (
          lastMessage.type === MessageModeEnum.QUESTION &&
          lastMessage.ext?.length
        ) {
          // 问题建议列表
          const suggestList = lastMessage.ext.map((item) => item.content) || [];
          setChatSuggestList(suggestList);
        }
        // 如果消息列表大于1时，说明已开始会话，就不显示预置问题，反之显示
        else if (len === 1) {
          const guidQuestionDtos = data?.agent?.guidQuestionDtos || [];
          // 如果存在预置问题，显示预置问题
          setChatSuggestList(guidQuestionDtos);
        }

        // 无论初始返回的 messageList 长度多少，都认为可能有历史消息，
        // 保证第一次上滑到顶部时始终调用一次列表接口进行确认。
        if (len > 0) {
          setIsMoreMessage(true);
        }
      }
      // 不存在会话消息时，才显示开场白预置问题
      else {
        setMessageList([]);
        const guidQuestionDtos = data?.agent?.guidQuestionDtos || [];
        // 如果存在预置问题，显示预置问题
        setChatSuggestList(guidQuestionDtos);
      }

      // 通过 requestAnimationFrame 在接下来的 800ms 内持续并在浏览器每次重绘前强制置底
      // 能够完美解决由于聊天气泡、Markdown、图片等异步渲染撑开高度，导致的跳闪和未置底问题
      const startTime = Date.now();
      const forceScrollToBottom = () => {
        // 滚动到底部
        const element = messageViewRef?.current;
        if (element) {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'instant',
          });
        }
        if (Date.now() - startTime < 800) {
          requestAnimationFrame(forceScrollToBottom);
        }
      };
      requestAnimationFrame(forceScrollToBottom);
    },
    onError: () => {
      setIsLoadingConversation(false);
    },
  });

  // 智能体会话问题建议
  const { run: runChatSuggest, loading: loadingSuggest } = useRequest(
    apiAgentConversationChatSuggest,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result: RequestResponse<string[]>) => {
        if (
          pendingSuggestGenerationRef.current !== suggestGenerationRef.current
        ) {
          return;
        }
        setChatSuggestList(result.data);
        handleScrollBottom();
      },
    },
  );

  // 停止会话
  const { runAsync: runStopConversation, loading: loadingStopConversation } =
    useRequest(apiAgentConversationChatStop, {
      manual: true,
      debounceWait: 300,
    });

  // 修改消息列表
  const handleChangeMessageList = (
    params: ConversationChatParams,
    res: ConversationChatResponse,
    // 自定义随机id
    currentMessageId: string,
  ) => {
    const { data, eventType } = res;

    // 立即执行同步更新：React 18 会自动处理批量更新合并，无需手动防抖。
    // 这保证了流式输出中的每一个数据包（Chunk）都能被正确拼接，且不会丢失。
    setMessageList((messageList) => {
      if (!messageList?.length) {
        return [];
      }
      // 深拷贝消息列表
      let list: any[] = [...messageList];
      const index = list.findIndex((item) => item.id === currentMessageId);
      // 数组splice方法的第二个参数表示删除的数量，这里我们只需要删除一个元素，所以设置为1， 如果为0，则表示不删除元素。
      let arraySpliceAction = 1;
      // 当前消息
      const currentMessage = list.find(
        (item) => item.id === currentMessageId,
      ) as MessageInfo;
      // 消息不存在时
      if (!currentMessage) {
        return messageList;
      }

      let newMessage: any = null;

      // 优先拦截 ACP 权限 / MCP Ask 干预类 SSE，挂载到当前流式消息（DockPanel 数据源）
      const interventionPatch = processInterventionSsePatch(
        res,
        currentMessage,
      );
      if (interventionPatch) {
        list.splice(index, arraySpliceAction, interventionPatch);
        checkConversationActive(list);
        return list;
      }

      // 更新UI状态...
      if (eventType === ConversationEventTypeEnum.PROCESSING) {
        const processingResult = data.result || {};
        // 后端可能仅在 data.result.executeId 提供执行 ID
        if (!data.executeId && processingResult.executeId) {
          data.executeId = processingResult.executeId;
        }
        const processingList = [
          ...(currentMessage?.processingList || []),
        ] as ProcessingInfo[];
        const existingIndex = processingList.findIndex(
          (item) => item.executeId === data.executeId,
        );
        if (existingIndex > -1) {
          processingList[existingIndex] = data;
        } else {
          processingList.push(data);
        }

        newMessage = {
          ...currentMessage,
          text: getCustomBlock(currentMessage.text || '', data),
          status: MessageStatusEnum.Loading,
          processingList,
        };

        // 添加处理扩展页面逻辑
        if (data.status === ProcessingEnum.EXECUTING) {
          // 判断页面类型
          if (data.type === 'Page') {
            const input = processingResult.input;
            // 添加页面类型 后的未返回默认 Page
            input.uri_type = processingResult.input.uri_type ?? 'Page';

            // 显示页面预览
            if (!input.uri_type || input.uri_type === 'Page') {
              const previewData = {
                uri: input.uri,
                params: input.arguments || {},
                executeId: data.executeId || '',
                method: input.method,
                request_id: input.request_id,
                data_type: input.data_type,
              };
              // console.log('CHART', previewData);
              // 显示页面预览
              showPagePreview(previewData);
            }

            // 链接类型
            if (input.uri_type === 'Link') {
              const input = processingResult.input;
              input.uri_type = processingResult.input.uri_type ?? 'Page';
              // 拼接 query 参数
              const queryString = new URLSearchParams(
                input.arguments,
              ).toString();
              const pageUrl = `${input.uri}?${queryString}`;
              window.open(pageUrl, '_blank');
            }
          }
        }

        handleChatProcessingList(processingList);
      }
      // MESSAGE事件
      if (eventType === ConversationEventTypeEnum.MESSAGE) {
        const { text, type, ext, id, finished } = data;
        // 思考think
        if (type === MessageModeEnum.THINK) {
          newMessage = {
            ...currentMessage,
            think: `${currentMessage.think}${text}`,
            status: MessageStatusEnum.Incomplete,
          };
        }
        // 问答
        else if (type === MessageModeEnum.QUESTION) {
          newMessage = {
            ...currentMessage,
            text: `${currentMessage.text}${text}`,
            // 如果finished为true，则状态为null，此时不会显示运行状态组件，否则为Incomplete
            status: finished ? null : MessageStatusEnum.Incomplete,
          };
          if (ext?.length) {
            // 问题建议
            setChatSuggestList(
              ext.map((extItem: MessageQuestionExtInfo) => extItem.content) ||
                [],
            );
          }
        } else {
          // 工作流过程输出
          if (messageIdRef.current && messageIdRef.current !== id && finished) {
            newMessage = {
              ...currentMessage,
              id,
              text: `${currentMessage.text}${text}`, // 这里需要添加 展示MCP 或者其他工具调用
              status: null, // 隐藏运行状态
            };
            // 插入新的消息
            arraySpliceAction = 0;
          } else {
            messageIdRef.current = id;
            newMessage = {
              ...currentMessage,
              text: `${currentMessage.text}${text}`,
              // 如果finished为true，则状态为Complete，否则为Incomplete
              status: finished
                ? MessageStatusEnum.Complete
                : MessageStatusEnum.Incomplete,
            };
          }
        }
      }
      // FINAL_RESULT事件
      if (eventType === ConversationEventTypeEnum.FINAL_RESULT) {
        // 重置消息ID
        messageIdRef.current = '';

        /**
         * "error":"Agent正在执行任务，请等待当前任务完成后再发送新请求"
         */
        if (
          res.error?.includes('正在执行任务') ||
          (!data?.success && data?.error?.includes('正在执行任务'))
        ) {
          modalConfirm(
            dict('PC.Models.ConversationInfo.taskConflictTitle'),
            dict('PC.Models.ConversationInfo.taskConflictContent'),
            () => {
              if (params?.conversationId) {
                runStopConversation(params?.conversationId.toString());
              }
              return new Promise((resolve) => {
                setTimeout(resolve, 2000);
              });
            },
          );
        }

        newMessage = {
          ...currentMessage,
          status: MessageStatusEnum.Complete,
          finalResult: data,
          requestId: res.requestId,
        };

        // 是否开启问题建议,可用值:Open,Close
        if (isSuggest.current) {
          pendingSuggestGenerationRef.current = suggestGenerationRef.current;
          runChatSuggest(params as ConversationChatSuggestParams);
        }

        // TaskAgent：同步后台 taskStatus，驱动「智能体正在执行，请稍等」展示/结束
        if (
          params.conversationId &&
          conversationInfoRef.current?.agent?.type === AgentTypeEnum.TaskAgent
        ) {
          void syncConversationTaskStatus(params.conversationId);
        }

        // 用户主动取消任务
        if (!data?.success && data?.error?.includes('用户主动取消任务')) {
          // 如果没有输出文本，删除最后一条消息，不显示流式输出内容
          if (!newMessage?.text && !data.outputText) {
            // 将 newMessage 设置为 null，并保持 arraySpliceAction 为 1
            // 这样会在后续的 splice 操作中删除当前消息而不是替换
            newMessage = null;
            // 确保删除操作生效：直接从列表中移除当前消息
            list.splice(index, 1);
            // 标记已处理，跳过后续的 splice 逻辑
            // arraySpliceAction = 0;
          }
        }
      }
      // ERROR事件
      if (eventType === ConversationEventTypeEnum.ERROR) {
        newMessage = {
          ...currentMessage,
          status: MessageStatusEnum.Error,
        };
      }

      // 会话事件兼容处理，防止消息为空时，页面渲染报length错误
      if (newMessage) {
        list.splice(index, arraySpliceAction, newMessage as MessageInfo);
      }

      // 同步更新会话活跃状态
      checkConversationActive(list);

      return list;
    });
  };

  // 会话处理
  const handleConversation = async (
    params: ConversationChatParams,
    currentMessageId: string,
    perfLifecycle: MessagePerfLifecycle,
  ) => {
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

    // 请求即将发起：用于计算前端从发送动作到真正网络发起的耗时。
    perfLifecycle.onHttpStart();

    // 启动连接（不传 abortController，让 createSSEConnection 内部创建）
    abortConnectionRef.current = createSSEConnection({
      url: CONVERSATION_CONNECTION_URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      // 不传 abortController，让函数内部创建新的
      onOpen: () => {
        perfLifecycle.onSseConnect();
      },
      onMessage: (res: ConversationChatResponse) => {
        // 将 chunk 的实际载荷也传给 perfTracker，避免只依赖 eventType 误判”首包”
        // 传入整个响应对象：若其中存在 subType（例如 unified 会话流），perfTracker 可据此判断”真正消息块”。
        perfLifecycle.onFirstChunk(res?.eventType, res);

        // 记录当前会话请求 ID（用于停止会话等操作）
        if (res?.requestId) {
          setCurrentConversationRequestId(res.requestId);
        }

        // 现在逻辑已重构为同步，按序处理所有包，包括带有 finished: true 的结束包。
        handleChangeMessageList(params, res, currentMessageId);
        // 滚动到底部：在流式输出期间，使用 'instant' 以避免抖动，且只有在允许自动滚动时才触发
        if (allowAutoScrollRef.current) {
          // 使用 raf 确保在 DOM 更新后立即执行，且不带平滑动画以防指令堆积
          requestAnimationFrame(() => {
            const element = messageViewRef?.current;
            if (element) {
              element.scrollTo({
                top: element.scrollHeight,
                behavior: 'instant',
              });
            }
          });
        }
      },
      onClose: async () => {
        // 明确的流结束信号：打破「发送后 3s 保活」，确保活跃态能落 false（停止/快速结束场景）
        lastSendAtRef.current = 0;
        // 将当前会话的loading状态的消息改为Stopped状态，并将所有正在执行的 processing 状态更新为 FAILED
        setMessageList((list) => {
          try {
            const copyList = JSON.parse(JSON.stringify(list));

            // 从后往前遍历消息列表，修复包含有工具调用的前置消息状态
            for (let i = copyList.length - 1; i >= 0; i--) {
              const currentMessage = copyList[i];

              // 1. 仅对列表的最后一条真正的消息，如果处于加载态则强置为 Stopped
              if (
                i === copyList.length - 1 &&
                (currentMessage.status === MessageStatusEnum.Loading ||
                  currentMessage.status === MessageStatusEnum.Incomplete)
              ) {
                currentMessage.status = MessageStatusEnum.Stopped;
              }

              // 2. 遍历所有消息 of processingList，强置其中残余的 EXECUTING 状态为 FAILED
              if (
                currentMessage.processingList &&
                Array.isArray(currentMessage.processingList)
              ) {
                currentMessage.processingList =
                  currentMessage.processingList.map((item: ProcessingInfo) => {
                    if (item.status === ProcessingEnum.EXECUTING) {
                      return {
                        ...item,
                        status: ProcessingEnum.FAILED,
                      };
                    }
                    return item;
                  });
              }

              // 3. 将悬挂状态的权限审批与提问弹窗关闭
              // cleanupPendingInteractions(currentMessage);
            }

            // 再次调用 checkConversationActive 确保状态同步
            checkConversationActive(copyList);
            return copyList;
          } catch (error) {
            console.error('[onClose] ERROR:', error);
            return list;
          }
        });

        if (
          params.conversationId &&
          conversationInfoRef.current?.agent?.type === AgentTypeEnum.TaskAgent
        ) {
          await syncConversationTaskStatus(params.conversationId);
        }

        disabledConversationActive();

        perfLifecycle.onStreamEnd();
        perfLifecycle.onCloseRenderComplete();
        // SSE 关闭时重置会话活跃状态
        disabledConversationActive();
      },
      onError: () => {
        message.error(dict('PC.Models.ConversationInfo.networkTimeoutError'));
        // 将当前会话的 loading 消息改为 Error，并把其 processingList 中执行中的项更新为 FAILED，
        // 否则 isSessionStreamBusy 会因残留 EXECUTING 项持续为 true，导致活跃态/停止按钮/队列消费卡死。
        const list =
          messageListRef.current?.map((info: MessageInfo) => {
            if (info?.id === currentMessageId) {
              const processingList = Array.isArray(info.processingList)
                ? info.processingList.map((item: ProcessingInfo) =>
                    item.status === ProcessingEnum.EXECUTING
                      ? { ...item, status: ProcessingEnum.FAILED }
                      : item,
                  )
                : info.processingList;
              return {
                ...info,
                status: MessageStatusEnum.Error,
                processingList,
              };
            }
            return info;
          }) || [];
        // 明确终止：打破「发送后 3s 保活」，确保活跃态能立即落 false
        lastSendAtRef.current = 0;
        setMessageList(() => {
          disabledConversationActive();
          return list;
        });
        // setMessageList(list);
        checkConversationActive(list);
        perfLifecycle.onStreamEnd('error');
      },
    });
  };

  // ===== 会话流式恢复(sub)：刷新页面 / 新开标签时，订阅 EXECUTING 会话的输出流 =====
  // 逻辑收敛到共享 hook（与 conversationInfo model 复用同一份实现，避免双份维护漂移）
  // 重置会被 handleChangeMessageList 写入的流式状态：恢复流开/关时调用，避免残留 messageIdRef 误插重复行
  const resetResumeMessageState = useCallback(() => {
    messageIdRef.current = '';
  }, []);
  const { resumeConversationStream, abortResumeStream } =
    useResumeStreamHandlers({
      setMessageList,
      handleChangeMessageList,
      messageViewRef,
      allowAutoScrollRef,
      resetResumeMessageState,
    });

  // 清除副作用
  const handleClearSideEffect = () => {
    // 中断会话流式恢复(sub)连接（hook 内部同时重置占位记忆），避免离开页面后残留
    abortResumeStream();
    // 重置消息ID
    messageIdRef.current = '';
    suggestGenerationRef.current += 1;
    // 重置问题建议列表
    setChatSuggestList([]);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    // 主动关闭连接
    if (abortConnectionRef.current) {
      // 确保 abortConnectionRef.current 是一个可调用的函数
      if (typeof abortConnectionRef.current === 'function') {
        abortConnectionRef.current();
      }
      abortConnectionRef.current = null;
    }
  };

  // 清除文件面板信息, 并关闭文件面板
  // 文件树相关状态由 conversationInfo model 维护，此处保留空实现以兼容清空会话调用
  const clearFilePanelInfo = useCallback(() => {}, []);

  // 重置初始化
  const resetInit = () => {
    handleClearSideEffect();
    // 重置是否还有更多消息
    setIsMoreMessage(false);
    // 重置加载更多消息的状态
    setLoadingMore(false);
    setManualComponents([]);
    allowAutoScrollRef.current = true;
    setShowScrollBtn(false);
    // 重置消息列表
    setMessageList([]);
    // 重置会话信息
    setConversationInfo(null);
    // 重置问题建议
    setIsSuggest(false);
    // 重置会话活跃状态
    disabledConversationActive();
    // 重置当前会话 ID 和请求 ID
    setCurrentConversationId(null);
    setCurrentConversationRequestId('');

    // 清除文件面板信息, 并关闭文件面板
    clearFilePanelInfo();
  };

  // 发送消息
  const onMessageSend = async (sendParams: SendMessageParams) => {
    const {
      id,
      messageInfo,
      files = [],
      infos = [],
      variableParams,
      sandboxId,
      debug = false,
      skillIds,
      modelId,
      agentMode = 'yolo',
    } = sendParams;
    // 清除副作用
    handleClearSideEffect();

    // 乐观标记流式活跃，保证停止按钮与队列入队判定及时
    setIsConversationActive(true);
    lastSendAtRef.current = Date.now();

    // 附件文件
    const attachments: AttachmentFile[] =
      files?.map((file) => ({
        fileKey: file.key || '',
        fileUrl: file.url || '',
        fileName: file.name || '',
        mimeType: file.type || '',
      })) || [];

    // 将文件和消息加入会话中
    const chatMessage = {
      role: AssistantRoleEnum.USER,
      type: MessageModeEnum.CHAT,
      text: messageInfo,
      time: dayjs().toString(),
      attachments,
      id: uuidv4(),
      messageType: MessageTypeEnum.USER,
    };

    const currentMessageId = uuidv4();
    const perfLifecycle = perfTracker.createLifecycle(
      Number(id),
      currentMessageId,
    );
    // 发送动作时点：从用户动作开始对齐后续网络与流式阶段耗时。
    perfLifecycle.onSendClick();

    // 当前助手信息
    const currentMessage = {
      role: AssistantRoleEnum.ASSISTANT,
      type: MessageModeEnum.CHAT,
      text: '',
      think: '',
      time: dayjs().toString(),
      id: currentMessageId,
      messageType: MessageTypeEnum.ASSISTANT,
      status: MessageStatusEnum.Loading,
    } as MessageInfo;

    // 将Incomplete状态的消息改为Complete状态
    const completeMessageList =
      messageList?.map((item: MessageInfo) => {
        if (item.status === MessageStatusEnum.Incomplete) {
          item.status = MessageStatusEnum.Complete;
        }
        return item;
      }) || [];

    const newMessageList = [
      ...completeMessageList,
      chatMessage,
      currentMessage,
    ] as MessageInfo[];

    setMessageList(newMessageList);
    // 缓存消息列表
    messageListRef.current = newMessageList;
    // 同步更新会话活跃状态（用户发送消息后，新消息带有 Loading 状态）
    checkConversationActive(newMessageList);

    // 允许滚动
    allowAutoScrollRef.current = true;
    // 隐藏点击下滚按钮
    setShowScrollBtn(false);
    // 滚动
    handleScrollBottom();
    // 会话请求参数
    const params: ConversationChatParams = {
      conversationId: id,
      variableParams,
      message: messageInfo,
      attachments,
      debug,
      selectedComponents: infos,
      sandboxId,
      // 技能ID列表
      skillIds,
      // 模型ID
      modelId,
      agentMode,
    };

    // 处理会话
    handleConversation(params, currentMessageId, perfLifecycle);
  };

  return {
    conversationInfo,
    manualComponents,
    messageList,
    setMessageList,
    chatSuggestList,
    loadingConversation,
    runQueryConversation,
    runAsync,
    setIsLoadingConversation,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
    // 是否还有更多消息
    isMoreMessage,
    setIsMoreMessage,
    // 加载更多消息的状态
    loadingMore,
    // 加载更多消息
    handleLoadMoreMessage,
    handleClearSideEffect,
    showScrollBtn,
    setShowScrollBtn,
    resetInit,
    clearFilePanelInfo,
    isLoadingOtherInterface,
    setIsLoadingOtherInterface,
    // 停止会话相关
    runStopConversation,
    loadingStopConversation,
    // 会话活跃状态（SSE 流式交互中）
    isConversationActive,
    disabledConversationActive,
    checkConversationActive,
    // 当前会话 ID 与请求 ID
    getCurrentConversationId,
    getCurrentConversationRequestId,
    setCurrentConversationRequestId,
    respondAcpPermission,
    respondMcpAsk,
    // 会话流式恢复(sub)
    resumeConversationStream,
    abortResumeStream,
  };
};
