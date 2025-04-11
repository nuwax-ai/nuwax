import ChatInputHome from '@/components/ChatInputHome';
import AgentItem from '@/pages/Home/AgentItem';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import {
  apiCollectAgent,
  apiHomeCategoryList,
  apiUnCollectAgent,
} from '@/services/agentDev';
import type {
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { RequestResponse } from '@/types/interfaces/request';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Home: React.FC = () => {
  // 配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const [activeTab, setActiveTab] = useState<string>();
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const tabsRef = useRef<HTMLDivElement | null>(null);

  const currentAgentTypeRef = useRef<string>('');

  const [homeCategoryInfo, setHomeCategoryInfo] =
    useState<HomeAgentCategoryInfo>();

  // 创建会话
  const { runAsync: runConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  // 主页智能体分类列表
  const { run: runCategoryList } = useRequest(apiHomeCategoryList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<HomeAgentCategoryInfo>) => {
      const { data } = result;
      setHomeCategoryInfo(data);
      setActiveTab(data?.categories?.[0].type);
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

  useEffect(() => {
    runCategoryList();
  }, []);

  // 跳转页面
  const handleEnter = async (_message: string, files?: UploadFileInfo[]) => {
    if (!tenantConfigInfo) {
      message.warning('租户信息不存在');
      return;
    }

    const info = await runConversationCreate({
      agentId: tenantConfigInfo.defaultAgentId,
      devMode: false,
    });

    if (info.success) {
      const id = info.data?.id;
      history.push(`/home/chat/${id}`, { message: _message, files });
    }
  };

  // 开始智能体会话
  const handleConversation = async (targetId: number) => {
    const info = await runConversationCreate({
      agentId: targetId,
      devMode: false,
    });

    if (info.success) {
      const id = info.data?.id;
      history.push(`/home/chat/${id}`);
    }
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
  const handleToggleCollect = (type, info: CategoryItemInfo) => {
    currentAgentTypeRef.current = type;
    if (info.collect) {
      runUnCollectAgent(info.targetId);
    } else {
      runCollectAgent(info.targetId);
    }
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <h2 className={cx(styles.title)}>嗨，有什么我可以帮忙的吗？</h2>
      <ChatInputHome className={cx(styles.textarea)} onEnter={handleEnter} />
      <div
        className={cx(styles.recommend, 'flex', 'content-center', 'flex-wrap')}
      >
        {tenantConfigInfo?.homeRecommendQuestions?.map((item, index) => {
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
        })}
      </div>
      <div className={cx(styles.wrapper, 'flex-1')}>
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
        {homeCategoryInfo?.categories?.map((item) => {
          return (
            <section
              key={item.type}
              ref={(el) => (sectionRefs.current[item.type] = el)}
              id={item.type}
            >
              <h2 className={styles['category-name']}>{item.name}</h2>
              <div className={cx(styles['category-list'])}>
                {homeCategoryInfo?.categoryItems[item.type]?.map((info) => (
                  <AgentItem
                    key={info.targetId}
                    info={info}
                    onClick={() => handleConversation(info.targetId)}
                    onCollect={() => handleToggleCollect(item.type, info)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
