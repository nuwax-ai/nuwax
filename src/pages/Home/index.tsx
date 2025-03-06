import ChatInput from '@/components/ChatInput';
import { RECOMMEND_TEXT } from '@/constants/home.constants';
import type { AttachmentFile } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React from 'react';
import { history, useLocation } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Home: React.FC = () => {
  const location = useLocation();
  const title = location.state?.title;
  console.log(title, 'title');

  // 跳转页面
  const handleEnter = (message: string, attachments?: AttachmentFile[]) => {
    console.log(message, attachments);
    history.push('/home/chat', { message, attachments });
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <h2 className={cx(styles.title)}>嗨，我能帮什么忙吗？</h2>
      <p className={cx(styles.tips)}>请输入您的问题，我会尽力为您解答。</p>
      <ChatInput className={cx(styles.textarea)} onEnter={handleEnter} />
      <div
        className={cx(styles.recommend, 'flex', 'content-center', 'flex-wrap')}
      >
        {RECOMMEND_TEXT.map((item, index) => {
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
