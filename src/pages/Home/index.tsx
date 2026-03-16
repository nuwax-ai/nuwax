import ChatInputHome from '@/components/ChatInputHome';
import Loading from '@/components/custom/Loading';
import useConversation from '@/hooks/useConversation';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import {
  apiCollectAgent,
  apiHomeCategoryList,
  apiPublishedAgentInfo,
  apiUnCollectAgent,
} from '@/services/agentDev';
import { AgentDetailDto, GuidQuestionDto } from '@/types/interfaces/agent';
import type {
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import { AffixRef, App, message as antdMessage } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useRequest } from 'umi';
import DraggableHomeContent from './DraggableHomeContent';
import styles from './index.less';

const cx = classNames.bind(styles);

const Home: React.FC = () => {
  const { message } = App.useApp();
  // 配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const [activeTab, setActiveTab] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [homeCategoryInfo, setHomeCategoryInfo] =
    useState<HomeAgentCategoryInfo>();
  const currentAgentTypeRef = useRef<string>('');
  const [agentDetail, setAgentDetail] = useState<AgentDetailDto>();
  // 通用型智能体模式状态
  const [isTaskAgentMode, setIsTaskAgentMode] = useState<boolean>(false);
  // 选中的电脑 ID，'remote' 表示远程电脑（默认）
  const [selectedComputerId, setSelectedComputerId] =
    useState<string>('remote');
  // 创建智能体会话
  const { handleCreateConversation } = useConversation();
  // 会话输入框已选择组件
  const {
    selectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  // 常量
  // const MIN_INPUT_HEIGHT = 432; // 输入框部分最小高度
  // const RECOMMEND_HEIGHT = 360; // 推荐部分固定高度

  // 主页智能体分类列表
  const { run: runCategoryList } = useRequest(apiHomeCategoryList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: HomeAgentCategoryInfo) => {
      setHomeCategoryInfo(result);
      setActiveTab(result?.categories?.[0]?.type);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 智能体收藏
  const { run: runCollectAgent } = useRequest(apiCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      runCategoryList();
    },
  });

  // 智能体取消收藏
  const { run: runUnCollectAgent } = useRequest(apiUnCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      runCategoryList();
    },
  });

  // 已发布的智能体详情接口
  const { run: runDetail } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      setAgentDetail(result);
    },
  });

  useEffect(() => {
    setLoading(true);
    // 主页智能体分类列表
    runCategoryList();
  }, []);

  useEffect(() => {
    if (tenantConfigInfo) {
      // 根据当前模式选择使用哪个智能体ID
      const agentId =
        isTaskAgentMode && tenantConfigInfo.defaultTaskAgentId
          ? tenantConfigInfo.defaultTaskAgentId
          : tenantConfigInfo.defaultAgentId;
      runDetail(agentId);
    }
  }, [tenantConfigInfo, isTaskAgentMode]);

  useEffect(() => {
    // 初始化选中的组件列表
    initSelectedComponentList(agentDetail?.manualComponents);
  }, [agentDetail?.manualComponents]);

  /**
   * 跳转页面
   * @param _message 传递的消息内容
   * @param files 传递的附件文件列表
   * @param skillIds 传递的技能 ID 列表
   */
  const handleEnter = async (
    _message: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
  ) => {
    if (!tenantConfigInfo) {
      message.warning('租户信息不存在');
      return;
    }

    // 根据当前模式选择使用哪个智能体ID
    const agentId =
      isTaskAgentMode && tenantConfigInfo.defaultTaskAgentId
        ? tenantConfigInfo.defaultTaskAgentId
        : tenantConfigInfo.defaultAgentId;

    // 传递的参数
    const attach = {
      message: _message,
      files,
      infos: selectedComponentList,
      messageSourceType: 'home' as MessageSourceType,
      hideMenu: isTaskAgentMode,
      skillIds,
    };

    await handleCreateConversation(agentId, attach);
  };

  // 切换任务智能体模式
  const handleToggleTaskAgent = () => {
    setIsTaskAgentMode((prev) => !prev);
  };

  // 是否显示任务智能体切换按钮
  const showTaskAgentToggle = !!(
    tenantConfigInfo?.defaultTaskAgentId &&
    tenantConfigInfo.defaultTaskAgentId > 0
  );

  // 处理电脑选择
  const handleComputerSelect = (id: string) => {
    setSelectedComputerId(id);
  };

  // 处理标签点击 - 只更新activeTab状态
  const handleTabClick = (type: string) => {
    console.log(`🏠 Home Tab点击事件: ${type}, 当前activeTab: ${activeTab}`);
    setActiveTab(type);
  };

  // 切换收藏与取消收藏
  const handleToggleCollect = (type: string, info: CategoryItemInfo) => {
    currentAgentTypeRef.current = type;
    if (info.collect) {
      runUnCollectAgent(info.targetId);
    } else {
      runCollectAgent(info.targetId);
    }
  };

  // 点击单个智能体
  const handleClick = (agentInfo: CategoryItemInfo) => {
    const { agentType, targetId, lastConversationId } = agentInfo;

    // 如果最后一次会话ID存在，则跳转至最后一次会话
    if (!!lastConversationId) {
      const url =
        agentType === 'PageApp' || agentType === 'TaskAgent'
          ? `/home/chat/${lastConversationId}/${targetId}?hideMenu=true`
          : `/home/chat/${lastConversationId}/${targetId}`;
      history.push(url);
      return;
    }

    if (agentType === 'PageApp') {
      history.push(`/agent/${targetId}?hideMenu=true`);
      return;
    }

    history.push(`/agent/${targetId}`);
  };

  const affixRef = useRef<AffixRef>(null);

  useEffect(() => {
    const handler = () => {
      affixRef.current?.updatePosition();
    };
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, []);

  const handleClickItem = (item: GuidQuestionDto) => {
    // 外部页面
    if (item.type === 'Link') {
      // 打开外链
      if (!item.url) {
        antdMessage.error('链接地址配置错误');
        return;
      }
      window.open(item.url, '_blank');
      return;
    }

    handleEnter(item.info);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      {/* 输入框区域 */}
      <div className={cx(styles.inputSection)}>
        <h2
          className={cx(styles.title)}
          dangerouslySetInnerHTML={{ __html: tenantConfigInfo?.homeSlogan }}
        />
        {/*<div className={cx(styles.title)}>
          <PureMarkdownRenderer
            id={`${agentDetail?.agentId}`}
            className={cx(styles.content)}
          >
            {agentDetail?.openingChatMsg as string}
          </PureMarkdownRenderer>
        </div>*/}

        <ChatInputHome
          key={`home-${tenantConfigInfo?.defaultAgentId}-${isTaskAgentMode}`}
          className={cx(styles.textarea)}
          onEnter={handleEnter}
          isClearInput={false}
          manualComponents={agentDetail?.manualComponents || []}
          selectedComponentList={selectedComponentList}
          onSelectComponent={handleSelectComponent}
          showTaskAgentToggle={showTaskAgentToggle}
          isTaskAgentActive={isTaskAgentMode}
          onToggleTaskAgent={handleToggleTaskAgent}
          selectedComputerId={selectedComputerId}
          onComputerSelect={handleComputerSelect}
          agentId={agentDetail?.agentId}
          agentSandboxId={agentDetail?.sandboxId}
        />
        <div
          className={cx(
            styles.recommend,
            'flex',
            'content-center',
            'flex-wrap',
          )}
        >
          {agentDetail?.guidQuestionDtos?.map(
            (item: GuidQuestionDto, index: number) => {
              return (
                <div
                  key={index}
                  className={cx(
                    styles['recommend-item'],
                    'cursor-pointer',
                    'hover-box',
                  )}
                  onClick={() => handleClickItem(item)}
                >
                  {item?.icon && (
                    <img className={cx(styles.icon)} src={item?.icon} />
                  )}
                  {item.info}
                </div>
              );
            },
          )}
        </div>
      </div>
      {/* 推荐区域 */}
      <div className={cx(styles.recommendSection)}>
        <div className={cx(styles.wrapper)}>
          {loading ? (
            <Loading className={cx('h-full')} />
          ) : (
            homeCategoryInfo && (
              <DraggableHomeContent
                homeCategoryInfo={homeCategoryInfo}
                activeTab={activeTab}
                onTabClick={handleTabClick}
                onAgentClick={handleClick}
                onToggleCollect={handleToggleCollect}
                onDataUpdate={runCategoryList}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
