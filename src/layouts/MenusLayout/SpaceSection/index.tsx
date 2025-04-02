import { SPACE_APPLICATION_LIST } from '@/constants/space.constants';
import { SpaceApplicationListEnum, SpaceTypeEnum } from '@/types/enums/space';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import DevCollect from './DevCollect';
import styles from './index.less';
import SpaceTitle from './SpaceTitle';

const cx = classNames.bind(styles);

const SpaceSection: React.FC = () => {
  const location = useLocation();
  const { spaceId } = useParams();
  const { pathname } = location;
  const { spaceList, currentSpaceInfo, handleCurrentSpaceInfo } =
    useModel('spaceModel');

  useEffect(() => {
    // 根据url地址中的spaceId来重置当前空间信息，因为用户可能手动修改url地址栏中的空间id，也可能是复制来的url
    if (spaceId && !!spaceList?.length) {
      handleCurrentSpaceInfo(spaceList, Number(spaceId));
    }
  }, [spaceList, spaceId]);

  const handlerApplication = (type: SpaceApplicationListEnum) => {
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
        history.push(`/space/${spaceId}/team`);
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
          pathname.includes('plugin'))) ||
      (type === SpaceApplicationListEnum.Team_Setting &&
        pathname.includes('team'))
    );
  };

  return (
    <div className={cx('h-full', 'px-6', 'py-16', 'overflow-y')}>
      <SpaceTitle />
      <ul>
        {SPACE_APPLICATION_LIST.map((item) => {
          if (
            currentSpaceInfo?.type === SpaceTypeEnum.Personal &&
            item.type === SpaceApplicationListEnum.Team_Setting
          ) {
            return null;
          }
          return (
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
          );
        })}
      </ul>
      <h3 className={cx(styles['collection-title'])}>开发收藏</h3>
      <DevCollect />
    </div>
  );
};

export default SpaceSection;
