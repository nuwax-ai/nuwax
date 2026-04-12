import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar, { AgentSidebarRef } from '@/components/AgentSidebar';
import SvgIcon from '@/components/base/SvgIcon';
import {
  CopyToSpaceComponent,
  PagePreviewIframe,
} from '@/components/business-component';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import FileTreeView from '@/components/FileTreeView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import ResizableSplit from '@/components/ResizableSplit';
import useAgentDetails from '@/hooks/useAgentDetails';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { t } from '@/services/i18nRuntime';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  AssistantRoleEnum,
  DefaultSelectedEnum,
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
import {
  arraysContainSameItems,
  getUrlQueryParamValue,
  parsePageAppProjectId,
} from '@/utils/common';
import { jumpToPageDevelop } from '@/utils/router';
import { LoadingOutlined } from '@ant-design/icons';
import { Form, message, Typography } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useModel, useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

// 地址栏查询参数类型
type UrlQueryParamsType = Record<string, string | number | boolean>;

/**
 * 主页咨询聊天组件Props
 */
interface ConversationDetailsProps {
  // 智能体ID
  agentId: number;
  // 会话发起后跳转的页面URL，如果传入了该参数，则会在会话结束后跳转到该页面
  conversationUrl?: string;
  // 技能信息
  skillInfo?: {
    // 技能目标ID（技能ID）
    targetId: number;
    // 技能名称
    name: string;
  } | null;
}

/**
 * 主页咨询聊天组件
 * 该组件用于展示智能体主页咨询聊天页面和应用智能体聊天页面
 */
