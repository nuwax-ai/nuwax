import MenuListItem from '@/components/base/MenuListItem';
import SecondMenuItem from '@/components/base/SecondMenuItem';
import ConditionRender from '@/components/ConditionRender';
import { SPACE_URL } from '@/constants/home.constants';
import { SPACE_APPLICATION_LIST } from '@/constants/space.constants';
import { RoleEnum } from '@/types/enums/common';
import {
  AllowDevelopEnum,
  SpaceApplicationList,
  SpaceApplicationListEnum,
  SpaceTypeEnum,
} from '@/types/enums/space';
import type { AgentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import DevCollect from './DevCollect';
import styles from './index.less';
import SpaceTitle from './SpaceTitle';

const cx = classNames.bind(styles);

const SpaceSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const location = useLocation();
  const { spaceId } = useParams();
  const { pathname } = location;

  const { spaceList, currentSpaceInfo, handleCurrentSpaceInfo } =
    useModel('spaceModel');
  const { editAgentList, runEdit, runDevCollect } = useModel('devCollectAgent');
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

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
    let url = '';
    switch (type) {
      // 应用开发
      case SpaceApplicationListEnum.Application_Develop:
        url = 'develop';
        break;
      // 组件库
      case SpaceApplicationListEnum.Component_Library:
        url = 'library';
        break;
      // 组件库
      case SpaceApplicationListEnum.MCP_Manage:
        url = 'mcp';
        break;
      // 空间广场
      case SpaceApplicationListEnum.Space_Square:
        url = 'space-square';
        break;
      // 成员与设置
      case SpaceApplicationListEnum.Team_Setting:
        url = 'team';
        break;
      default:
        url = 'develop';
    }
    // 关闭移动端菜单
    handleCloseMobileMenu();
    history.push(`/space/${spaceId}/${url}`);
    localStorage.setItem(SPACE_URL, url);
  };

  // 判断是否active
  const handleActive = (type: SpaceApplicationListEnum) => {
    return (
      (type === SpaceApplicationListEnum.Application_Develop &&
        (pathname.includes('develop') || pathname.includes('log'))) ||
      (type === SpaceApplicationListEnum.Component_Library &&
        (pathname.includes('library') ||
          pathname.includes('knowledge') ||
          pathname.includes('plugin') ||
          pathname.includes('table'))) ||
      (type === SpaceApplicationListEnum.MCP_Manage &&
        pathname.includes('mcp')) ||
      (type === SpaceApplicationListEnum.Space_Square &&
        pathname.includes('space-square')) ||
      (type === SpaceApplicationListEnum.Team_Setting &&
        pathname.includes('team'))
    );
  };

  // 点击进入"工作空间智能体"
  const handleClick = (info: AgentInfo) => {
    const { agentId, spaceId } = info;
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  return (
    <div className={cx('h-full', 'overflow-y', styles.container)} style={style}>
      <div style={{ padding: '14px 12px' }}>
        <SpaceTitle name={currentSpaceInfo?.name} />
      </div>
      <div>
        {SPACE_APPLICATION_LIST.map(
          (item: SpaceApplicationList, index: number) => {
            // 个人空间时，不显示"成员与设置", 普通用户也不显示"成员与设置"
            if (
              (currentSpaceInfo?.type === SpaceTypeEnum.Personal ||
                currentSpaceInfo?.currentUserRole === RoleEnum.User) &&
              item.type === SpaceApplicationListEnum.Team_Setting
            ) {
              return null;
            }
            // “开发者功能”【tips：关闭后，用户将无法看见“智能体开发”和“组件库”，创建者和管理员不受影响】
            if (
              currentSpaceInfo?.currentUserRole === RoleEnum.User &&
              currentSpaceInfo?.allowDevelop === AllowDevelopEnum.Not_Allow &&
              [
                SpaceApplicationListEnum.Application_Develop,
                SpaceApplicationListEnum.Component_Library,
              ].includes(item.type)
            ) {
              return null;
            }
            return (
              <SecondMenuItem
                key={item.type}
                isFirst={index === 0}
                name={item.text}
                isActive={handleActive(item.type)}
                icon={item.icon}
                onClick={() => handlerApplication(item.type)}
              />
            );
          },
        )}
      </div>
      <ConditionRender condition={editAgentList?.length}>
        <h3 className={cx(styles['collection-title'])}>最近使用</h3>
        {editAgentList?.slice(0, 5).map((item: AgentInfo, index: number) => (
          <MenuListItem
            key={item.id}
            isFirst={index === 0}
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
