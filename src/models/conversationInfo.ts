import { SUCCESS_CODE } from '@/constants/codes.constants';
import { CONVERSATION_CONNECTION_URL } from '@/constants/common.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import {
  apiAgentConversation,
  apiAgentConversationChatStop,
  apiAgentConversationChatSuggest,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import {
  apiEnsurePod,
  apiGetStaticFileList,
  apiKeepalivePod,
  apiRestartAgent,
  apiRestartPod,
} from '@/services/vncDesktop';
import {
  AgentComponentTypeEnum,
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import {
  CreateUpdateModeEnum,
  MessageStatusEnum,
  ProcessingEnum,
} from '@/types/enums/common';
import { BindCardStyleEnum } from '@/types/enums/plugin';
import { EditAgentShowType, OpenCloseEnum } from '@/types/enums/space';
import {
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import { CardDataInfo } from '@/types/interfaces/cardInfo';
import type {
  BindConfigWithSub,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type {
  AttachmentFile,
  ConversationChatParams,
  ConversationChatResponse,
  ConversationChatSuggestParams,
  ConversationInfo,
  MessageInfo,
  MessageQuestionExtInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import {
  CardInfo,
  ConversationFinalResult,
} from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import {
  StaticFileInfo,
  StaticFileListResponse,
  VncDesktopContainerInfo,
} from '@/types/interfaces/vncDesktop';
import { extractTaskResult } from '@/utils';
import { modalConfirm } from '@/utils/ant-custom';
import { isEmptyObject } from '@/utils/common';
import eventBus from '@/utils/eventBus';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';

export default () => {
  // 历史记录
  const { runHistory, runHistoryItem } = useModel('conversationHistory');
  const { showPagePreview, handleChatProcessingList } = useModel('chat');
  // 会话信息
  const [conversationInfo, setConversationInfo] =
    useState<ConversationInfo | null>();
  // 当前会话ID
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);
  // 会话消息ID
  const [currentConversationRequestId, setCurrentConversationRequestId] =
    useState<string>('');
  // 是否用户问题建议
  // const [isSuggest, setIsSuggest] = useState<boolean>(false);
  const isSuggest = useRef(false);
  const setIsSuggest = (suggest: boolean) => {
    isSuggest.current = suggest;
  };
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 缓存消息列表，用于消息会话错误时，修改消息状态（将当前会话的loading状态的消息改为Error状态）
  const messageListRef = useRef<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<
    string[] | GuidQuestionDto[]
  >([]);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortConnectionRef = useRef<unknown>();
  const [showType, setShowType] = useState<EditAgentShowType>(
    EditAgentShowType.Hide,
  );
  // 会话请求ID
  const [requestId, setRequestId] = useState<string>('');
  // 会话消息ID
  const messageIdRef = useRef<string>('');
  // 调试结果
  const [finalResult, setFinalResult] =
    useState<ConversationFinalResult | null>(null);
  // 是否需要更新主题
  const needUpdateTopicRef = useRef<boolean>(true);
  // 展示台卡片列表
  const [cardList, setCardList] = useState<CardInfo[]>([]);
  // 是否正在加载会话
  const [isLoadingConversation, setIsLoadingConversation] =
    useState<boolean>(false);

  // 其它调用接口的情况下判断是否正在加载中用于禁用聊天发送按钮
  const [isLoadingOtherInterface, setIsLoadingOtherInterface] =
    useState<boolean>(false);

  // 会话是否正在进行中（有消息正在处理）
  const [isConversationActive, setIsConversationActive] =
    useState<boolean>(false);
  // 添加一个 ref 来控制是否允许自动滚动
  const allowAutoScrollRef = useRef<boolean>(true);
  // 是否显示点击下滚按钮
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  // 可手动选择的组件列表
  const [manualComponents, setManualComponents] = useState<
    AgentManualComponentInfo[]
  >([]);
  // 变量参数
  const [variables, setVariables] = useState<BindConfigWithSub[]>([]);

  // 历史会话弹窗状态管理
  const [isHistoryConversationOpen, setIsHistoryConversationOpen] =
    useState<boolean>(false);

  // 打开历史会话弹窗
  const openHistoryConversation = useCallback(() => {
    setIsHistoryConversationOpen(true);
  }, []);

  // 关闭历史会话弹窗
  const closeHistoryConversation = useCallback(() => {
    setIsHistoryConversationOpen(false);
  }, []);

  // 定时任务弹窗状态管理
  const [isTimedTaskOpen, setIsTimedTaskOpen] = useState<boolean>(false);
  const [timedTaskMode, setTimedTaskMode] = useState<CreateUpdateModeEnum>();

  // 打开定时任务弹窗
  const openTimedTask = useCallback((taskMode: CreateUpdateModeEnum) => {
    setIsTimedTaskOpen(true);
    setTimedTaskMode(taskMode);
  }, []);

  // 关闭定时任务弹窗
  const closeTimedTask = useCallback(() => {
    setIsTimedTaskOpen(false);
  }, []);
  // 用户填写的变量参数
  const [userFillVariables, setUserFillVariables] = useState<Record<
    string,
    string | number
  > | null>(null);
  // 必填变量参数name列表
  const [requiredNameList, setRequiredNameList] = useState<string[]>([]);

  // 文件树显隐状态
  const [isFileTreeVisible, setIsFileTreeVisible] = useState<boolean>(false);
  // 文件树是否固定（用户点击后固定）
  const [isFileTreePinned, setIsFileTreePinned] = useState<boolean>(false);
  // 任务智能体会话中点击选中的文件ID
  const [taskAgentSelectedFileId, setTaskAgentSelectedFileId] =
    useState<string>('');
  // 任务智能体文件选择触发标志，每次点击按钮时传入不同的值（如时间戳），用于强制触发文件选择
  const [taskAgentSelectTrigger, setTaskAgentSelectTrigger] = useState<
    number | string
  >(0);
  // 文件树数据
  const [fileTreeData, setFileTreeData] = useState<StaticFileInfo[]>([]);
  // 文件树数据加载状态
  const [fileTreeDataLoading, setFileTreeDataLoading] =
    useState<boolean>(false);
  // 文件树视图模式
  const [viewMode, setViewMode] = useState<'preview' | 'desktop'>('preview');
  // 使用 ref 跟踪当前视图模式和文件树可见状态，用于避免不必要的刷新
  const viewModeRef = useRef<'preview' | 'desktop'>('preview');
  const isFileTreeVisibleRef = useRef<boolean>(false);
  // 远程桌面容器信息
  const [vncContainerInfo, setVncContainerInfo] =
    useState<VncDesktopContainerInfo | null>(null);

  // 查询文件列表
  const { runAsync: runGetStaticFileList } = useRequest(apiGetStaticFileList, {
    manual: true,
    debounceWait: 500,
    onSuccess: (result: RequestResponse<StaticFileListResponse>) => {
      setFileTreeDataLoading(false);
      const files = result?.data?.files || [];
      if (files?.length) {
        const _fileTreeData = files.map((item) => ({
          ...item,
          fileId: item.name,
        }));
        setFileTreeData(_fileTreeData);
      } else {
        // 如果文件列表为空，则清空文件树数据(比如：删除所有文件后，文件树数据为空)
        setFileTreeData([]);
      }
    },
    onError: () => {
      setFileTreeDataLoading(false);
      setFileTreeData([]);
    },
  });

  // 重启智能体电脑
  const restartVncPod = useCallback(async (cId: number) => {
    try {
      const { code } = await apiRestartPod(cId);
      if (code === SUCCESS_CODE) {
        message.success('重启智能体电脑成功');
      } else {
        message.error('重启智能体电脑失败');
      }
    } catch (error) {
      console.error('重启智能体电脑失败', error);
    }
  }, []);

  // 重启智能体
  const { run: restartAgent, loading: isRestartAgentLoading } = useRequest(
    apiRestartAgent,
    {
      manual: true,
      debounceWait: 500,
      onSuccess: (result: RequestResponse<null>) => {
        const { code } = result;
        if (code === SUCCESS_CODE) {
          message.success('重启智能体成功');
        }
      },
    },
  );

  // 处理文件列表刷新事件
  const handleRefreshFileList = useCallback(
    async (conversationId?: number) => {
      if (conversationId) {
        setFileTreeDataLoading(true);
        await runGetStaticFileList(conversationId);
      }
    },
    [runGetStaticFileList],
  );

  // 打开预览视图或远程桌面视图时修改状态值
  const openPreviewChangeState = useCallback((mode: 'preview' | 'desktop') => {
    setViewMode(mode);
    setIsFileTreeVisible(true);
    // 更新 ref 值
    viewModeRef.current = mode;
    isFileTreeVisibleRef.current = true;
  }, []);

  // 远程桌面容器保活轮询
  const { run: runKeepalivePodPolling, cancel: stopKeepalivePodPolling } =
    useRequest(apiKeepalivePod, {
      manual: true,
      loadingDelay: 30000,
      debounceWait: 5000,
      pollingInterval: 60000, // 轮询间隔，单位ms
      // 在屏幕不可见时，暂时暂停定时任务。
      pollingWhenHidden: false,
      // 轮询错误重试次数。如果设置为 -1，则无限次
      pollingErrorRetryCount: -1,
    });

  // 打开远程桌面视图
  const openDesktopView = useCallback(async (cId: number) => {
    // 停止保活
    stopKeepalivePodPolling();
    // 打开预览视图或远程桌面视图时修改状态值
    openPreviewChangeState('desktop');
    try {
      // 启动容器
      const { code, data } = await apiEnsurePod(cId);
      if (code === SUCCESS_CODE) {
        // 设置远程桌面容器信息
        setVncContainerInfo(data?.container_info);
        // 启动保活, 60秒保活一次
        runKeepalivePodPolling(cId);
      }
    } catch (error) {
      console.error('打开远程桌面视图失败', error);
    }
  }, []);

  // 关闭预览视图
  const closePreviewView = useCallback(() => {
    // 关闭文件树
    setIsFileTreeVisible(false);
    // 更新 ref 值
    isFileTreeVisibleRef.current = false;

    // 停止保活
    stopKeepalivePodPolling();
  }, []);

  // 清除文件面板信息, 并关闭文件面板
  const clearFilePanelInfo = useCallback(() => {
    closePreviewView();
    // 清空文件树数据
    setFileTreeData([]);
    // 设置视图模式为预览
    setViewMode('preview');
    // 更新 ref 值
    viewModeRef.current = 'preview';
    // 设置远程桌面容器信息为空
    setVncContainerInfo(null);
  }, []);

  // 打开预览视图
  const openPreviewView = useCallback(async (cId: number) => {
    // 停止保活
    stopKeepalivePodPolling();

    // 检查是否需要刷新文件列表
    // 只有在模式发生变化（从 desktop 切换到 preview）或首次打开文件树时才刷新
    const needRefresh =
      viewModeRef.current !== 'preview' || !isFileTreeVisibleRef.current;

    // 打开预览视图或远程桌面视图时修改状态值
    openPreviewChangeState('preview');
    // 只在需要时触发文件列表刷新事件
    if (needRefresh) {
      eventBus.emit(EVENT_TYPE.RefreshFileList, cId);
    }
  }, []);

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

  // 根据用户消息更新会话主题
  const { runAsync: runUpdateTopic } = useRequest(apiAgentConversationUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<ConversationInfo>) => {
      needUpdateTopicRef.current = false;
      setConversationInfo(
        (info) =>
          ({
            ...info,
            topic: result?.data?.topic,
          } as ConversationInfo),
      );
    },
  });

  // 处理变量参数
  const handleVariables = (_variables: BindConfigWithSub[]) => {
    setVariables(_variables);
    // 必填参数name列表
    const _requiredNameList = _variables
      ?.filter(
        (item: BindConfigWithSub) => !item.systemVariable && item.require,
      )
      ?.map((item: BindConfigWithSub) => item.name);
    setRequiredNameList(_requiredNameList || []);
  };

  // 检查会话是否正在进行中（有消息正在处理）
  const checkConversationActive = useCallback((messages: MessageInfo[]) => {
    // 只检查最后几条消息的状态，而不是所有消息
    const recentMessages = messages?.slice(-5) || []; // 只检查最后5条消息
    const hasActiveMessage =
      recentMessages.some(
        (message) =>
          message.status === MessageStatusEnum.Loading ||
          message.status === MessageStatusEnum.Incomplete,
      ) || false;
    setIsConversationActive(hasActiveMessage);
  }, []);

  const disabledConversationActive = () => {
    setIsConversationActive(false);
  };

  // 设置所有的详细信息
  const setChatProcessingList = (messageList: any[]) => {
    const list: any[] = [];
    messageList
      .filter((item) => item.role === AssistantRoleEnum.ASSISTANT)
      .forEach((item) => {
        const componentExecutedList = item?.componentExecutedList || [];
        // 补充执行ID
        const _list = componentExecutedList.map((item: any) => ({
          ...item,
          executeId: item.result.executeId,
        }));
        list.push(..._list);
      });

    handleChatProcessingList(list);
  };

  // 查询会话
  const {
    run: runQueryConversation,
    runAsync,
    loading: loadingConversation,
  } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<ConversationInfo>) => {
      setIsLoadingConversation(true);
      const { data } = result;
      // 设置所有的详细信息
      setChatProcessingList(data?.messageList || []);
      // 设置会话信息
      setConversationInfo(data);
      // 缓存当前会话ID
      if (data?.id) {
        setCurrentConversationId(data.id);
      }
      // 是否开启用户问题建议
      setIsSuggest(data?.agent?.openSuggest === OpenCloseEnum.Open);
      // 可手动选择的组件列表
      setManualComponents(data?.agent?.manualComponents || []);
      // 变量参数
      const _variables = data?.agent?.variables || [];
      // 处理变量参数
      handleVariables(_variables);
      // 用户填写的变量参数
      setUserFillVariables(data?.variables || null);
      // 消息列表
      const _messageList = data?.messageList || [];
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
      }
      // 不存在会话消息时，才显示开场白预置问题
      else {
        setMessageList([]);
        const guidQuestionDtos = data?.agent?.guidQuestionDtos || [];
        // 如果存在预置问题，显示预置问题
        setChatSuggestList(guidQuestionDtos);
      }

      // 使用 setTimeout 确保在 DOM 完全渲染后再滚动
      setTimeout(() => {
        // 只有在允许自动滚动时才滚动到底部
        if (allowAutoScrollRef.current) {
          messageViewScrollToBottom();
        }
      }, 800);
    },
    onError: () => {
      setIsLoadingConversation(true);
      disabledConversationActive();
    },
  });

  // 智能体会话问题建议
  const { run: runChatSuggest, loading: loadingSuggest } = useRequest(
    apiAgentConversationChatSuggest,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result: RequestResponse<string[]>) => {
        setChatSuggestList(result.data);
        handleScrollBottom();
      },
    },
  );

  // 停止会话
  const { run: runStopConversation, loading: loadingStopConversation } =
    useRequest(apiAgentConversationChatStop, {
      manual: true,
    });

  // 修改消息列表
  const handleChangeMessageList = (
    params: ConversationChatParams,
    res: ConversationChatResponse,
    // 自定义随机id
    currentMessageId: string,
  ) => {
    const { data, eventType } = res;
    setCurrentConversationRequestId(res.requestId);
    timeoutRef.current = setTimeout(() => {
      setMessageList((messageList) => {
        if (!messageList?.length) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          disabledConversationActive();
          return [];
        }
        // 深拷贝消息列表
        const list = [...messageList];
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

        let newMessage = null;

        // 更新UI状态...
        if (eventType === ConversationEventTypeEnum.PROCESSING) {
          const processingResult = data.result || {};
          data.executeId = processingResult.executeId;
          newMessage = {
            ...currentMessage,
            text: getCustomBlock(currentMessage.text || '', data),
            status: MessageStatusEnum.Loading,
            processingList: [
              ...(currentMessage?.processingList || []),
              data,
            ] as ProcessingInfo[],
          };
          // 添加处理扩展页面逻辑
          if (data.status === ProcessingEnum.EXECUTING) {
            // 判断页面类型
            if (data.type === 'Page') {
              const input = processingResult.input;
              // 添加页面类型 后的未返回默认 Page
              input.uri_type = processingResult.input.uri_type ?? 'Page';
              // if (!input?.uri) {
              //   message.error('页面路径不存在');
              //   return;
              // }

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

          // 已调用完毕后, 处理卡片信息
          if (
            data?.status === ProcessingEnum.FINISHED &&
            data?.cardBindConfig &&
            data?.cardData
          ) {
            // 卡片列表
            setCardList((cardList) => {
              // 竖向列表
              if (
                data.cardBindConfig?.bindCardStyle === BindCardStyleEnum.LIST
              ) {
                // 过滤掉空对象, 因为cardData中可能存在空对象
                const _cardData =
                  data?.cardData?.filter(
                    (item: CardDataInfo) => !isEmptyObject(item),
                  ) || [];
                // 如果卡片列表不为空，则自动展开展示台
                if (_cardData?.length) {
                  // 自动展开展示台
                  setShowType(EditAgentShowType.Show_Stand);
                }
                const cardDataList =
                  _cardData?.map((item: CardDataInfo) => ({
                    ...item,
                    cardKey: data.cardBindConfig.cardKey,
                  })) || [];
                // 如果是同一次会话请求，则追加，否则更新
                return res.requestId === requestId
                  ? [...cardList, ...cardDataList]
                  : [...cardDataList];
              }
              // 自动展开展示台
              setShowType(EditAgentShowType.Show_Stand);
              // 单张卡片
              const cardInfo = {
                ...data?.cardData,
                cardKey: data.cardBindConfig?.cardKey,
              };
              // 如果是同一次会话请求，则追加，否则更新
              return (
                res.requestId === requestId
                  ? [...cardList, cardInfo]
                  : [cardInfo]
              ) as CardInfo[];
            });
          }

          // 长任务型任务处理(打开远程桌面)
          if (
            data.type === AgentComponentTypeEnum.Event &&
            data.subEventType === 'OPEN_DESKTOP' &&
            // 优先使用本次会话请求携带的 conversationId，避免闭包中拿到的旧会话信息
            params.conversationId
          ) {
            // 打开远程桌面
            openDesktopView(params.conversationId);
            console.log('打开远程桌面');
          }

          // 长任务型任务处理(刷新文件树)
          if (
            data.type === AgentComponentTypeEnum.ToolCall &&
            // isFileTreeVisible && // 是否已经打开文件预览窗口
            // viewMode === 'preview' && // 文件预览
            // 使用当前会话请求的 conversationId，避免闭包中 conversationInfo 还是旧值
            params.conversationId
          ) {
            // 刷新文件树
            handleRefreshFileList(params.conversationId);
            console.log('刷新文件树');
          }

          handleChatProcessingList([
            ...(currentMessage?.processingList || []),
            { ...data },
          ] as ProcessingInfo[]);
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
            if (
              messageIdRef.current &&
              messageIdRef.current !== id &&
              finished
            ) {
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
                status: MessageStatusEnum.Incomplete,
              };
            }
          }
        }
        // FINAL_RESULT事件
        if (eventType === ConversationEventTypeEnum.FINAL_RESULT) {
          /**
           * "error":"Agent正在执行任务，请等待当前任务完成后再发送新请求"
           */
          if (
            res.error?.includes('正在执行任务') ||
            (!data?.success && data?.error?.includes('正在执行任务'))
          ) {
            modalConfirm(
              '提示',
              'Agent正在执行任务中，需要先暂停当前任务后才能发送新请求，是否暂停当前任务？',
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
          const taskResult = extractTaskResult(data.outputText);
          if (
            params.conversationId &&
            taskResult.hasTaskResult &&
            taskResult.file
          ) {
            openPreviewView(params.conversationId);
            const fileId = taskResult.file
              ?.split(`${params.conversationId}/`)
              .pop();
            if (fileId) {
              setTaskAgentSelectedFileId(fileId);
              // 每次设置文件ID时更新触发标志，确保即使文件ID相同也能触发文件选择
              setTaskAgentSelectTrigger(Date.now());
            }
          }

          // 调试结果
          setRequestId(res.requestId);
          setFinalResult(data as ConversationFinalResult);
          // 是否开启问题建议,可用值:Open,Close
          if (isSuggest.current) {
            runChatSuggest(params as ConversationChatSuggestParams);
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

        // 检查会话状态
        checkConversationActive(list);

        return list;
      });
    }, 200);
  };

  const abortController = new AbortController();

  // 会话处理
  const handleConversation = async (
    params: ConversationChatParams,
    currentMessageId: string,
    // 是否同步会话记录
    isSync: boolean = true,
    data: any = null,
  ) => {
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

    // 启动连接
    abortConnectionRef.current = await createSSEConnection({
      url: CONVERSATION_CONNECTION_URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      abortController,
      onMessage: (res: ConversationChatResponse) => {
        handleChangeMessageList(params, res, currentMessageId);
        // 滚动到底部
        handleScrollBottom();
      },
      onClose: async () => {
        // 将当前会话的loading状态的消息改为Error状态
        setMessageList((list) => {
          try {
            const copyList = JSON.parse(JSON.stringify(list));
            copyList[copyList.length - 1].status = MessageStatusEnum.Error;
            return copyList;
          } catch (error) {
            console.error('ERROR:', error);
            return list;
          }
        });
        // 主动关闭连接时，禁用会话
        disabledConversationActive();

        const currentInfo = conversationInfo ?? data;

        if (isSync && currentInfo && currentInfo?.topicUpdated !== 1) {
          // 第一次发送消息后更新主题
          // 如果是智能体编排页面不更新
          const { data } = await runUpdateTopic({
            id: params.conversationId,
            firstMessage: params.message,
          });
          // 更新会话记录
          setConversationInfo({
            ...currentInfo,
            topicUpdated: data?.topicUpdated,
            topic: data?.topic,
          });

          // 如果是会话聊天页（chat页），同步更新会话记录
          runHistory({
            agentId: null,
            limit: 20,
          });

          // 获取当前智能体的历史记录
          runHistoryItem({
            agentId: currentInfo.agentId,
            limit: 20,
          });
        }
      },
      onError: () => {
        message.error('网络超时或服务不可用，请稍后再试');
        // 将当前会话的loading状态的消息改为Error状态
        const list =
          messageListRef.current?.map((info: MessageInfo) => {
            if (info?.id === currentMessageId) {
              return { ...info, status: MessageStatusEnum.Error };
            }
            return info;
          }) || [];
        setMessageList(() => {
          disabledConversationActive();
          return list;
        });
      },
    });
    // 主动关闭连接
    // 确保 abortConnectionRef.current 是一个可调用的函数
    if (typeof abortConnectionRef.current === 'function') {
      abortConnectionRef.current();
    }
  };

  // 清除副作用
  const handleClearSideEffect = () => {
    setChatSuggestList([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // 清除滚动
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

  // 重置初始化
  const resetInit = () => {
    handleClearSideEffect();
    setShowType(EditAgentShowType.Hide);
    setManualComponents([]);
    needUpdateTopicRef.current = true;
    allowAutoScrollRef.current = true;
    setShowScrollBtn(false);
    // 重置卡片列表
    setCardList([]);
    // 重置消息列表
    setMessageList([]);
    // 重置会话信息
    setConversationInfo(null);
    // 重置当前会话ID
    setCurrentConversationId(null);
    // 重置问题建议
    setIsSuggest(false);
    // 重置请求ID
    setRequestId('');
    // 重置调试结果
    setFinalResult(null);
    // 重置会话消息ID
    setCurrentConversationRequestId('');
    // 重置变量参数（防止切换智能体时参数框闪烁）
    setVariables([]);
    setRequiredNameList([]);
    setUserFillVariables(null);

    if (timeoutRef.current) {
      //清除会话定时器
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 清除文件面板信息, 并关闭文件面板
    clearFilePanelInfo();

    // 停止当前会话【强制】
    abortController?.abort();
  };

  // 发送消息
  const onMessageSend = async (
    id: number,
    messageInfo: string,
    files: UploadFileInfo[] = [],
    infos: AgentSelectedComponentInfo[] = [],
    variableParams?: Record<string, string | number>,
    debug: boolean = false,
    // 是否同步会话记录
    isSync: boolean = true,
    data: any = null,
  ) => {
    // 清除副作用
    handleClearSideEffect();

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
    ];
    setMessageList(() => {
      checkConversationActive(newMessageList);
      return newMessageList;
    });
    // 缓存消息列表
    messageListRef.current = newMessageList;

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
    };
    // 处理会话
    handleConversation(params, currentMessageId, isSync, data);
  };

  const handleDebug = useCallback((info: MessageInfo) => {
    const result = info?.finalResult;
    if (result) {
      setRequestId(info.requestId as string);
      setFinalResult(result);
    }
    setShowType(EditAgentShowType.Debug_Details);
    // 关闭文件树
    setIsFileTreeVisible(false);
    // 更新 ref 值
    isFileTreeVisibleRef.current = false;
  }, []);

  const getCurrentConversationRequestId = useCallback(() => {
    return currentConversationRequestId;
  }, [currentConversationRequestId]);

  // 获取当前会话ID
  const getCurrentConversationId = useCallback(() => {
    return currentConversationId;
  }, [currentConversationId]);

  return {
    setIsSuggest,
    conversationInfo,
    manualComponents,
    messageList,
    setMessageList,
    requestId,
    finalResult,
    setFinalResult,
    chatSuggestList,
    setChatSuggestList,
    loadingConversation,
    runQueryConversation,
    isLoadingConversation,
    setIsLoadingConversation,
    runAsync,
    loadingSuggest,
    onMessageSend,
    handleDebug,
    messageViewRef,
    messageViewScrollToBottom,
    allowAutoScrollRef,
    scrollTimeoutRef,
    showType,
    setShowType,
    handleClearSideEffect,
    cardList,
    showScrollBtn,
    setShowScrollBtn,
    resetInit,
    variables,
    setVariables,
    userFillVariables,
    requiredNameList,
    handleVariables,
    runStopConversation,
    loadingStopConversation,
    isConversationActive,
    checkConversationActive,
    disabledConversationActive,
    setCurrentConversationRequestId,
    getCurrentConversationRequestId,
    getCurrentConversationId,
    isHistoryConversationOpen,
    openHistoryConversation,
    closeHistoryConversation,
    timedTaskMode,
    isTimedTaskOpen,
    openTimedTask,
    closeTimedTask,
    setConversationInfo,
    // 文件树显隐状态
    isFileTreeVisible,
    // 文件树是否固定（用户点击后固定）
    isFileTreePinned,
    setIsFileTreePinned,
    closePreviewView,
    clearFilePanelInfo,
    // 文件树数据
    fileTreeData,
    fileTreeDataLoading,
    setFileTreeData,
    // 文件树视图模式
    viewMode,
    setViewMode,
    // 处理文件列表刷新事件
    handleRefreshFileList,
    openDesktopView,
    openPreviewView,
    // 重启智能体电脑
    restartVncPod,
    // 重启智能体
    restartAgent,
    isRestartAgentLoading,
    // 远程桌面容器信息, 暂时未使用
    vncContainerInfo,
    // 任务智能体会话中点击选中的文件ID
    taskAgentSelectedFileId,
    setTaskAgentSelectedFileId,
    // 任务智能体文件选择触发标志
    taskAgentSelectTrigger,
    setTaskAgentSelectTrigger,
    isLoadingOtherInterface,
    setIsLoadingOtherInterface,
  };
};
