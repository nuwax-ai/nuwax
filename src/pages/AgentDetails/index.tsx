import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar, { AgentSidebarRef } from '@/components/AgentSidebar';
import SvgIcon from '@/components/base/SvgIcon';
import {
  CopyToSpaceComponent,
  PagePreviewIframe,
} from '@/components/business-component';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import TooltipIcon from '@/components/custom/TooltipIcon';
import FileTreeView from '@/components/FileTreeView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import ResizableSplit from '@/components/ResizableSplit';
import useAgentDetails from '@/hooks/useAgentDetails';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  AssistantRoleEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import { AgentDetailDto, GuidQuestionDto } from '@/types/interfaces/agent';
import type {
  BindConfigWithSub,
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { arraysContainSameItems, parsePageAppProjectId } from '@/utils/common';
import { jumpToPageDevelop } from '@/utils/router';
import { LoadingOutlined } from '@ant-design/icons';
import { Form, message, Typography } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams, useRequest } from 'umi';
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
  const location = useLocation();
  const [form] = Form.useForm();
  const { isMobile } = useModel('layout');
  const { runHistoryItem } = useModel('conversationHistory');
  // 获取 chat model 中的页面预览状态
  const { pagePreviewData, hidePagePreview, showPagePreview } =
    useModel('chat');
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
  // 选中的电脑ID（用于任务智能体模式）
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const sidebarRef = useRef<AgentSidebarRef>(null);

  // 页面复制弹窗状态
  const [openPageCopyModal, setOpenPageCopyModal] = useState<boolean>(false);

  // 技能信息
  const [skillInfo, setSkillInfo] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const {
    isFileTreeVisible,
    // openDesktopView,
    closePreviewView,
    restartVncPod,
    restartAgent,
    clearFilePanelInfo,
  } = useModel('conversationInfo');

  // 会话输入框已选择组件
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();
  const { agentDetail, setAgentDetail, handleToggleCollectSuccess } =
    useAgentDetails();

  // 缓存智能体名称，避免清空等操作导致 agentDetail 刷新时的文字闪烁
  const [cachedAgentName, setCachedAgentName] = useState<string>('');

  useEffect(() => {
    if (agentDetail?.name) {
      setCachedAgentName(agentDetail.name);
    }
  }, [agentDetail?.name]);

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

  // 从location.search中获取技能信息
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const skillId = searchParams.get('skillId');
    const skillName = searchParams.get('skillName');

    if (skillId && skillName) {
      setSkillInfo({
        id: Number(skillId),
        name: decodeURIComponent(skillName || ''),
      });
    }
  }, [location.search]);

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

  // 已发布的智能体详情接口
  const { run: runDetail } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    loadingDelay: 300, // 300ms内不显示loading
    onSuccess: (result: AgentDetailDto) => {
      setLoading(false);
      setAgentDetail(result);
      handleOpenPreview(result);
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
      // 关闭页面预览
      hidePagePreview();

      setIsLoaded(false);
      setMessageList([]);
      setChatSuggestList([]);
      setAgentDetail(null);
      setSelectedComponentList([]);
      setVariables([]);
      // 清除文件面板信息
      clearFilePanelInfo();
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
  const handleMessageSend = (
    messageInfo: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
  ) => {
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

    let url = `/home/chat/${conversationId}/${agentId}`;
    // 如果是任务智能体，则隐藏菜单
    if (agentDetail?.type === AgentTypeEnum.TaskAgent) {
      url += '?hideMenu=true';
    }

    // 传递的参数
    const attach = {
      message: messageInfo,
      files,
      infos: selectedComponentList,
      defaultAgentDetail: agentDetail,
      variableParams,
      messageSourceType: 'agent' as MessageSourceType,
      selectedComputerId,
      skillIds,
    };
    history.push(url, attach);
  };

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

  // 判断是否显示复制按钮（智能体允许复制即可显示，支持复制智能体、工作流或页面模板）
  const showCopyButton = useMemo(() => {
    const shouldShow = agentDetail?.allowCopy === AllowCopyEnum.Yes;
    return shouldShow;
  }, [
    workflowId,
    agentDetail?.allowCopy,
    agentDetail?.agentId,
    pagePreviewData,
  ]);

  // 显示文件树
  // const handleFileTreeVisible = () => {
  //   // 关闭 AgentSidebar，确保文件树显示时，AgentSidebar 不会显示
  //   sidebarRef.current?.close();
  //   // 触发文件列表刷新事件
  //   openDesktopView(agentDetail?.conversationId);
  // };

  // 默认提及项
  const defaultMentions = useMemo(() => {
    // 通用型智能体才有技能，所以技能信息存在时才显示提及项，其他类型智能体不显示提及项
    return agentDetail?.type === AgentTypeEnum.TaskAgent && skillInfo
      ? [skillInfo]
      : [];
  }, [agentDetail?.type, skillInfo]);

  // 左侧内容
  const LeftContent = () => {
    return (
      <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
        {/* 页面顶部: 标题区域 */}
        <header className={cx(styles['title-box'])}>
          <div className={cx(styles['title-container'])}>
            {/* 左侧标题 */}
            <Typography.Title
              level={5}
              className={cx(styles.title)}
              ellipsis={{ rows: 1, expandable: false, symbol: '...' }}
            >
              {cachedAgentName ? `和${cachedAgentName}开始会话` : ''}
            </Typography.Title>
            <div className={cx('flex', 'items-center', 'gap-4')}>
              {/* 这里放可以展开 AgentSidebar 的控制按钮 在AgentSidebar 展示的时候隐藏 反之显示 */}
              {!isSidebarVisible && !isMobile && (
                <TooltipIcon
                  title="查看智能体详情"
                  className={cx(styles['icon-box'])}
                  icon={
                    <SvgIcon
                      name="icons-nav-sidebar"
                      style={{ fontSize: 16 }}
                    />
                  }
                  onClick={() => {
                    hidePagePreview();
                    // 确保打开智能体详情前关闭文件树视图，只展示一个右侧面板
                    closePreviewView();
                    sidebarRef.current?.open();
                  }}
                />
              )}

              {/*打开预览页面*/}
              {!!agentDetail?.expandPageArea &&
                !!agentDetail?.pageHomeIndex &&
                !pagePreviewData && (
                  <TooltipIcon
                    title="打开预览页面"
                    className={cx(styles['icon-box'])}
                    icon={
                      <SvgIcon
                        name="icons-nav-ecosystem"
                        style={{ fontSize: 16 }}
                      />
                    }
                    onClick={() => {
                      sidebarRef.current?.close();
                      handleOpenPreview(agentDetail);
                    }}
                  />
                )}

              {/*文件树切换按钮 - 只在 AgentSidebar 隐藏时显示 */}
              {/* {agentDetail?.type === AgentTypeEnum.TaskAgent &&
                agentDetail?.conversationId &&
                agentDetail?.hideDesktop === HideDesktopEnum.No &&
                !isFileTreeVisible && (
                  <TooltipIcon
                    title="打开智能体电脑"
                    className={cx(styles['icon-box'])}
                    icon={
                      <SvgIcon
                        name="icons-nav-computer-star"
                        style={{ fontSize: 16 }}
                      />
                    }
                    onClick={handleFileTreeVisible}
                  />
                )} */}
            </div>
          </div>
        </header>

        {/* 页面主体: 内容区域 */}
        <div className={cx(styles['main-content-box'])}>
          {/* 聊天内容区域 */}
          <div
            className={cx(styles['chat-section'], {
              [styles['file-tree-visible']]: isFileTreeVisible,
            })}
          >
            <div className={cx(styles['chat-wrapper-content'])}>
              <div className={cx(styles['chat-wrapper'], 'flex-1')}>
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
                      chatSuggestList={chatSuggestList}
                      onClick={handleMessageSend}
                    />
                  </>
                ) : isLoaded ? (
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
                ) : null}
              </div>
            </div>
            <ChatInputHome
              key={`agent-details-${agentId}`}
              className={cx(styles['chat-input-container'])}
              onEnter={handleMessageSend}
              isClearInput={false}
              wholeDisabled={wholeDisabled}
              manualComponents={agentDetail?.manualComponents || []}
              selectedComponentList={selectedComponentList}
              onSelectComponent={handleSelectComponent}
              showAnnouncement={true}
              isTaskAgentActive={agentDetail?.type === AgentTypeEnum.TaskAgent}
              selectedComputerId={selectedComputerId}
              onComputerSelect={setSelectedComputerId}
              agentId={agentId}
              agentSandboxId={agentDetail?.sandboxId}
              hasPermission={agentDetail?.hasPermission}
              maskText="您无该智能体权限"
              fixedSelection={!!agentDetail?.sandboxId}
              isPersonalComputer={!!agentDetail?.sandboxId}
              mentionPlacement="up"
              /** 是否启用 @ 提及功能，默认启用 */
              enableMention={agentDetail?.type === AgentTypeEnum.TaskAgent}
              // 通用性智能体才有技能，所以技能信息存在时才显示提及项，其他类型智能体不显示提及项
              defaultMentions={defaultMentions}
            />
          </div>

          {/* 通用型(TaskAgent)智能体 - 智能体电脑 */}
          {isFileTreeVisible && (
            <div
              className={cx(
                styles['file-tree-sidebar'],
                'flex',
                'w-full',
                'overflow-hide',
              )}
            >
              <FileTreeView
                className={cx(styles['file-tree-container'])}
                targetId={agentDetail?.conversationId?.toString() || ''}
                viewMode={'desktop'}
                // 重启容器
                onRestartServer={() =>
                  restartVncPod(agentDetail?.conversationId)
                }
                // 重启智能体
                onRestartAgent={() => restartAgent(agentDetail?.conversationId)}
                // 关闭整个面板
                onClose={closePreviewView}
                isCanDeleteSkillFile={true}
                // VNC 空闲检测配置（仅通用型智能体启用）
                idleDetection={{
                  enabled: agentDetail?.type === AgentTypeEnum.TaskAgent,
                  onIdleTimeout: closePreviewView,
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return loading ? (
    <div
      className={cx(
        'flex',
        'items-center',
        'content-center',
        'flex-1',
        'h-full',
        'w-full',
      )}
    >
      <LoadingOutlined />
    </div>
  ) : (
    <div className={cx('flex', 'h-full')}>
      {/*智能体聊天和预览页面*/}
      <ResizableSplit
        minLeftWidth={400}
        defaultLeftWidth={
          agentDetail?.type === AgentTypeEnum.TaskAgent ? 33 : 50
        }
        left={agentDetail?.hideChatArea ? null : LeftContent()}
        right={
          agentDetail?.type !== AgentTypeEnum.TaskAgent
            ? pagePreviewData && (
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
                    onCopyClick={() => setOpenPageCopyModal(true)}
                    copyButtonText="复制模板"
                    copyButtonClassName={styles['copy-btn']}
                  />
                  {/* 复制模板弹窗 */}
                  {showCopyButton && agentDetail && pagePreviewData?.uri && (
                    <CopyToSpaceComponent
                      spaceId={agentDetail.spaceId}
                      mode={AgentComponentTypeEnum.Page}
                      componentId={parsePageAppProjectId(pagePreviewData.uri)}
                      title={''}
                      open={openPageCopyModal}
                      isTemplate={true}
                      onSuccess={(_: any, targetSpaceId: number) => {
                        setOpenPageCopyModal(false);
                        // 跳转
                        jumpToPageDevelop(targetSpaceId);
                      }}
                      onCancel={() => setOpenPageCopyModal(false)}
                    />
                  )}
                </>
              )
            : null
        }
      />
      {/*智能体详情*/}
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
