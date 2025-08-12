import AgentChatEmpty from '@/components/AgentChatEmpty';
import AliyunCaptcha from '@/components/AliyunCaptcha';
import ChatInputHome from '@/components/ChatInputHome';
import ChatInputPhone from '@/components/ChatInputPhone';
import ChatView from '@/components/ChatView';
import ConditionRender from '@/components/ConditionRender';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import {
  TEMP_CONVERSATION_CONNECTION_URL,
  TEMP_CONVERSATION_UID,
} from '@/constants/common.constants';
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import {
  apiTempChatConversationCreate,
  apiTempChatConversationQuery,
} from '@/services/tempChat';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  DefaultSelectedEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import {
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type {
  BindConfigWithSub,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type {
  AttachmentFile,
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
  MessageQuestionExtInfo,
  ProcessingInfo,
  RoleInfo,
  TempConversationChatParams,
} from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import { addBaseTarget, arraysContainSameItems } from '@/utils/common';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { LoadingOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Form, message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { throttle } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel, useParams } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页咨询聊天页面
 */
const ChatTemp: React.FC = () => {
  const {
    checkConversationActive,
    disabledConversationActive,
    setCurrentConversationRequestId,
  } = useModel('conversationInfo');
  // 链接Key
  const { chatKey } = useParams();
  // 会话信息
  const [conversationInfo, setConversationInfo] =
    useState<ConversationInfo | null>();
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 缓存消息列表，用于消息会话错误时，修改消息状态（将当前会话的loading状态的消息改为Error状态）
  const messageListRef = useRef<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortConnectionRef = useRef<unknown>();
  // 会话消息ID
  const messageIdRef = useRef<string>('');
  const [isLoadingConversation, setIsLoadingConversation] =
    useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  // 添加一个 ref 来控制是否允许自动滚动
  const allowAutoScrollRef = useRef<boolean>(true);
  // 是否显示点击下滚按钮
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  // 可手动选择的组件列表
  const [manualComponents, setManualComponents] = useState<
    AgentManualComponentInfo[]
  >([]);
  const [selectedComponentList, setSelectedComponentList] = useState<
    AgentSelectedComponentInfo[]
  >([]);
  // 变量参数
  const [variables, setVariables] = useState<BindConfigWithSub[]>([]);
  // 用户填写的变量参数
  const [userFillVariables, setUserFillVariables] = useState<Record<
    string,
    string | number
  > | null>(null);
  // 必填变量参数name列表
  const [requiredNameList, setRequiredNameList] = useState<string[]>([]);
  // 是否发送过消息,如果是,则禁用变量参数
  const isSendMessageRef = useRef<boolean>(false);
  const captchaVerifyParamRef = useRef<string>('');

  const buttonId = 'aliyun-captcha-id';
  const { tenantConfigInfo, runTenantConfig } = useModel('tenantConfigInfo');
  const { handleChatProcessingList } = useModel('chat');

  // 会话UID
  const conversationUid = useRef<string>();

  const [form] = Form.useForm();
  // 变量参数
  const [variableParams, setVariableParams] = useState<Record<
    string,
    string | number
  > | null>(null);

  const values = Form.useWatch([], { form, preserve: true });

  useEffect(() => {
    // 监听form表单值变化
    if (values && Object.keys(values).length === 0) {
      return;
    }
    form
      .validateFields({ validateOnly: true })
      .then(() => setVariableParams(values))
      .catch(() => setVariableParams(null));
  }, [form, values]);

  useEffect(() => {
    if (!!userFillVariables) {
      form.setFieldsValue(userFillVariables);
      isSendMessageRef.current = true;
      setVariableParams(userFillVariables);
    }
  }, [userFillVariables]);

  // 聊天会话框是否禁用，不能发送消息
  const wholeDisabled = useMemo(() => {
    // 变量参数为空，不发送消息
    if (requiredNameList?.length > 0) {
      // 未填写必填参数，禁用发送按钮
      if (!variableParams) {
        return true;
      }
      const isSameName = arraysContainSameItems(
        requiredNameList,
        Object.keys(variableParams),
      );
      return !isSameName;
    }
    return false;
  }, [requiredNameList, variableParams]);

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const handleScrollBottom = () => {
    if (allowAutoScrollRef.current) {
      scrollTimeoutRef.current = setTimeout(() => {
        // 滚动到底部
        messageViewRef.current?.scrollTo({
          top: messageViewRef.current?.scrollHeight,
          behavior: 'smooth',
        });
      }, 400);
    }
  };

  // 查询临时会话详细
  const { run: runQueryConversation } = useRequest(
    apiTempChatConversationQuery,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result: RequestResponse<ConversationInfo>) => {
        setIsLoadingConversation(false);
        const { data } = result;
        setConversationInfo(data);
        setIsLoaded(true);
        // 设置标题和图标
        document.title = `和${data?.agent?.name}开始会话` || '';
        if (data?.agent?.icon) {
          // 创建一个新的link元素
          const link = document.createElement('link');
          link.rel = 'shortcut icon';
          link.href = data?.agent?.icon;
          link.type = 'image/x-icon';

          // 获取head元素并添加link元素
          const head =
            document.head || document.getElementsByTagName('head')[0];
          head.appendChild(link);
        }
        // 消息列表
        const _messageList = data?.messageList || [];
        // 可手动选择的组件列表
        setManualComponents(data?.agent?.manualComponents || []);
        // 变量参数
        const _variables = data?.agent?.variables || [];
        setVariables(_variables);
        // 用户填写的变量参数
        setUserFillVariables(data?.variables || null);
        // 必填参数name列表
        const _requiredNameList = _variables
          ?.filter(
            (item: BindConfigWithSub) => !item.systemVariable && item.require,
          )
          ?.map((item: BindConfigWithSub) => item.name);
        setRequiredNameList(_requiredNameList || []);
        const len = _messageList?.length || 0;
        // 存在消息列表时，设置消息列表
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
            // 问答模式 - 问题建议列表
            const suggestList =
              lastMessage.ext.map((item) => item.content) || [];
            setChatSuggestList(suggestList);
          }
          // 如果消息列表大于1时，说明已开始会话，就不显示预置问题，反之显示
          else if (len === 1) {
            // 如果存在预置问题，显示预置问题
            setChatSuggestList(data?.agent?.openingGuidQuestions || []);
          }
        }
        // 不存在会话消息时，才显示开场白预置问题
        else {
          setChatSuggestList(data?.agent?.openingGuidQuestions || []);
        }
        // 初始化会话信息: 开场白
        if (!_messageList?.length && data?.agent?.openingChatMsg) {
          const currentMessage = {
            role: AssistantRoleEnum.ASSISTANT,
            type: MessageModeEnum.CHAT,
            text: data?.agent?.openingChatMsg,
            time: dayjs().toString(),
            id: uuidv4(),
            messageType: MessageTypeEnum.ASSISTANT,
          } as MessageInfo;
          setMessageList(() => {
            checkConversationActive([currentMessage]);
            return [currentMessage];
          });
        }

        handleScrollBottom();
      },
      onError: () => {
        setIsLoadingConversation(false);
        disabledConversationActive();
      },
    },
  );

  // 创建临时会话
  const { runAsync: runTempChatCreate } = useRequest(
    apiTempChatConversationCreate,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  // 修改消息列表
  const handleChangeMessageList = (
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
              (!messageIdRef.current || messageIdRef.current !== id) &&
              finished
            ) {
              newMessage = {
                ...currentMessage,
                id,
                text: `${currentMessage.text}${text}`,
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
          newMessage = {
            ...currentMessage,
            status: MessageStatusEnum.Complete,
            finalResult: data,
            id: res.requestId,
          };
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

  // 会话处理
  const handleConversation = async (
    params: TempConversationChatParams,
    currentMessageId: string,
  ) => {
    // 启动连接
    abortConnectionRef.current = await createSSEConnection({
      url: TEMP_CONVERSATION_CONNECTION_URL,
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      onMessage: (res: ConversationChatResponse) => {
        handleChangeMessageList(res, currentMessageId);
        // 滚动到底部
        handleScrollBottom();
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
      onClose: () => {
        disabledConversationActive();
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
    setMessageList([]);
    setConversationInfo(null);
    allowAutoScrollRef.current = true;
    setShowScrollBtn(false);
    if (timeoutRef.current) {
      //清除会话定时器
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 发送消息
  const onMessageSend = async (
    message: string,
    files: UploadFileInfo[] = [],
    infos: AgentSelectedComponentInfo[] = [],
    variableParams: Record<string, string | number> | null = null,
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
      text: message,
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
    const params: TempConversationChatParams = {
      chatKey,
      conversationUid: conversationUid.current || '',
      message,
      attachments,
      variableParams,
      selectedComponents: infos,
    };
    // 处理会话
    handleConversation(params, currentMessageId);
  };

  // 角色信息（名称、头像）
  const roleInfo: RoleInfo = useMemo(() => {
    const agent = conversationInfo?.agent;
    return {
      assistant: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
      system: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
    };
  }, [conversationInfo]);

  const handleCreateTempChat = async (captchaVerifyParam: string) => {
    // 创建临时会话
    const {
      data,
      success,
      message: _message,
    } = await runTempChatCreate({ chatKey, captchaVerifyParam });
    if (success) {
      conversationUid.current = data.uid;
      sessionStorage.setItem(TEMP_CONVERSATION_UID, data.uid);
      // 查询临时会话详细
      runQueryConversation({ chatKey, conversationUid: data.uid });
    } else {
      setIsLoadingConversation(false);
      message.warning(_message);
    }
  };

  // 清空会话记录，实际上是创建新的会话
  const handleClear = useCallback(async () => {
    handleClearSideEffect();
    setMessageList([]);
    setIsLoadingConversation(true);
    // 创建临时会话
    handleCreateTempChat(captchaVerifyParamRef.current);
  }, [chatKey]);

  const asyncFun = async (captchaVerifyParam: string = '') => {
    if (chatKey) {
      captchaVerifyParamRef.current = captchaVerifyParam;
      setIsLoadingConversation(true);
      const uid = sessionStorage.getItem(TEMP_CONVERSATION_UID);
      if (uid) {
        // 查询临时会话详细
        runQueryConversation({ chatKey, conversationUid: uid });
        conversationUid.current = uid;
        return;
      }
      // 创建临时会话
      handleCreateTempChat(captchaVerifyParam);
    }
  };

  useEffect(() => {
    if (tenantConfigInfo) {
      const { captchaSceneId, captchaPrefix, openCaptcha } = tenantConfigInfo;
      // 是否需要阿里云验证码, 只有同时满足三个条件才启用验证码：场景ID存在、身份标存在、开启验证码
      const isNeedCaptcha = !!(captchaSceneId && captchaPrefix && openCaptcha);

      // 不需要阿里云验证码时，直接调用接口
      if (!isNeedCaptcha) {
        asyncFun();
      }
    }
  }, [tenantConfigInfo]);

  // 在组件挂载时添加滚动事件监听器
  useEffect(() => {
    const messageView = messageViewRef.current;
    if (messageView) {
      const handleScroll = () => {
        // 当用户手动滚动时，暂停自动滚动
        const { scrollTop, scrollHeight, clientHeight } = messageView;
        if (scrollTop + clientHeight < scrollHeight) {
          allowAutoScrollRef.current = false;
          // 清除滚动
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = null;
          }
          setShowScrollBtn(true);
        } else {
          // 当用户滚动到底部时，重新允许自动滚动
          allowAutoScrollRef.current = true;
          setShowScrollBtn(false);
        }
      };

      messageView.addEventListener('wheel', throttle(handleScroll, 300));
      // 组件卸载时移除滚动事件监听器
      return () => {
        messageView.removeEventListener('wheel', throttle(handleScroll, 300));
        resetInit();
      };
    }
  }, []);

  useEffect(() => {
    // 租户配置信息查询接口
    runTenantConfig();
    addBaseTarget();
  }, []);

  useEffect(() => {
    // 初始化选中的组件列表
    if (manualComponents?.length) {
      // 手动组件默认选中的组件
      const _manualComponents = manualComponents
        .filter((item) => item.defaultSelected === DefaultSelectedEnum.Yes)
        .map((item) => ({
          id: item.id,
          type: item.type,
        }));
      setSelectedComponentList(_manualComponents || []);
    }
  }, [manualComponents]);

  // 选中配置组件
  const handleSelectComponent = (item: AgentSelectedComponentInfo) => {
    const _selectedComponentList = [...selectedComponentList];
    // 已存在则删除
    if (_selectedComponentList.some((c) => c.id === item.id)) {
      const index = _selectedComponentList.findIndex((c) => c.id === item.id);
      _selectedComponentList.splice(index, 1);
    } else {
      _selectedComponentList.push({
        id: item.id,
        type: item.type,
      });
    }

    setSelectedComponentList(_selectedComponentList);
  };

  // 消息发送
  const handleMessageSend = (
    messageInfo: string,
    files: UploadFileInfo[] = [],
  ) => {
    // 变量参数为空，不发送消息
    if (wholeDisabled) {
      form.validateFields(); // 触发表单验证以显示error
      message.warning('请填写必填参数');
      return;
    }
    isSendMessageRef.current = true;
    onMessageSend(messageInfo, files, selectedComponentList, variableParams);
  };

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    // 滚动到底部
    messageViewRef.current?.scrollTo({
      top: messageViewRef.current?.scrollHeight,
      behavior: 'smooth',
    });
    setShowScrollBtn(false);
  };

  // 点击页脚跳转到租户官网
  const handleSiteLink = () => {
    if (tenantConfigInfo) {
      const { siteUrl } = tenantConfigInfo;
      window.open(siteUrl, '_blank');
    }
  };
  const handleCaptchaReady = () => {
    document.getElementById(buttonId)?.click();
  };

  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'flex-col',
        'h-full',
        'overflow-y',
      )}
      ref={messageViewRef}
    >
      <div
        className={cx(
          'w-full',
          'flex-1',
          'flex',
          'flex-col',
          styles['main-content'],
        )}
      >
        <ConditionRender condition={messageList?.length > 0}>
          <div className={cx(styles['title-box'])}>
            <h3
              className={cx(
                styles.title,
                'text-ellipsis',
                'clip-path-animation',
              )}
            >
              {conversationInfo?.agent?.name
                ? `和${conversationInfo?.agent?.name}开始会话`
                : '开始会话'}
            </h3>
          </div>
        </ConditionRender>
        <div className={cx(styles['chat-wrapper'], 'flex-1')}>
          {isLoadingConversation ? (
            <div
              className={cx('flex', 'items-center', 'content-center', 'h-full')}
            >
              <LoadingOutlined className={cx(styles.loading)} />
            </div>
          ) : (
            <>
              {/* 新对话设置 */}
              <NewConversationSet
                className="mb-16"
                form={form}
                variables={variables}
                isFilled={isSendMessageRef.current}
                disabled={!!userFillVariables || isSendMessageRef.current}
              />
              {messageList?.length > 0 ? (
                <>
                  {messageList?.map((item: MessageInfo, index: number) => (
                    <ChatView
                      className={cx(styles['phone-chat-item'])}
                      key={index}
                      messageInfo={item}
                      roleInfo={roleInfo}
                      mode={'home'}
                    />
                  ))}
                  {/*会话建议*/}
                  <RecommendList
                    chatSuggestList={chatSuggestList}
                    onClick={handleMessageSend}
                  />
                </>
              ) : (
                isLoaded && (
                  // Chat记录为空
                  <AgentChatEmpty
                    className={cx({ 'h-full': !variables?.length })}
                    icon={conversationInfo?.agent?.icon}
                    name={conversationInfo?.agent?.name || ''}
                    // 会话建议
                    extra={
                      <RecommendList
                        className="mt-16"
                        itemClassName={cx(styles['suggest-item'])}
                        chatSuggestList={chatSuggestList}
                        onClick={handleMessageSend}
                      />
                    }
                  />
                )
              )}
            </>
          )}
        </div>
        <div className={cx(styles['chat-input-container'])}>
          {/*会话输入框*/}
          <ChatInputHome
            key={`chat-temp-${chatKey}`}
            className={cx(styles['input-container'])}
            clearDisabled={!messageList?.length}
            onEnter={handleMessageSend}
            onClear={handleClear}
            visible={showScrollBtn}
            wholeDisabled={wholeDisabled}
            manualComponents={manualComponents}
            selectedComponentList={selectedComponentList}
            onSelectComponent={handleSelectComponent}
            onScrollBottom={onScrollBottom}
          />
          {/*手机会话输入框*/}
          <ChatInputPhone
            className={cx(styles['phone-container'])}
            clearDisabled={!messageList?.length}
            onClear={handleClear}
            wholeDisabled={wholeDisabled}
            onEnter={handleMessageSend}
            visible={showScrollBtn}
            onScrollBottom={onScrollBottom}
          />
          <p
            className={cx(
              styles['welcome-text'],
              'text-ellipsis',
              'cursor-pointer',
              'clip-path-animation',
            )}
            onClick={handleSiteLink}
          >{`欢迎使用${tenantConfigInfo?.siteName}平台，快速搭建你的个性化智能体`}</p>
        </div>
      </div>
      <button
        id={buttonId}
        type="button"
        className={cx(styles['captcha-button'])}
      />
      <AliyunCaptcha
        config={tenantConfigInfo}
        doAction={asyncFun}
        elementId={buttonId}
        onReady={handleCaptchaReady}
      />
    </div>
  );
};

export default ChatTemp;
