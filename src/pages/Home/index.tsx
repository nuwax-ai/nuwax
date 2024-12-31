import { RECOMMEND_TEXT } from '@/constants/home.constants';
import { useModel } from '@umijs/max';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Home: React.FC = () => {
  const { name } = useModel('global');
  console.log(name);
  // 跳转页面
  const handlerClick = (question: string) => {
    history.push('/home/chat', { question });
    console.log(question);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <h2 className={cx(styles.title)}>嗨，我能帮什么忙吗？</h2>
      <p className={cx(styles.tips)}>请输入您的问题，我会尽力为您解答。</p>
      <textarea
        className={cx(styles.textarea)}
        placeholder={'待替换, 直接输入指令；可通过cmd+回车换行'}
        name=""
        id=""
      ></textarea>
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
              onClick={() => handlerClick(item)}
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
