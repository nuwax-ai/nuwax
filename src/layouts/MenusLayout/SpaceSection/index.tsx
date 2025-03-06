import { SPACE_ID } from '@/constants/home.constants';
import { SPACE_APPLICATION_LIST } from '@/constants/space.contants';
import { SpaceApplicationListEnum } from '@/types/enums/space';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history, useLocation } from 'umi';
import DevCollect from './DevCollect';
import styles from './index.less';
import SpaceTitle from './SpaceTitle';

const cx = classNames.bind(styles);

const SpaceSection: React.FC = () => {
  const location = useLocation();
  const { pathname } = location;

  const handlerApplication = (type: SpaceApplicationListEnum) => {
    const spaceId = localStorage.getItem(SPACE_ID);
    switch (type) {
      // 应用开发
      case SpaceApplicationListEnum.Application_Develop:
        history.push(`/space/${spaceId}/develop`);
        break;
      // 组件库
      case SpaceApplicationListEnum.Component_Library:
        history.push(`/space/${spaceId}/library`);
        break;
      // 团队设置
      case SpaceApplicationListEnum.Team_Setting:
        message.warning('团队设置此版本待完善');
        break;
    }
  };

  // 判断是否active
  const handleActive = (type: SpaceApplicationListEnum) => {
    return (
      (type === SpaceApplicationListEnum.Application_Develop &&
        pathname.includes('develop')) ||
      (type === SpaceApplicationListEnum.Component_Library &&
        (pathname.includes('library') ||
          pathname.includes('knowledge') ||
          pathname.includes('plugin')))
    );
  };

  return (
    <div className={cx('h-full', 'px-6', 'py-16', 'overflow-y')}>
      <SpaceTitle />
      <ul>
        {SPACE_APPLICATION_LIST.map((item) => (
          <li
            key={item.type}
            onClick={() => handlerApplication(item.type)}
            className={cx(
              styles['space-item'],
              'hover-box',
              'flex',
              'items-center',
              'cursor-pointer',
              { [styles.active]: handleActive(item.type) },
            )}
          >
            {item.icon}
            <span className={cx(styles.text)}>{item.text}</span>
          </li>
        ))}
      </ul>
      <h3 className={cx(styles['collection-title'])}>开发收藏</h3>
      <DevCollect />
    </div>
  );
};

export default SpaceSection;
