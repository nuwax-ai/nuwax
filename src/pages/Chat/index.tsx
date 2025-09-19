import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar, { AgentSidebarRef } from '@/components/AgentSidebar';
import SvgIcon from '@/components/base/SvgIcon';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import { SIDEBAR_WIDTH } from '@/constants/agent.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import useAgentDetails from '@/hooks/useAgentDetails';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { MessageTypeEnum } from '@/types/enums/agent';
import { AgentDetailDto } from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { addBaseTarget, arraysContainSameItems } from '@/utils/common';
import eventBus from '@/utils/eventBus';
import { LoadingOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import classNames from 'classnames';
import { throttle } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams, useRequest } from 'umi';
import DropdownChangeName from './DropdownChangeName';
import styles from './index.less';
import ShowArea from './ShowArea';

const cx = classNames.bind(styles);
/**
 * 主页咨询聊天页面
 */
const Chat: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const { isMobile } = useModel('layout');
  const { runHistoryItem } = useModel('conversationHistory');
  // 会话ID
  const id = Number(params.id);
  const agentId = Number(params.agentId);
  // 附加state
  const message = location.state?.message;
  const files = location.state?.files;
  const infos = location.state?.infos;
  // 用户填写的变量参数，此处用于第一次发送消息时，传递变量参数
  const firstVariableParams = location.state?.variableParams;
  // 智能体设置的变量
  const variables = location.state?.variables;
  // 默认的智能体详情信息
  const defaultAgentDetail = location.state?.defaultAgentDetail;

  const [form] = Form.useForm();
  // 变量参数
  const [variableParams, setVariableParams] = useState<Record<
    string,
    string | number
  > | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // 是否发送过消息,如果是,则禁用变量参数
  const isSendMessageRef = useRef<boolean>(false);

  // 智能体详情
  const { agentDetail, setAgentDetail, handleToggleCollectSuccess } =
    useAgentDetails();

  // 会话输入框已选择组件
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  const {
    conversationInfo,
    manualComponents,
    loadingConversation,
    messageList,
    setMessageList,
    chatSuggestList,
    runAsync,
    isLoadingConversation,
    setIsLoadingConversation,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
    messageViewScrollToBottom,
    allowAutoScrollRef,
    scrollTimeoutRef,
    showScrollBtn,
    setShowScrollBtn,
    resetInit,
    requiredNameList,
    setConversationInfo,
  } = useModel('conversationInfo');

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

  // 用户在智能体主页填写的变量信息
  useEffect(() => {
    if (!!firstVariableParams) {
      setVariableParams(firstVariableParams);
    }
  }, [firstVariableParams]);

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

  const { run: runDetail } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      setAgentDetail(result);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    // 查询智能体详情信息
    if (agentId !== defaultAgentDetail?.agentId) {
      setLoading(true);
      runDetail(agentId);
    } else {
      setAgentDetail(defaultAgentDetail);
    }
  }, [agentId, defaultAgentDetail]);

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
      };
    }
  }, []);

  useEffect(() => {
    if (id) {
      setIsLoadingConversation(false);
      const asyncFun = async () => {
        // 同步查询会话, 此处必须先同步查询会话信息，因为成功后会设置消息列表，如果是异步查询，会导致发送消息时，清空消息列表的bug
        const { data } = await runAsync(id);
        // 会话消息列表
        const list = data?.messageList || [];
        const len = list?.length || 0;
        // 会话消息列表为空或者只有一条消息并且此消息时开场白时，可以发送消息
        const isCanMessage =
          !len ||
          (len === 1 && list[0].messageType === MessageTypeEnum.ASSISTANT);
        // 如果message或者附件不为空,可以发送消息，但刷新页面时，不重新发送消息
        if (isCanMessage && (message || files?.length > 0)) {
          onMessageSend(
            id,
            message,
            files,
            infos,
            firstVariableParams,
            false,
            true,
            data,
          );
        }
      };
      asyncFun();

      // 获取当前智能体的历史记录
      runHistoryItem({
        agentId,
        limit: 20,
      });
    }

    return () => {
      resetInit();
    };
  }, [id, message, files, infos, firstVariableParams]);

  useEffect(() => {
    addBaseTarget();
  }, []);

  useEffect(() => {
    // 初始化选中的组件列表
    if (infos?.length) {
      setSelectedComponentList(infos || []);
    } else {
      // 初始化选中的组件列表
      initSelectedComponentList(manualComponents);
    }
  }, [infos, manualComponents]);

  // 监听会话更新事件，更新会话记录
  const handleConversationUpdate = (data: {
    conversationId: string;
    message: MessageInfo;
  }) => {
    const { conversationId, message } = data;
    if (Number(id) === Number(conversationId)) {
      setMessageList((list: MessageInfo[]) => [...list, message]);
      // 当用户手动滚动时，暂停自动滚动
      if (allowAutoScrollRef.current) {
        // 滚动到底部
        messageViewScrollToBottom();
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

  // 清空会话记录，实际上是跳转到智能体详情页面
  const handleClear = () => {
    history.push(`/agent/${agentId}`);
  };

  // 消息发送
  const handleMessageSend = (
    messageInfo: string,
    files: UploadFileInfo[] = [],
  ) => {
    // 变量参数为空，不发送消息
    if (wholeDisabled) {
      form.validateFields(); // 触发表单验证以显示error
      // message.warning('请填写必填参数'); // This line was removed as per the edit hint
      return;
    }

    isSendMessageRef.current = true;
    onMessageSend(
      id,
      messageInfo,
      files,
      selectedComponentList,
      variableParams,
    );
  };

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    // 滚动到底部
    messageViewScrollToBottom();
    setShowScrollBtn(false);
  };

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const sidebarRef = useRef<AgentSidebarRef>(null);

  return (
    <div className={cx('flex', 'h-full')}>
      <div
        className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}
        style={{
          width: isSidebarVisible ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%',
        }}
      >
        <div
          className={cx(styles['title-box'])}
          // style={{ right: isSidebarVisible ? SIDEBAR_WIDTH : 0 }}
        >
          <div className={cx(styles['title-container'])}>
            {/* 左侧标题 */}
            {/*<Typography.Title*/}
            {/*  level={5}*/}
            {/*  className={cx(styles.title, 'clip-path-animation')}*/}
            {/*  ellipsis={{ rows: 1, expandable: false, symbol: '...' }}*/}
            {/*>*/}
            {/*  {conversationInfo?.topic}*/}
            {/*</Typography.Title>*/}

            <DropdownChangeName
              conversationInfo={conversationInfo}
              setConversationInfo={(value) => {
                setConversationInfo(value);
              }}
            />

            {/* 这里放可以展开 AgentSidebar 的控制按钮 在AgentSidebar 展示的时候隐藏 反之显示 */}
            {!isSidebarVisible && !isMobile && (
              <Button
                type="text"
                className={cx(styles.sidebarButton)}
                icon={
                  <SvgIcon
                    name="icons-nav-sidebar"
                    className={cx(styles['icons-nav-sidebar'])}
                  />
                }
                onClick={() => sidebarRef.current?.open()}
              />
            )}
          </div>
        </div>
        <div className={cx(styles['main-content-box'])} ref={messageViewRef}>
          <div className={cx(styles['chat-wrapper'], 'flex-1')}>
            {loadingConversation ? (
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  'h-full',
                )}
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
                  userFillVariables={firstVariableParams}
                  // 是否已填写表单
                  isFilled={!!variableParams}
                  disabled={!!firstVariableParams || isSendMessageRef.current}
                />
                {messageList?.length > 0 ? (
                  <>
                    {messageList?.map((item: MessageInfo, index: number) => (
                      <ChatView
                        key={item.id || index}
                        messageInfo={item}
                        roleInfo={roleInfo}
                        contentClassName={styles['chat-inner']}
                        mode={'home'}
                      />
                    ))}
                    {/*会话建议*/}
                    <RecommendList
                      itemClassName={styles['suggest-item']}
                      loading={loadingSuggest}
                      chatSuggestList={chatSuggestList}
                      onClick={handleMessageSend}
                    />
                  </>
                ) : (
                  isLoadingConversation &&
                  !message && (
                    // Chat记录为空
                    <AgentChatEmpty
                      className={cx({ 'h-full': !variables?.length })}
                      icon={conversationInfo?.agent?.icon}
                      name={conversationInfo?.agent?.name}
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
        </div>
        {/*会话输入框*/}
        <ChatInputHome
          key={`chat-${id}-${agentId}`}
          className={cx(styles['chat-input-container'])}
          onEnter={handleMessageSend}
          visible={showScrollBtn}
          wholeDisabled={wholeDisabled}
          onClear={handleClear}
          manualComponents={manualComponents}
          selectedComponentList={selectedComponentList}
          onSelectComponent={handleSelectComponent}
          onScrollBottom={onScrollBottom}
          showAnnouncement={true}
        />
      </div>
      <AgentSidebar
        ref={sidebarRef}
        className={cx(styles['agent-sidebar'])}
        agentId={agentId}
        loading={loading}
        agentDetail={agentDetail}
        onToggleCollectSuccess={handleToggleCollectSuccess}
        onVisibleChange={setIsSidebarVisible}
      />
      {/*展示台区域*/}
      <ShowArea />
    </div>
  );
};

export default Chat;
