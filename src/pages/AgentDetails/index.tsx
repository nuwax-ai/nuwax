import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar from '@/components/AgentSidebar';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import useConversation from '@/hooks/useConversation';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  AssistantRoleEnum,
  DefaultSelectedEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import {
  AgentDetailDto,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
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
  const { agentId } = useParams();
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const [agentDetail, setAgentDetail] = useState<AgentDetailDto | null>();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [selectedComponentList, setSelectedComponentList] = useState<
    AgentSelectedComponentInfo[]
  >([]);

  // 创建智能体会话
  const { handleCreateConversation } = useConversation();

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
    if (agentDetail?.manualComponents?.length) {
      // 手动组件默认选中的组件
      const _manualComponents = agentDetail?.manualComponents
        .filter((item) => item.defaultSelected === DefaultSelectedEnum.Yes)
        .map((item) => ({
          id: item.id,
          type: item.type,
        }));
      setSelectedComponentList(_manualComponents || []);
    }
  }, [agentDetail?.manualComponents]);

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

  // 切换收藏与取消收藏
  const handleToggleCollectSuccess = (isCollect: boolean) => {
    const _agentDetail = cloneDeep(agentDetail);
    if (!_agentDetail) {
      return;
    }
    const count = _agentDetail?.statistics?.collectCount || 0;
    _agentDetail.statistics.collectCount = isCollect ? count + 1 : count - 1;
    _agentDetail.collect = isCollect;
    setAgentDetail(_agentDetail);
  };

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
    });
  };

  return (
    <div className={cx('flex', 'h-full', 'overflow-y')}>
      <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
        <div className={cx(styles['title-box'])}>
          <h3 className={cx(styles.title, 'text-ellipsis')}>
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
