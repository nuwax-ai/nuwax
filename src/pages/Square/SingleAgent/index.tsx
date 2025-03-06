import ConditionRender from '@/components/ConditionRender';
import type { SingleAgentProps } from '@/types/interfaces/square';
import {
  PlayCircleOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个智能体组件
 */
const SingleAgent: React.FC<SingleAgentProps> = ({ publishedAgentInfo }) => {
  const handleClick = () => {
    history.push('/', { title: publishedAgentInfo?.name });
  };

  return (
    <div
      className={cx(styles.container, 'cursor-pointer')}
      onClick={handleClick}
    >
      <div className={cx(styles.header, 'flex')}>
        <img
          className={cx(styles['a-logo'])}
          src={publishedAgentInfo?.icon}
          alt=""
        />
        <div className={cx(styles['info-container'], 'flex-1')}>
          <div className={cx('flex')}>
            <span className={cx('flex-1', styles['a-name'], 'text-ellipsis')}>
              {publishedAgentInfo?.name}
            </span>
          </div>
          <div className={cx('flex', 'items-center', styles['info-author'])}>
            <ConditionRender
              condition={publishedAgentInfo?.publishUser?.avatar}
            >
              <img
                className={cx(styles.avatar)}
                src={publishedAgentInfo?.publishUser?.avatar}
                alt=""
              />
            </ConditionRender>
            <span className={cx(styles.author)}>
              {publishedAgentInfo?.publishUser?.userName}
            </span>
            <span className={cx(styles.nickname)}>
              {publishedAgentInfo?.publishUser?.nickName}
            </span>
          </div>
          <p className={cx(styles.desc, 'text-ellipsis-3')}>
            {publishedAgentInfo?.description}
          </p>
        </div>
      </div>
      <div className={cx(styles['divider-horizontal'])} />
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <div className={cx('flex', styles.left)}>
          {/*用户人数*/}
          <span className={cx(styles.text, 'flex')}>
            <UserOutlined />
            <span>{publishedAgentInfo?.statistics?.userCount || 0}</span>
          </span>
          {/*会话次数*/}
          <span className={cx(styles.text, 'flex')}>
            <PlayCircleOutlined />
            <span>{publishedAgentInfo?.statistics?.convCount || 0}</span>
          </span>
          {/*收藏次数*/}
          <span className={cx(styles.text, 'flex')}>
            <StarOutlined />
            <span>{publishedAgentInfo?.statistics?.collectCount || 0}</span>
          </span>
        </div>
        <div className={cx(styles.right)}>
          <span className={cx('cursor-pointer')}>立即使用</span>
        </div>
      </div>
    </div>
  );
};

export default SingleAgent;
