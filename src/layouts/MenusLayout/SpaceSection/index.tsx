import personal from '@/assets/images/personal.png';
import teamImage from '@/assets/images/team_image.png';
import ConditionRender from '@/components/ConditionRender';
import { SPACE_URL } from '@/constants/home.constants';
import { SPACE_APPLICATION_LIST } from '@/constants/space.constants';
import { SpaceApplicationListEnum, SpaceTypeEnum } from '@/types/enums/space';
import type { AgentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import UserRelAgent from '../UserRelAgent';
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
  const { editAgentList, runEdit, runDevCollect } = useModel('devCollectAgent');

  useEffect(() => {
    // 根据url地址中的spaceId来重置当前空间信息，因为用户可能手动修改url地址栏中的空间id，也可能是复制来的url
    if (spaceId && !!spaceList?.length) {
      handleCurrentSpaceInfo(spaceList, Number(spaceId));
    }
  }, [spaceList, spaceId]);

  useEffect(() => {
    // 最近编辑
    runEdit({
      size: 8,
    });
    // 开发收藏
    runDevCollect({
      page: 1,
      size: 8,
    });
  }, []);

  const handlerApplication = (type: SpaceApplicationListEnum) => {
    switch (type) {
      // 应用开发
      case SpaceApplicationListEnum.Application_Develop:
        history.push(`/space/${spaceId}/develop`);
        localStorage.setItem(SPACE_URL, 'develop');
        break;
      // 组件库
      case SpaceApplicationListEnum.Component_Library:
        history.push(`/space/${spaceId}/library`);
        localStorage.setItem(SPACE_URL, 'library');
        break;
      // 团队设置
      case SpaceApplicationListEnum.Team_Setting:
        history.push(`/space/${spaceId}/team`);
        localStorage.setItem(SPACE_URL, 'team');
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

  // 点击进入"工作空间智能体"
  const handleClick = (info: AgentInfo) => {
    const { agentId, spaceId } = info;
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  // 个人空间时，头像是默认的
  const avatar = useMemo(() => {
    return (
      currentSpaceInfo?.icon ||
      (currentSpaceInfo?.type !== SpaceTypeEnum.Personal ? teamImage : personal)
    );
  }, [currentSpaceInfo]);

  return (
    <div className={cx('h-full', 'px-6', 'py-16', 'overflow-y')}>
      <SpaceTitle avatar={avatar} name={currentSpaceInfo?.name} />
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
                'hover-deep',
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
      <ConditionRender condition={editAgentList?.length}>
        <h3 className={cx(styles['collection-title'])}>最近编辑</h3>
        {editAgentList?.map((item: AgentInfo) => (
          <UserRelAgent
            key={item.id}
            onClick={() => handleClick(item)}
            icon={item.icon}
            name={item.name}
          />
        ))}
      </ConditionRender>
      <h3 className={cx(styles['collection-title'])}>开发收藏</h3>
      <DevCollect />
    </div>
  );
};

export default SpaceSection;
