import personal from '@/assets/images/personal.png';
import { ICON_SHARE } from '@/constants/images.constants';
import {
  CloseOutlined,
  PlayCircleOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const AgentSidebar: React.FC = () => {
  const statistics: Record<string, string> = {};

  return (
    <div className={cx(styles.container)}>
      <header className={cx(styles.header, 'flex', 'items-center')}>
        {/*用户人数*/}
        <span className={cx(styles.text, 'flex')}>
          <UserOutlined />
          <span>{statistics?.userCount || 0}</span>
        </span>
        {/*会话次数*/}
        <span className={cx(styles.text, 'flex')}>
          <PlayCircleOutlined />
          <span>{statistics?.convCount || 0}</span>
        </span>
        {/*收藏次数*/}
        <span className={cx(styles.text, 'flex')}>
          <StarFilled />
          <span>{statistics?.collectCount || 0}</span>
        </span>
        <CloseOutlined className={cx('cursor-pointer', styles.close)} />
      </header>
      <div
        className={cx(
          styles['sidebar-content'],
          'flex',
          'flex-col',
          'items-center',
        )}
      >
        <img className={styles.avatar} src={personal} alt="" />
        <span className={styles.title}>智能体</span>
        <p className={cx(styles.content)}>
          👋 你好，我是 emoji 机器人，💬🤖🔤✨ 我会把你发过来的语句用 emoji
          翻译给你。也可以翻译你发过来的 emoji，以及玩 emoji 猜题游戏哦。
        </p>
        <div>来自于疯狂的石头</div>
        <span>
          <StarFilled />
          <ICON_SHARE />
        </span>
      </div>
    </div>
  );
};

export default AgentSidebar;
