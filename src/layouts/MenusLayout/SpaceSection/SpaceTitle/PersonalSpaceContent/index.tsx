import personal from '@/assets/images/personal.png';
import teamImage from '@/assets/images/team_image.png';
import { SPACE_ID } from '@/constants/home.constants';
import type { PersonalSpaceContentType } from '@/types/interfaces/menus';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { CheckOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history, useLocation, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 个人空间Popover内容组件
 */
const PersonalSpaceContent: React.FC<PersonalSpaceContentType> = ({
  onCreateTeam,
}) => {
  const location = useLocation();
  const { pathname } = location;
  const { spaceList, setCurrentSpaceInfo } = useModel('spaceModel');

  // 点击空间列表事件
  const handleClick = (info: SpaceInfo) => {
    const spaceId = info.id;
    localStorage.setItem(SPACE_ID, spaceId);
    setCurrentSpaceInfo(info);
    // 路由跳转
    if (pathname.includes('develop')) {
      history.push(`/space/${spaceId}/develop`);
    }
    if (pathname.includes('library')) {
      history.push(`/space/${spaceId}/library`);
    }
  };

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
      <span className={cx(styles['team-title'])}>团队</span>
      <ul>
        {spaceList?.map((item) => (
          <li
            key={item.id}
            className={cx(styles['team-info'], 'flex', 'items-center')}
            onClick={() => handleClick(item)}
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
  );
};

export default PersonalSpaceContent;
