import { SPACE_ID } from '@/constants/home.constants';
import { SPACE_APPLICATION_LIST } from '@/constants/space.contants';
import { apiUserDevCollectAgentList } from '@/services/agentDev';
import { SpaceApplicationListEnum } from '@/types/enums/space';
import type { AgentInfo } from '@/types/interfaces/agent';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useLocation, useRequest } from 'umi';
import DevCollect from './DevCollect';
import styles from './index.less';
import SpaceTitle from './SpaceTitle';

const cx = classNames.bind(styles);

const SpaceSection: React.FC = () => {
  const location = useLocation();
  const [devCollectAgentList, setDevCollectAgentList] = useState<AgentInfo[]>(
    [],
  );

  // 查询用户开发智能体收藏列表
  const { run } = useRequest(apiUserDevCollectAgentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentInfo[]) => {
      setDevCollectAgentList(result);
    },
  });

  useEffect(() => {
    run({
      page: 1,
      size: 50,
    });
  }, []);

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

  // 点击开发收藏的智能体
  const handleDevCollect = (agentId: string) => {
    const spaceId = localStorage.getItem(SPACE_ID);
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  // 判断是否active
  const handleActive = (type: SpaceApplicationListEnum) => {
    return (
      (type === SpaceApplicationListEnum.Application_Develop &&
        location?.pathname.includes('develop')) ||
      (type === SpaceApplicationListEnum.Component_Library &&
        (location?.pathname.includes('library') ||
          location?.pathname.includes('knowledge') ||
          location?.pathname.includes('plugin')))
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
      {devCollectAgentList?.length > 0 ? (
        <DevCollect onClick={handleDevCollect} list={devCollectAgentList} />
      ) : (
        <>
          <div className={cx(styles['no-dev-collect'])}>还没有收藏任何内容</div>
          <div className={cx(styles['no-dev-collect'])}>
            点击⭐️按钮可将内容添加到这里~
          </div>
        </>
      )}
    </div>
  );
};

export default SpaceSection;
