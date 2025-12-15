import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar, { AgentSidebarRef } from '@/components/AgentSidebar';
import SvgIcon from '@/components/base/SvgIcon';
import {
  CopyToSpaceComponent,
  PagePreviewIframe,
} from '@/components/business-component';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import ResizableSplit from '@/components/ResizableSplit';
import { EVENT_TYPE } from '@/constants/event.constants';
import useAgentDetails from '@/hooks/useAgentDetails';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import useExclusivePanels from '@/hooks/useExclusivePanels';
import useMessageEventDelegate from '@/hooks/useMessageEventDelegate';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { AgentDetailDto } from '@/types/interfaces/agent';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import {
  addBaseTarget,
  arraysContainSameItems,
  parsePageAppProjectId,
} from '@/utils/common';
import eventBus from '@/utils/eventBus';
import { jumpToPageDevelop } from '@/utils/router';
import { LoadingOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import classNames from 'classnames';
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
  // 消息来源
  const messageSourceType: MessageSourceType =
    (location.state?.messageSourceType as MessageSourceType) || 'new_chat'; // new_chat 新增会话
  // 默认的智能体详情信息
  const defaultAgentDetail = location.state?.defaultAgentDetail;
  // 用户填写的变量参数，此处用于第一次发送消息时，传递变量参数
  const firstVariableParams = location.state?.variableParams;

  const [form] = Form.useForm();
  // 变量参数
  const [variableParams, setVariableParams] = useState<Record<
    string,
    string | number
  > | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [clearLoading, setClearLoading] = useState<boolean>(false);
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
    messageList,
    setMessageList,
    chatSuggestList,
    runAsync,
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
    variables,
    showType,
    setShowType,
  } = useModel('conversationInfo');

  // 页面预览相关状态
  const { pagePreviewData, showPagePreview, hidePagePreview } =
    useModel('chat');

  // 复制模板弹窗状态
  const [openCopyModal, setOpenCopyModal] = useState<boolean>(false);

  // 从 pagePreviewData 的 params 或 URI 中获取工作流信息
  // 支持多种可能的参数名：workflowId, workflow_id, id
  // 也支持从 URI 路径中解析（如 /square/workflow/123）
  const workflowId = useMemo(() => {
    // 1. 先从 params 中获取
    if (pagePreviewData?.params) {
      const params = pagePreviewData.params;
      const workflowIdFromParams =
        params.workflowId || params.workflow_id || params.id;
      if (workflowIdFromParams) {
        const id = Number(workflowIdFromParams);
        if (!isNaN(id)) return id;
      }
    }

    // 2. 从 URI 路径中解析（如 /square/workflow/123 或 /workflow/123）
    if (pagePreviewData?.uri) {
      const uri = pagePreviewData.uri;
      const workflowMatch = uri.match(/[/]workflow[/](\d+)/i);
      if (workflowMatch && workflowMatch[1]) {
        const id = Number(workflowMatch[1]);
        if (!isNaN(id)) return id;
      }
    }

    return null;
  }, [pagePreviewData?.params, pagePreviewData?.uri]);

  // 判断是否显示复制按钮（智能体允许复制即可显示，支持复制智能体或工作流模板）
  const showCopyButton = useMemo(() => {
    const shouldShow = agentDetail?.allowCopy === AllowCopyEnum.Yes;
    // 调试：输出相关信息
    console.log('[Chat] 复制按钮显示条件:', {
      workflowId,
      agentId: agentDetail?.agentId,
      allowCopy: agentDetail?.allowCopy,
      allowCopyEnum: AllowCopyEnum.Yes,
      showCopyButton: shouldShow,
      pagePreviewData: pagePreviewData,
      uri: pagePreviewData?.uri,
      params: pagePreviewData?.params,
    });
    return shouldShow;
  }, [
    workflowId,
    agentDetail?.allowCopy,
    agentDetail?.agentId,
    pagePreviewData,
  ]);

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

  // 打开扩展页面
  const handleOpenPreview = (agentDetail: any) => {
    // 判断是否默认展示页面首页
    if (
      agentDetail &&
      agentDetail?.expandPageArea &&
      agentDetail?.pageHomeIndex
    ) {
      // 自动触发预览
      showPagePreview({
        name: '页面预览',
        uri: process.env.BASE_URL + agentDetail?.pageHomeIndex,
        params: {},
        executeId: '',
      });
    } else {
      showPagePreview(null);
    }
  };

  const { run: runDetail } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      setAgentDetail(result);
      handleOpenPreview(result);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  const { run: runDetailNew } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      const { agentId, conversationId } = result;
      history.replace(`/home/chat/${conversationId}/${agentId}`, {
        message: '',
        files: [],
        infos,
        defaultAgentDetail,
        firstVariableParams,
      });
      setClearLoading(false);
    },
    onError: () => {
      setClearLoading(false);
    },
  });

  useEffect(() => {
    // 查询智能体详情信息
    if (agentId !== defaultAgentDetail?.agentId) {
      setLoading(true);
      runDetail(agentId);
    } else {
      setAgentDetail(defaultAgentDetail);
      handleOpenPreview(defaultAgentDetail);
    }
  }, [agentId, defaultAgentDetail]);

  // 使用滚动检测 Hook
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
  );

  useEffect(() => {
    if (id) {
      setIsLoadingConversation(false);
      // 切换会话时，重置自动滚动标志，确保新会话能够自动滚动到底部
      allowAutoScrollRef.current = true;

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
  }, [id, message, files, infos, firstVariableParams]);

  useEffect(() => {
    addBaseTarget();

    return () => {
      // 组件卸载时重置全局会话状态，防止污染其他页面
      resetInit();
      setSelectedComponentList([]);
    };
  }, []);

  useEffect(() => {
    if (messageSourceType === 'new_chat') {
      // 新建会话时，初始化选中的组件列表
      initSelectedComponentList(manualComponents);
    } else {
      // 非新建会话时，使用外面传过来的组件列表
      setSelectedComponentList(infos || []);
    }
  }, [infos, messageSourceType, manualComponents]);

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
    // history.push(`/agent/${agentId}`);
    setClearLoading(true);
    runDetailNew(agentId, true);
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

  // 互斥面板控制器：管理 PagePreview、AgentSidebar、ShowArea 的互斥展示
  useExclusivePanels({
    pagePreviewData,
    hidePagePreview,
    isSidebarVisible,
    sidebarRef,
    showType,
    setShowType,
  });

  // 消息事件代理（处理会话输出中的点击事件）
  useMessageEventDelegate({
    containerRef: messageViewRef,
    eventBindConfig: conversationInfo?.agent?.eventBindConfig,
  });

  const LeftContent = () => {
    return (
      <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
        <div className={cx(styles['title-box'])}>
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
            <div>
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
                  onClick={() => {
                    hidePagePreview();
                    sidebarRef.current?.open();
                  }}
                />
              )}

              {/*打开预览页面*/}
              {!!agentDetail?.expandPageArea &&
                !!agentDetail?.pageHomeIndex &&
                !pagePreviewData && (
                  <Button
                    type="text"
                    className={cx(styles.sidebarButton)}
                    icon={
                      <SvgIcon
                        name="icons-nav-ecosystem"
                        className={cx(styles['icons-nav-sidebar'])}
                      />
                    }
                    onClick={() => {
                      sidebarRef.current?.close();
                      handleOpenPreview(agentDetail);
                    }}
                  />
                )}
            </div>
          </div>
        </div>
        <div className={cx(styles['main-content-box'])}>
          <div
            className={cx(styles['chat-wrapper-content'])}
            ref={messageViewRef}
          >
            <div className={cx(styles['chat-wrapper'], 'flex-1')}>
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
                !message &&
                (conversationInfo ? (
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
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      height: '100%',
                      width: '100%',
                      margin: '50px auto',
                    }}
                  >
                    <LoadingOutlined />
                  </div>
                ))
              )}
            </div>
          </div>
          <ChatInputHome
            // key={`chat-${id}-${agentId}`}
            key={`agent-details-${agentId}`}
            className={cx(styles['chat-input-container'])}
            onEnter={handleMessageSend}
            visible={showScrollBtn}
            wholeDisabled={wholeDisabled}
            clearLoading={clearLoading}
            onClear={handleClear}
            manualComponents={manualComponents}
            selectedComponentList={selectedComponentList}
            onSelectComponent={handleSelectComponent}
            onScrollBottom={onScrollBottom}
            showAnnouncement={true}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={cx('flex', 'h-full')}>
      {/*智能体聊天和预览页面*/}
      {loading ? (
        // 接口加载中，显示 loading 状态，避免右侧渲染时挤压左侧
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '100%',
            width: '100%',
          }}
        >
          <LoadingOutlined />
        </div>
      ) : (
        <ResizableSplit
          minLeftWidth={400}
          left={agentDetail?.hideChatArea ? null : LeftContent()}
          right={
            pagePreviewData && (
              <>
                <PagePreviewIframe
                  pagePreviewData={pagePreviewData}
                  showHeader={true}
                  onClose={hidePagePreview}
                  showCloseButton={!agentDetail?.hideChatArea}
                  titleClassName={cx(styles['title-style'])}
                  // 复制模板按钮相关 props
                  showCopyButton={showCopyButton}
                  allowCopy={agentDetail?.allowCopy === AllowCopyEnum.Yes}
                  onCopyClick={() => setOpenCopyModal(true)}
                  copyButtonText="复制模板"
                  copyButtonClassName={styles['copy-btn']}
                />
                {/* 复制模板弹窗 */}
                {showCopyButton && agentDetail && pagePreviewData?.uri && (
                  <CopyToSpaceComponent
                    spaceId={agentDetail.spaceId}
                    mode={AgentComponentTypeEnum.Page}
                    componentId={parsePageAppProjectId(pagePreviewData?.uri)}
                    title={''}
                    open={openCopyModal}
                    isTemplate={true}
                    onSuccess={(_: any, targetSpaceId: number) => {
                      setOpenCopyModal(false);
                      // 跳转
                      jumpToPageDevelop(targetSpaceId);
                    }}
                    onCancel={() => setOpenCopyModal(false)}
                  />
                )}
              </>
            )
          }
        />
      )}

      <AgentSidebar
        ref={sidebarRef}
        className={cx(
          styles[isSidebarVisible ? 'agent-sidebar-w' : 'agent-sidebar'],
        )}
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
