import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import { EVENT_TYPE } from '@/constants/event.constants';
import useConversation from '@/hooks/useConversation';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import useMessageEventDelegate from '@/hooks/useMessageEventDelegate';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { EditAgentShowType } from '@/types/enums/space';
import { AgentConfigInfo } from '@/types/interfaces/agent';
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
import cloneDeep from 'lodash/cloneDeep';
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
 * PreviewAndDebug 组件的 Props 接口
 */
interface PreviewAndDebugProps extends PreviewAndDebugHeaderProps {
  /** 设置智能体配置信息的方法 */
  onAgentConfigInfo: (info: AgentConfigInfo) => void;
  onOpenPreview?: () => void;
}

/**
 * 预览与调试组件
 */
const PreviewAndDebug: React.FC<PreviewAndDebugProps> = ({
  agentId,
  agentConfigInfo,
  onAgentConfigInfo,
  onPressDebug,
  onOpenPreview,
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
    conversationInfo,
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
    messageViewScrollToBottom,
    allowAutoScrollRef,
    scrollTimeoutRef,
    handleClearSideEffect,
    showScrollBtn,
    setShowScrollBtn,
    manualComponents,
    variables,
    userFillVariables,
    requiredNameList,
    showType,
    setShowType,
  } = useModel('conversationInfo');

  // 获取 chat model 中的页面预览状态
  const { pagePreviewData, hidePagePreview, showPagePreview } =
    useModel('chat');

  // 创建智能体会话
  const { runAsyncConversationCreate } = useConversation();
  // 会话输入框已选择组件
  const {
    selectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

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

  // 使用滚动检测 Hook
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
  );

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
      // 点击刷子时,智能体要"重置",默认有打开页面就返回到默认首页,默认没有打开页面,则把页面收起来
      const agent = data?.agent || {};
      const expandPageArea = agent.expandPageArea; // 0: 收起, 1: 展开
      const pageHomeIndex = agent.pageHomeIndex;
      if (expandPageArea === 0) {
        hidePagePreview();
      } else {
        showPagePreview({
          uri: pageHomeIndex,
          params: {},
        });
      }

      const id = data?.id;
      devConversationIdRef.current = id;
      if (agentConfigInfo) {
        // 更新智能体配置信息
        const _agentConfigInfo = cloneDeep(agentConfigInfo) as AgentConfigInfo;
        _agentConfigInfo.devConversationId = id;
        onAgentConfigInfo(_agentConfigInfo);
      }
      // 查询会话
      runQueryConversation(id);
    }
  }, [agentId, agentConfigInfo]);

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

    onMessageSend(
      id,
      messageInfo,
      files,
      selectedComponentList,
      variableParams,
      true,
      false,
    );
  };

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    // 滚动到底部
    messageViewScrollToBottom();
    setShowScrollBtn(false);
  };

  // 消息事件代理（处理会话输出中的点击事件）
  useMessageEventDelegate({
    containerRef: messageViewRef,
    eventBindConfig: conversationInfo?.agent?.eventBindConfig,
  });

  // 互斥面板逻辑：管理 PagePreview 和 DebugDetails 的互斥展示
  useEffect(() => {
    // 当页面预览打开时，关闭调试面板
    if (pagePreviewData && showType === EditAgentShowType.Debug_Details) {
      setShowType(EditAgentShowType.Hide);
    }
  }, [pagePreviewData, showType, setShowType]);

  return (
    <div className={cx(styles.container, 'flex', 'h-full')}>
      {/* 主内容区域 */}
      {agentConfigInfo?.hideChatArea ? null : (
        <div
          className={cx('flex', 'flex-col')}
          style={{ flex: 1, minWidth: 340 }}
        >
          <PreviewAndDebugHeader
            onPressDebug={onPressDebug}
            isShowPreview={
              !pagePreviewData && !!agentConfigInfo?.expandPageArea
            }
            onShowPreview={() => {
              onOpenPreview?.();
            }}
          />
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
            <NewConversationSet
              form={form}
              variables={variables}
              isFilled
              userFillVariables={userFillVariables}
            />
            <div
              className={cx(
                styles['chat-wrapper'],
                'scroll-container',
                'flex-1',
              )}
              ref={messageViewRef}
            >
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
                      <div className="flex flex-col items-center content-center">
                        <div className={cx(styles['opening-chat-msg'])}>
                          {agentConfigInfo?.openingChatMsg}
                        </div>
                        <RecommendList
                          className="mt-16"
                          chatSuggestList={
                            agentConfigInfo?.guidQuestionDtos || []
                          }
                          onClick={handleMessageSend}
                        />
                      </div>
                    }
                  />
                )
              )}
            </div>
            {/*会话输入框*/}
            <ChatInputHome
              key={`edit-agent-${agentId}`}
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
      )}
    </div>
  );
};

export default PreviewAndDebug;
