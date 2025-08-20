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
import { AgentDetailDto } from '@/types/interfaces/agent';
import type {
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { App } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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

  // 布局相关状态
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputSectionHeight, setInputSectionHeight] = useState<number>(432); // 输入框部分动态高度

  // 常量
  const MIN_INPUT_HEIGHT = 432; // 输入框部分最小高度
  const RECOMMEND_HEIGHT = 360; // 推荐部分固定高度

  // 动态计算输入框区域高度（基于第一屏视口高度）
  const calculateInputSectionHeight = useCallback(() => {
    // 使用视口高度作为计算基准，而不是容器高度
    const viewportHeight = window.innerHeight;

    // 计算输入框区域高度：视口高度 - 推荐区域固定高度(360px)
    const calculatedHeight = viewportHeight - RECOMMEND_HEIGHT;

    // 确保输入框区域高度不小于最小值(432px)
    const finalHeight = Math.max(calculatedHeight, MIN_INPUT_HEIGHT);

    setInputSectionHeight(finalHeight);
  }, []);

  // 监听窗口大小变化
  useLayoutEffect(() => {
    const handleResize = () => {
      calculateInputSectionHeight();
    };

    // 初始计算
    calculateInputSectionHeight();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateInputSectionHeight]);

  // 组件挂载后初始化计算
  useEffect(() => {
    calculateInputSectionHeight();
  }, [calculateInputSectionHeight]);

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

  return (
    <div
      ref={containerRef}
      className={cx(
        styles.container,
        'flex',
        'flex-col',
        'items-center',
        'overflow-y-auto',
      )}
      style={{
        minHeight: `${MIN_INPUT_HEIGHT + RECOMMEND_HEIGHT}px`,
      }}
    >
      {/* 输入框区域 */}
      <div
        className={cx(styles.inputSection)}
        style={{
          height: `${inputSectionHeight}px`,
          minHeight: `${MIN_INPUT_HEIGHT}px`,
        }}
      >
        <h2 className={cx(styles.title)}>嗨，有什么我可以帮忙的吗？</h2>
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
          {tenantConfigInfo?.homeRecommendQuestions?.map(
            (item: string, index: number) => {
              return (
                <div
                  key={index}
                  className={cx(
                    styles['recommend-item'],
                    'cursor-pointer',
                    'hover-box',
                  )}
                  onClick={() => handleEnter(item)}
                >
                  {item}
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
