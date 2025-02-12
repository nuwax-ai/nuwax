import personal from '@/assets/images/personal.png';
import teamImage from '@/assets/images/team_image.png';
import type { PersonalSpaceContentType } from '@/types/interfaces/menus';
import { CheckOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 个人空间Popover内容组件
 */
const PersonalSpaceContent: React.FC<PersonalSpaceContentType> = ({
  spaceList,
  onCreateTeam,
}) => {
  return (
    <div className={styles.container}>
      <div className={cx(styles['p-header'], 'flex')}>
        <CheckOutlined className={styles.icon} />
        <img
          className={cx(styles.img, 'radius-6')}
          src={personal as string}
          alt=""
        />
        <span className={cx('flex-1', styles.title)}>个人空间</span>
      </div>
      <Divider className={styles['divider']} />
      <div className={cx(styles['p-footer'])}>
        <span className={cx(styles['team-title'])}>团队</span>
        <ul>
          {spaceList?.map((item) => (
            <li
              key={item.id}
              className={cx(styles['team-info'], 'flex', 'items-center')}
            >
              <img
                className={cx(styles['team-logo'])}
                src={item.icon || (teamImage as string)}
                alt=""
              />
              <span className={cx('text-ellipsis')}>{item.name}</span>
            </li>
          ))}
        </ul>
        <div
          className={cx(styles['create-team'], 'flex', 'cursor-pointer')}
          onClick={onCreateTeam}
        >
          <PlusCircleOutlined />
          <span className={cx('flex-1', 'text-ellipsis')}>创建新团队</span>
        </div>
      </div>
    </div>
  );
};

export default PersonalSpaceContent;
