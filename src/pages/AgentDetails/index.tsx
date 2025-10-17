import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar, { AgentSidebarRef } from '@/components/AgentSidebar';
import SvgIcon from '@/components/base/SvgIcon';
import PagePreview from '@/components/business-component/PagePreview';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import { SIDEBAR_WIDTH } from '@/constants/agent.constants';
import useAgentDetails from '@/hooks/useAgentDetails';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  AssistantRoleEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { AgentDetailDto, GuidQuestionDto } from '@/types/interfaces/agent';
import type {
  BindConfigWithSub,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { arraysContainSameItems } from '@/utils/common';
import { LoadingOutlined } from '@ant-design/icons';
import { Button, Form, message, Typography } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);
/**
 * 主页咨询聊天页面
 */
const AgentDetails: React.FC = () => {
  // 智能体ID
  const params = useParams();
  const agentId = Number(params.agentId);
  const [form] = Form.useForm();
  const { isMobile } = useModel('layout');
  const { runHistoryItem } = useModel('conversationHistory');
  // 获取 chat model 中的页面预览状态
  const { showPagePreview } = useModel('chat');
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<GuidQuestionDto[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  // 变量参数
  const [variables, setVariables] = useState<BindConfigWithSub[]>([]);
  // 必填变量参数name列表
  const [requiredNameList, setRequiredNameList] = useState<string[]>([]);
  // 变量参数
  const [variableParams, setVariableParams] = useState<Record<
    string,
    string | number
  > | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // 会话ID
  const [conversationId, setConversationId] = useState<number | null>(null);

  // 会话输入框已选择组件
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();
  // 智能体详情
  const { agentDetail, setAgentDetail, handleToggleCollectSuccess } =
    useAgentDetails();

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

  // 已发布的智能体详情接口
  const { run: runDetail } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      setLoading(false);
      setAgentDetail(result);
      setConversationId(result?.conversationId || null);
      // 会话问题建议
      const guidQuestionDtos = result?.guidQuestionDtos || [];
      // 如果存在预置问题，显示预置问题
      setChatSuggestList(guidQuestionDtos);
      // 变量参数
      const _variables = result?.variables || [];
      setVariables(_variables);
      // 必填参数name列表
      const _requiredNameList = _variables
        ?.filter(
          (item: BindConfigWithSub) => !item.systemVariable && item.require,
        )
        ?.map((item: BindConfigWithSub) => item.name);
      setRequiredNameList(_requiredNameList || []);
      // 初始化会话信息: 开场白
      if (result?.openingChatMsg) {
        const currentMessage = {
          role: AssistantRoleEnum.ASSISTANT,
          type: MessageModeEnum.CHAT,
          text: result?.openingChatMsg,
          time: dayjs().toString(),
          id: uuidv4(),
          messageType: MessageTypeEnum.ASSISTANT,
        } as MessageInfo;
        setMessageList([currentMessage]);
      }
      setIsLoaded(true);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    setLoading(true);
    runDetail(agentId, true);

    // 获取当前智能体的历史记录
    runHistoryItem({
      agentId,
      limit: 20,
    });

    return () => {
      setIsLoaded(false);
      setMessageList([]);
      setChatSuggestList([]);
      setAgentDetail(null);
      setSelectedComponentList([]);
      setVariables([]);
    };
  }, [agentId]);

  useEffect(() => {
    // 初始化选中的组件列表
    initSelectedComponentList(agentDetail?.manualComponents);
  }, [agentDetail?.manualComponents]);

  // 角色信息（名称、头像）
  const roleInfo: RoleInfo = useMemo(() => {
    return {
      assistant: {
        name: agentDetail?.name as string,
        avatar: agentDetail?.icon as string,
      },
      system: {
        name: agentDetail?.name as string,
        avatar: agentDetail?.icon as string,
      },
    };
  }, [agentDetail]);

  // 消息发送
  const handleMessageSend = (messageInfo: string, files?: UploadFileInfo[]) => {
    // 智能体信息为空
    if (!agentDetail) {
      return;
    }
    // 变量参数为空，不发送消息
    if (wholeDisabled) {
      form.validateFields(); // 触发表单验证以显示error
      message.warning('请填写必填参数');
      return;
    }

    history.push(`/home/chat/${conversationId}/${agentId}`, {
      message: messageInfo,
      files,
      infos: selectedComponentList,
      defaultAgentDetail: agentDetail,
      variableParams,
    });
  };
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const sidebarRef = useRef<AgentSidebarRef>(null);

  useEffect(() => {
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
  }, [agentDetail]);

  return (
    <div className={cx('flex', 'h-full')}>
      <div
        style={{
          width: isSidebarVisible ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%',
          overflow: 'auto',
          display: 'flex',
        }}
      >
        {agentDetail?.hideChatArea ? null : (
          <div
            className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}
            style={{ width: '33%' }}
          >
            <div className={cx(styles['title-box'])}>
              <div className={cx(styles['title-container'])}>
                {/* 左侧标题 */}
                <Typography.Title
                  level={5}
                  className={cx(styles.title, 'clip-path-animation')}
                  ellipsis={{ rows: 1, expandable: false, symbol: '...' }}
                >
                  {isLoaded &&
                    (agentDetail?.name
                      ? `和${agentDetail?.name}开始会话`
                      : '开始会话')}
                </Typography.Title>

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
            <div className={cx(styles['main-content-box'])}>
              <div className={cx(styles['chat-wrapper-content'])}>
                <div className={cx(styles['chat-wrapper'], 'flex-1')}>
                  {loading ? (
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
                        key={agentId}
                        className="mb-16"
                        form={form}
                        isFilled
                        variables={variables}
                      />
                      {messageList?.length > 0 ? (
                        <>
                          {messageList?.map(
                            (item: MessageInfo, index: number) => (
                              <ChatView
                                key={index}
                                messageInfo={item}
                                roleInfo={roleInfo}
                                contentClassName={styles['chat-inner']}
                                mode={'none'}
                              />
                            ),
                          )}
                          {/*会话建议*/}
                          <RecommendList
                            itemClassName={styles['suggest-item']}
                            chatSuggestList={chatSuggestList}
                            onClick={handleMessageSend}
                          />
                        </>
                      ) : (
                        isLoaded && (
                          // Chat记录为空
                          <AgentChatEmpty
                            className={cx({ 'h-full': !variables?.length })}
                            icon={agentDetail?.icon}
                            name={agentDetail?.name || ''}
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
                className={cx(styles['chat-input-container'])}
                key={`agent-details-${agentId}`}
                onEnter={handleMessageSend}
                isClearInput={false}
                wholeDisabled={wholeDisabled}
                manualComponents={agentDetail?.manualComponents || []}
                selectedComponentList={selectedComponentList}
                onSelectComponent={handleSelectComponent}
                showAnnouncement={true}
              />
            </div>
          </div>
        )}

        {/*页面预览区域*/}
        {agentDetail && (
          <PagePreview
            initialWidth={agentDetail?.hideChatArea ? 100 : 66}
            showCloseButton={!agentDetail?.hideChatArea}
            showResizeHandle={!agentDetail?.hideChatArea}
          />
        )}
      </div>
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
    </div>
  );
};

export default AgentDetails;
