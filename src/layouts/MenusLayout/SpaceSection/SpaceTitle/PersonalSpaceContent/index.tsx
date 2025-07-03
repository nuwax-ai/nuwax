import personal from '@/assets/images/personal.png';
import teamImage from '@/assets/images/team_image.png';
import { SPACE_ID } from '@/constants/home.constants';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum, SpaceTypeEnum } from '@/types/enums/space';
import type { PersonalSpaceContentType } from '@/types/interfaces/layouts';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { CheckOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { history, useLocation, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 个人空间Popover内容组件
 */
const PersonalSpaceContent: React.FC<PersonalSpaceContentType> = ({
  onCreateTeam,
  onClosePopover,
}) => {
  const location = useLocation();
  const { pathname } = location;
  const { spaceList, currentSpaceInfo } = useModel('spaceModel');

  // 过滤当前工作空间
  const filterSpaceList = useMemo(() => {
    return (
      spaceList?.filter(
        (item: SpaceInfo) => item.id !== currentSpaceInfo?.id,
      ) || []
    );
  }, [spaceList, currentSpaceInfo]);

  // 点击空间列表事件
  const handleClick = (info: SpaceInfo) => {
    const spaceId = info.id;
    localStorage.setItem(SPACE_ID, spaceId.toString());
    onClosePopover(false);

    // 普通用户开发者功能如果关闭，首次进入空间菜单选中“空间广场”；
    const isUser_NotAllowDevelop =
      info?.currentUserRole === RoleEnum.User &&
      info?.allowDevelop === AllowDevelopEnum.Not_Allow;
    // 智能体开发页以及子页
    if (pathname.includes('develop') || pathname.includes('log')) {
      const defaultUrl = isUser_NotAllowDevelop ? 'space-square' : 'develop';
      localStorage.setItem('SPACE_URL', defaultUrl);
      history.push(`/space/${spaceId}/${defaultUrl}`);
    }
    // mcp管理
    else if (pathname.includes('mcp')) {
      history.push(`/space/${spaceId}/mcp`);
    }
    // 空间广场页
    else if (pathname.includes('space-square')) {
      history.push(`/space/${spaceId}/space-square`);
    }
    // 成员与设置
    else if (pathname.includes('team')) {
      // 如果团队空间切换到个人空间，需要隐藏团队设置，同样需要切换到默认页'智能体开发'
      if (info.type === SpaceTypeEnum.Personal) {
        const defaultUrl = isUser_NotAllowDevelop ? 'space-square' : 'develop';
        localStorage.setItem('SPACE_URL', defaultUrl);
        history.push(`/space/${spaceId}/${defaultUrl}`);
      } else {
        // 个人空间时，不显示"成员与设置", 普通用户也不显示"成员与设置"
        const isUser = info?.currentUserRole === RoleEnum.User;
        // 如果不是普通用户，则跳转到本页面, 否则跳转
        const defaultUrl = !isUser
          ? 'team'
          : isUser_NotAllowDevelop
          ? 'space-square'
          : 'develop';
        // 团队空间互相切换时，只更新空间id即可
        history.push(`/space/${spaceId}/${defaultUrl}`);
      }
    }
    // 组件库
    else {
      const defaultUrl = isUser_NotAllowDevelop ? 'space-square' : 'library';
      localStorage.setItem('SPACE_URL', defaultUrl);
      history.push(`/space/${spaceId}/${defaultUrl}`);
    }
  };

  // 个人空间时，头像是默认的
  const getAvatar = useCallback((info: SpaceInfo) => {
    return info?.type === SpaceTypeEnum.Personal
      ? (personal as string)
      : ((info?.icon || teamImage) as string);
  }, []);

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'overflow-hide')}>
      <div className={cx(styles['p-header'], 'flex')}>
        <CheckOutlined className={styles.icon} />
        <img
          className={cx(styles.img, 'radius-6')}
          src={getAvatar(currentSpaceInfo)}
          alt=""
        />
        <span className={cx('flex-1', styles.title, 'text-ellipsis')}>
          {currentSpaceInfo?.name || '个人空间'}
        </span>
      </div>
      <Divider className={styles['divider']} />
      <ul className={cx('flex-1', 'overflow-y')}>
        {filterSpaceList?.map((item: SpaceInfo) => (
          <li
            key={item.id}
            className={cx(styles['team-info'], 'flex', 'items-center')}
            onClick={() => handleClick(item)}
          >
            <img
              className={cx(styles['team-logo'])}
              src={getAvatar(item)}
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
        <span className={cx('flex-1', 'text-ellipsis')}>创建团队空间</span>
      </div>
    </div>
  );
};

export default PersonalSpaceContent;