const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  agentId,
  conversationUrl,
  skillInfo,
}) => {
  const location = useLocation();
  const [form] = Form.useForm();
  const { isMobile } = useModel('layout');
  const { runHistoryItem } = useModel('conversationHistory');
  // 开放应用智能体会话聊天页面相关状态
  const {
    handleSetAppAgentDetail,
    isAppSidebarMode,
    isAppSidebarVisible,
    toggleAppSidebarVisible,
  } = useModel('useOpenApp');
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
  // 选中的模型 ID
  const [selectedModelId, setSelectedModelId] = useState<number>();

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const sidebarRef = useRef<AgentSidebarRef>(null);

  // 页面复制弹窗状态
  const [openPageCopyModal, setOpenPageCopyModal] = useState<boolean>(false);

  const {
    isFileTreeVisible,
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

  // 打开页面预览
  const handleOpenPreview = (agentDetail: AgentDetailDto) => {
    // 判断是否默认展示页面首页
    if (
      agentDetail &&
      agentDetail?.expandPageArea &&
      agentDetail?.pageHomeIndex
    ) {
      // 自动触发预览
      showPagePreview({
        name: t('PC.Components.ConversationDetails.pagePreviewName'),
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
      // 设置应用智能体详情
      handleSetAppAgentDetail(result);
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

  /** （url中用户自带的参数）当前 URL `?` 后的查询参数；`&&` 等产生的空 key 会忽略；排除 `hideMenu`；值会做 boolean/number 收窄 */
  const urlQueryParams = useMemo((): UrlQueryParamsType => {
    const params = new URLSearchParams(location.search);
    const out: UrlQueryParamsType = {};
    params.forEach((rawValue, key) => {
      if (!key || key === 'hideMenu') return;
      out[key] = getUrlQueryParamValue(rawValue);
    });
    return out;
  }, [location.search]);

  // 消息发送
  const handleMessageSend = (
    messageInfo: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
  ) => {
    // 智能体信息为空
    if (!agentDetail) {
      return;
    }
    // 变量参数为空，不发送消息
    if (wholeDisabled) {
      form.validateFields(); // 触发表单验证以显示error
      message.warning(
        t('PC.Components.ConversationDetails.requiredParamsWarning'),
      );
      return;
    }

    let url = '';

    // 会话发起后跳转的页面URL
    if (conversationUrl) {
      url = conversationUrl
        .replace(':id', conversationId?.toString() || '')
        .replace(':agentId', agentId.toString());
    } else {
      url = `/home/chat/${conversationId}/${agentId}`;

      // 如果是任务智能体，则隐藏菜单
      if (agentDetail?.type === AgentTypeEnum.TaskAgent) {
        url += '?hideMenu=true';
      }
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
      modelId: modelId || selectedModelId,
      // 用户自带的url参数，如果存在，需要在聊天页中将这些参数与variableParams合并，传给会话chat
      urlQueryParams,
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
      <div
        className={cx('flex-1', 'flex', 'flex-col', styles['main-content'], {
          [styles['mobile-box']]: isMobile,
        })}
      >
        {/* 页面顶部: 标题区域 */}
        <header className={cx(styles['title-box'])}>
          <div
            className={cx(styles['title-container'], {
              [styles['title-container-collapsed']]: isAppSidebarMode,
            })}
          >
            <div className={cx('flex', 'items-center', 'gap-4')}>
              {/* 应用智能体模式下，显示内容导航按钮 */}
              <ConditionRender
                condition={isAppSidebarMode && !isAppSidebarVisible}
              >
                <TooltipIcon
                  title={t(
                    'PC.Components.ConversationDetails.expandNavigation',
                  )}
                  className={cx(styles['icon-box'])}
                  icon={
                    <SvgIcon
                      name="icons-nav-sidebar"
                      style={{ fontSize: 16 }}
                      onClick={toggleAppSidebarVisible}
                    />
                  }
                />
              </ConditionRender>
              {/* 左侧标题 */}
              <Typography.Title
                level={5}
                className={cx(styles.title)}
                ellipsis={{ rows: 1, expandable: false, symbol: '...' }}
              >
                {cachedAgentName
                  ? t(
                      'PC.Components.ConversationDetails.startConversationWithAgent',
                      cachedAgentName,
                    )
                  : ''}
              </Typography.Title>
            </div>

            {/* 右侧按钮区域 */}
            <div className={cx('flex', 'items-center', 'gap-4')}>
              {/* 这里放可以展开 AgentSidebar 的控制按钮 在AgentSidebar 展示的时候隐藏 反之显示 */}
              {!isAppSidebarMode && !isSidebarVisible && !isMobile && (
                <TooltipIcon
                  title={t(
                    'PC.Components.ConversationDetails.viewAgentDetails',
                  )}
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
                    title={t(
                      'PC.Components.ConversationDetails.openPreviewPage',
                    )}
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
            </div>
          </div>
        </header>

        {/* 页面主体: 内容区域 */}
        <div
          className={cx(styles['main-content-box'], {
            [styles['mobile-content-box']]: isMobile,
          })}
        >
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
              maskText={t(
                'PC.Components.ConversationDetails.noAgentPermission',
              )}
              fixedSelection={!!agentDetail?.sandboxId}
              isPersonalComputer={!!agentDetail?.sandboxId}
              mentionPlacement="up"
              readonly={
                agentDetail?.allowPrivateSandbox === DefaultSelectedEnum.No
              }
              /** 是否启用 @ 提及功能，默认启用 */
              enableMention={
                agentDetail?.type === AgentTypeEnum.TaskAgent &&
                agentDetail?.allowAtSkill === DefaultSelectedEnum.Yes
              }
              allowOtherModel={agentDetail?.allowOtherModel}
              selectedModelId={selectedModelId}
              onModelSelect={setSelectedModelId}
              agentType={agentDetail?.type}
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
                  restartVncPod(agentDetail?.conversationId, selectedComputerId)
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
                    copyButtonText={t(
                      'PC.Components.PagePreviewIframe.copyTemplate',
                    )}
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

      {/* 非应用智能体模式下，显示智能体详情侧边栏 */}
      <ConditionRender condition={!isAppSidebarMode}>
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
      </ConditionRender>
    </div>
  );
};

export default ConversationDetails;
