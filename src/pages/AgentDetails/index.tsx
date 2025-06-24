import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar from '@/components/AgentSidebar';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
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
import { AgentDetailDto, BindConfigWithSub } from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { arraysContainSameItems } from '@/utils/common';
import { LoadingOutlined } from '@ant-design/icons';
import { Form, message } from 'antd';
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
  const [form] = Form.useForm();

  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
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

  // 会话输入框已选择组件
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();
  // 创建智能体会话
  const { handleCreateConversation } = useConversation();
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
  const { run: runDetail, loading } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      setAgentDetail(result);
      // 会话问题建议
      setChatSuggestList(result?.openingGuidQuestions || []);
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
    // 创建智能体会话
    handleCreateConversation(agentDetail.agentId, {
      message: messageInfo,
      files,
      infos: selectedComponentList,
      defaultAgentDetail: agentDetail,
      variableParams,
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
          ) : (
            <>
              {/* 新对话设置 */}
              <NewConversationSet
                className="mb-16"
                form={form}
                variables={variables}
              />
              {messageList?.length > 0 ? (
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
                    className={cx({ 'h-full': !variables?.length })}
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
            </>
          )}
        </div>
        {/*会话输入框*/}
        <ChatInputHome
          className={cx(styles['chat-input-container'])}
          onEnter={handleMessageSend}
          isClearInput={false}
          wholeDisabled={wholeDisabled}
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
