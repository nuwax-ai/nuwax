import ChatInput from '@/components/ChatInput';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Home: React.FC = () => {
  // 配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 创建会话
  const { runAsync: runConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceWait: 300,
    },
  );

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

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <h2 className={cx(styles.title)}>嗨，我能帮什么忙吗？</h2>
      <p className={cx(styles.tips)}>请输入您的问题，我会尽力为您解答。</p>
      <ChatInput className={cx(styles.textarea)} onEnter={handleEnter} />
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
    </div>
  );
};

export default Home;
