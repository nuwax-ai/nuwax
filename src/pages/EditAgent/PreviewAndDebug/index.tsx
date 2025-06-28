import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import { EVENT_TYPE } from '@/constants/event.constants';
import useConversation from '@/hooks/useConversation';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import type { PreviewAndDebugHeaderProps } from '@/types/interfaces/agentConfig';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { arraysContainSameItems } from '@/utils/common';
import eventBus from '@/utils/eventBus';
import { LoadingOutlined } from '@ant-design/icons';
import { Form, message } from 'antd';
import classNames from 'classnames';
import { throttle } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import PreviewAndDebugHeader from './PreviewAndDebugHeader';

const cx = classNames.bind(styles);

/**
 * 预览与调试组件
 */
const PreviewAndDebug: React.FC<PreviewAndDebugHeaderProps> = ({
  agentId,
  agentConfigInfo,
  onPressDebug,
}) => {
  const [form] = Form.useForm();
  // 会话ID
  const devConversationIdRef = useRef<number>(0);
  // 变量参数
  const [variableParams, setVariableParams] = useState<Record<
    string,
    string | number
  > | null>(null);

  const {
    messageList,
    setMessageList,
    chatSuggestList,
    loadingConversation,
    runQueryConversation,
    isLoadingConversation,
    setIsLoadingConversation,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    handleClearSideEffect,
    showScrollBtn,
    setShowScrollBtn,
    resetInit,
    manualComponents,
    variables,
    userFillVariables,
    requiredNameList,
  } = useModel('conversationInfo');

  const values = Form.useWatch([], { form, preserve: true });

  React.useEffect(() => {
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

  // 创建智能体会话
  const { runAsyncConversationCreate } = useConversation();
  // 会话输入框已选择组件
  const {
    selectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  // 角色信息（名称、头像）
  const roleInfo: RoleInfo = useMemo(() => {
    return {
      assistant: {
        name: agentConfigInfo?.name as string,
        avatar: agentConfigInfo?.icon as string,
      },
      system: {
        name: agentConfigInfo?.name as string,
        avatar: agentConfigInfo?.icon as string,
      },
    };
  }, [agentConfigInfo]);

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
    // 初始化选中的组件列表
    initSelectedComponentList(manualComponents);
  }, [manualComponents]);

  useEffect(() => {
    if (agentConfigInfo) {
      const { devConversationId } = agentConfigInfo;
      devConversationIdRef.current = devConversationId;
      setIsLoadingConversation(false);
      // 查询会话
      runQueryConversation(devConversationId);
    }
  }, [agentConfigInfo?.devConversationId]);

  // 监听会话更新事件，更新会话记录
  const handleConversationUpdate = (data: {
    conversationId: string;
    message: MessageInfo;
  }) => {
    const { conversationId, message } = data;
    if (devConversationIdRef.current === Number(conversationId)) {
      setMessageList((list: MessageInfo[]) => [...list, message]);
      // 当用户手动滚动时，暂停自动滚动
      if (allowAutoScrollRef.current) {
        // 滚动到底部
        messageViewRef.current?.scrollTo({
          top: messageViewRef.current?.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  };

  useEffect(() => {
    // 监听新消息事件
    eventBus.on(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);

    return () => {
      eventBus.off(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);
    };
  }, []);

  // 清空会话记录，实际上是创建新的会话
  const handleClear = useCallback(async () => {
    handleClearSideEffect();
    setMessageList([]);
    setIsLoadingConversation(false);
    // 创建智能体会话(智能体编排页面devMode为true)
    const { success, data } = await runAsyncConversationCreate({
      agentId,
      devMode: true,
    });

    if (success) {
      const id = data?.id;
      devConversationIdRef.current = id;
      // 查询会话
      runQueryConversation(id);
    }
  }, [agentId]);

  // 消息发送
  const handleMessageSend = (messageInfo: string, files?: UploadFileInfo[]) => {
    const id = devConversationIdRef.current;
    if (!id) {
      return;
    }

    // 变量参数为空，不发送消息
    if (wholeDisabled) {
      form.validateFields(); // 触发表单验证以显示error
      message.warning('请填写必填参数');
      return;
    }

    onMessageSend(id, messageInfo, files, [], variableParams, true, false);
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

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <PreviewAndDebugHeader onPressDebug={onPressDebug} />
      <div className={cx(styles['divider-horizontal'])}></div>
      <div
        className={cx(
          styles['main-content'],
          'flex-1',
          'flex',
          'flex-col',
          'overflow-hide',
        )}
      >
        {/* 新对话设置 */}
        <NewConversationSet form={form} variables={variables} />
        <div
          className={cx(styles['chat-wrapper'], 'flex-1')}
          ref={messageViewRef}
        >
          {loadingConversation ? (
            <div
              className={cx('flex', 'items-center', 'content-center', 'h-full')}
            >
              <LoadingOutlined className={cx(styles.loading)} />
            </div>
          ) : messageList?.length > 0 ? (
            <>
              {messageList?.map((item: MessageInfo) => (
                <ChatView
                  key={item?.id}
                  messageInfo={item}
                  roleInfo={roleInfo}
                  mode={'chat'}
                />
              ))}
              {/*会话建议*/}
              <RecommendList
                loading={loadingSuggest}
                chatSuggestList={chatSuggestList}
                onClick={handleMessageSend}
              />
            </>
          ) : (
            isLoadingConversation && (
              // Chat记录为空
              <AgentChatEmpty
                className="h-full"
                icon={agentConfigInfo?.icon}
                name={agentConfigInfo?.name as string}
                // 会话建议
                extra={
                  <RecommendList
                    className="mt-16"
                    loading={loadingSuggest}
                    chatSuggestList={chatSuggestList}
                    onClick={handleMessageSend}
                  />
                }
              />
            )
          )}
        </div>
        {/*会话输入框*/}
        <ChatInputHome
          clearDisabled={!messageList?.length}
          onEnter={handleMessageSend}
          onClear={handleClear}
          wholeDisabled={wholeDisabled}
          visible={showScrollBtn}
          manualComponents={manualComponents}
          selectedComponentList={selectedComponentList}
          onSelectComponent={handleSelectComponent}
          onScrollBottom={onScrollBottom}
        />
      </div>
    </div>
  );
};

export default PreviewAndDebug;
