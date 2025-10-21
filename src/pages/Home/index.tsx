import ChatInputHome from '@/components/ChatInputHome';
import Loading from '@/components/custom/Loading';
// import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
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
import type { UploadFileInfo } from '@/types/interfaces/common';
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
      runDetail(tenantConfigInfo?.defaultAgentId);
    }
  }, [tenantConfigInfo]);

  useEffect(() => {
    // 初始化选中的组件列表
    initSelectedComponentList(agentDetail?.manualComponents);
  }, [agentDetail?.manualComponents]);

  // 跳转页面
  const handleEnter = async (_message: string, files?: UploadFileInfo[]) => {
    if (!tenantConfigInfo) {
      message.warning('租户信息不存在');
      return;
    }

    await handleCreateConversation(tenantConfigInfo.defaultAgentId, {
      message: _message,
      files,
      infos: selectedComponentList,
    });
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
  const handleClick = async (targetId: number) => {
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
          key={`home-${tenantConfigInfo?.defaultAgentId}`}
          className={cx(styles.textarea)}
          onEnter={handleEnter}
          isClearInput={false}
          manualComponents={agentDetail?.manualComponents || []}
          selectedComponentList={selectedComponentList}
          onSelectComponent={handleSelectComponent}
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
