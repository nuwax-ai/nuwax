import ChatInput from '@/components/ChatInput';
import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Home: React.FC = () => {
  // 配置信息
  const [configInfo, setConfigInfo] = useState<TenantConfigInfo>();
  // 会话ID
  const conversationIdRef = useRef<number>(0);

  // 创建会话
  const { run: runConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result: ConversationInfo) => {
        conversationIdRef.current = result.id;
      },
    },
  );

  useEffect(() => {
    // 配置信息
    const info = JSON.parse(
      localStorage.getItem(TENANT_CONFIG_INFO),
    ) as TenantConfigInfo;
    setConfigInfo(info);

    runConversationCreate({
      agentId: info?.defaultAgentId,
      devMode: false,
    });
  }, []);

  // 跳转页面
  const handleEnter = (message: string, files?: UploadFileInfo[]) => {
    history.push(`/home/chat/${conversationIdRef.current}`, { message, files });
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <h2 className={cx(styles.title)}>嗨，我能帮什么忙吗？</h2>
      <p className={cx(styles.tips)}>请输入您的问题，我会尽力为您解答。</p>
      <ChatInput className={cx(styles.textarea)} onEnter={handleEnter} />
      <div
        className={cx(styles.recommend, 'flex', 'content-center', 'flex-wrap')}
      >
        {configInfo?.homeRecommendQuestions?.map((item, index) => {
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
    </div>
  );
};

export default Home;
