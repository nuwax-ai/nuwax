import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar from '@/components/AgentSidebar';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import useAgentDetails from '@/hooks/useAgentDetails';
import useConversation from '@/hooks/useConversation';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  AssistantRoleEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { AgentDetailDto } from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRequest } from 'umi';
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
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  // 创建智能体会话
  const { handleCreateConversation } = useConversation();
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

  // 已发布的智能体详情接口
  const { run: runDetail, loading } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      setAgentDetail(result);
      // 会话问题建议
      setChatSuggestList(result?.openingGuidQuestions || []);
      // 初始化会话信息: 开场白
      if (result?.openingChatMsg) {
        const currentMessage = {
          role: AssistantRoleEnum.ASSISTANT,
          type: MessageModeEnum.CHAT,
          text: result?.openingChatMsg,
          time: moment().toString(), // 将 moment 对象转换为字符串以匹配 MessageInfo 类型
          id: uuidv4(),
          messageType: MessageTypeEnum.ASSISTANT,
        } as MessageInfo;
        setMessageList([currentMessage]);
      }
      setIsLoaded(true);
    },
  });

  useEffect(() => {
    runDetail(agentId);

    return () => {
      setIsLoaded(false);
      setMessageList([]);
      setChatSuggestList([]);
      setAgentDetail(null);
      setSelectedComponentList([]);
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
  const handleMessageSend = (message: string, files?: UploadFileInfo[]) => {
    if (!agentDetail) {
      return;
    }
    // 创建智能体会话
    handleCreateConversation(agentDetail.agentId, {
      message,
      files,
      infos: selectedComponentList,
      defaultAgentDetail: agentDetail,
    });
  };

  return (
    <div
      className={cx('flex', 'h-full')}
      style={{
        overflowY: 'scroll',
      }}
    >
      <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
        <div className={cx(styles['title-box'])}>
          <h3
            className={cx(styles.title, 'text-ellipsis', 'clip-path-animation')}
          >
            {isLoaded &&
              (agentDetail?.name
                ? `和${agentDetail?.name}开始会话`
                : '开始会话')}
          </h3>
        </div>
        <div className={cx(styles['chat-wrapper'], 'flex-1')}>
          {loading ? (
            <div
              className={cx('flex', 'items-center', 'content-center', 'h-full')}
            >
              <LoadingOutlined className={cx(styles.loading)} />
            </div>
          ) : messageList?.length > 0 ? (
            <>
              {messageList?.map((item: MessageInfo, index: number) => (
                <ChatView
                  key={index}
                  messageInfo={item}
                  roleInfo={roleInfo}
                  contentClassName={styles['chat-inner']}
                  mode={'none'}
                />
              ))}
              {/*会话建议*/}
              <RecommendList
                itemClassName={styles['suggest-item']}
                loading={loading}
                chatSuggestList={chatSuggestList}
                onClick={handleMessageSend}
              />
            </>
          ) : (
            isLoaded && (
              // Chat记录为空
              <AgentChatEmpty
                icon={agentDetail?.icon}
                name={agentDetail?.name || ''}
                // 会话建议
                extra={
                  <RecommendList
                    className="mt-16"
                    itemClassName={cx(styles['suggest-item'])}
                    loading={loading}
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
          className={cx(styles['chat-input-container'])}
          onEnter={handleMessageSend}
          isClearInput={false}
          manualComponents={agentDetail?.manualComponents || []}
          selectedComponentList={selectedComponentList}
          onSelectComponent={handleSelectComponent}
        />
      </div>
      <AgentSidebar
        agentId={agentId}
        agentDetail={agentDetail}
        onToggleCollectSuccess={handleToggleCollectSuccess}
      />
    </div>
  );
};

export default AgentDetails;
