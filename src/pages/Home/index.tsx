import ChatInputHome from '@/components/ChatInputHome';
import Loading from '@/components/Loading';
import useConversation from '@/hooks/useConversation';
import AgentItem from '@/pages/Home/AgentItem';
import {
  apiCollectAgent,
  apiHomeCategoryList,
  apiPublishedAgentInfo,
  apiUnCollectAgent,
} from '@/services/agentDev';
import { DefaultSelectedEnum } from '@/types/enums/agent';
import {
  AgentDetailDto,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type {
  CategoryInfo,
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Home: React.FC = () => {
  // 配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const [activeTab, setActiveTab] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [homeCategoryInfo, setHomeCategoryInfo] =
    useState<HomeAgentCategoryInfo>();
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const currentAgentTypeRef = useRef<string>('');
  const [agentDetail, setAgentDetail] = useState<AgentDetailDto>();
  const [selectedComponentList, setSelectedComponentList] = useState<
    AgentSelectedComponentInfo[]
  >([]);
  // 创建智能体会话
  const { handleCreateConversation } = useConversation();

  // 主页智能体分类列表
  const { run: runCategoryList } = useRequest(apiHomeCategoryList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: HomeAgentCategoryInfo) => {
      setHomeCategoryInfo(result);
      setActiveTab(result?.categories?.[0].type);
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

  // 跳转页面
  const handleEnter = async (
    _message: string,
    files?: UploadFileInfo[],
    // infos?: AgentSelectedComponentInfo[],
  ) => {
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

  // Handle tab click - scroll to section
  const handleTabClick = (type: string) => {
    setActiveTab(type);
    const section = sectionRefs.current[type];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
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

  // 检查对象是否为空
  const isEmptyObject = (obj: { [key: string]: CategoryItemInfo[] }) => {
    if (!obj) return true;
    return Object.keys(obj).length === 0;
  };

  const handleLink = () => {
    history.push('/square?cate_type=Agent');
  };

  // 点击单个智能体
  const handleClick = async (targetId: number) => {
    history.push(`/agent/${targetId}`);
  };

  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'flex-col',
        'items-center',
        'overflow-y',
      )}
    >
      <h2 className={cx(styles.title)}>嗨，有什么我可以帮忙的吗？</h2>
      <ChatInputHome
        className={cx(styles.textarea)}
        onEnter={handleEnter}
        isClearInput={false}
        manualComponents={agentDetail?.manualComponents || []}
        selectedComponentList={selectedComponentList}
        onSelectComponent={handleSelectComponent}
      />
      <div
        className={cx(styles.recommend, 'flex', 'content-center', 'flex-wrap')}
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
      <div className={cx(styles.wrapper, 'flex-1')}>
        {loading ? (
          <Loading className={cx('h-full')} />
        ) : (
          <>
            <div ref={tabsRef} className={cx('flex', 'w-full', styles.tabs)}>
              {homeCategoryInfo?.categories?.map((item) => {
                return (
                  <span
                    key={item.type}
                    onClick={() => handleTabClick(item.type)}
                    className={cx(styles.item, {
                      [styles.active]: item.type === activeTab,
                    })}
                  >
                    {item.name}
                  </span>
                );
              })}
            </div>
            {isEmptyObject(homeCategoryInfo?.categoryItems || {}) ? (
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  styles['empty-box'],
                )}
              >
                <a onClick={handleLink} className={cx('cursor-pointer')}>
                  暂无数据，立即探索 {'>'} {'>'}
                </a>
              </div>
            ) : (
              homeCategoryInfo?.categories?.map((item: CategoryInfo) => {
                return (
                  <section
                    key={item.type}
                    ref={(el) => (sectionRefs.current[item.type] = el)}
                    id={item.type}
                  >
                    <h2 className={styles['category-name']}>{item.name}</h2>
                    <div className={cx(styles['category-list'])}>
                      {homeCategoryInfo?.categoryItems[item.type]?.map(
                        (info: CategoryItemInfo) => (
                          <AgentItem
                            key={info.targetId}
                            info={info}
                            onClick={() => handleClick(info.targetId)}
                            onCollect={() =>
                              handleToggleCollect(item.type, info)
                            }
                          />
                        ),
                      )}
                    </div>
                  </section>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
