import { SvgIcon } from '@/components/base';
import { PATH_URL, SPACE_ID } from '@/constants/home.constants';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum, SpaceTypeEnum } from '@/types/enums/space';
import type { PersonalSpaceContentType } from '@/types/interfaces/layouts';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { CheckOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
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
  const params = useParams();

  const { pathname } = location;
  const { spaceList, currentSpaceInfo } = useModel('spaceModel');
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

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
    // 关闭移动端菜单
    handleCloseMobileMenu();

    // 普通用户开发者功能如果关闭，首次进入空间菜单选中“空间广场”；
    const isUser_NotAllowDevelop =
      info?.currentUserRole === RoleEnum.User &&
      info?.allowDevelop === AllowDevelopEnum.Not_Allow;

    // 解析后的路径
    let resolvedPath = '';

    // 智能体开发页以及子页
    if (pathname.includes('develop') && !pathname.includes('page-develop')) {
      const defaultUrl = isUser_NotAllowDevelop ? 'space-square' : 'develop';
      resolvedPath = `/space/${spaceId}/${defaultUrl}`;
    }
    // 网页应用开发
    else if (pathname.includes('page-develop')) {
      resolvedPath = `/space/${spaceId}/page-develop`;
    }
    // 技能管理
    else if (pathname.includes('skill-manage')) {
      resolvedPath = `/space/${spaceId}/skill-manage`;
    }
    // mcp管理
    else if (pathname.includes('mcp')) {
      resolvedPath = `/space/${spaceId}/mcp`;
    }
    // 任务中心
    else if (pathname.includes('task-center')) {
      resolvedPath = `/space/${spaceId}/task-center`;
    }
    // 日志查询
    else if (pathname.includes('library-log')) {
      resolvedPath = `/space/${spaceId}/library-log`;
    }
    // 空间广场页
    else if (pathname.includes('space-square')) {
      resolvedPath = `/space/${spaceId}/space-square`;
    }
    // 成员与设置
    else if (pathname.includes('team')) {
      // 如果团队空间切换到个人空间，需要隐藏团队设置，同样需要切换到默认页'智能体开发'
      if (info.type === SpaceTypeEnum.Personal) {
        const defaultUrl = isUser_NotAllowDevelop ? 'space-square' : 'develop';
        resolvedPath = `/space/${spaceId}/${defaultUrl}`;
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
        resolvedPath = `/space/${spaceId}/${defaultUrl}`;
      }
    }
    // 组件库
    else if (
      pathname.includes('library') &&
      !pathname.includes('library-log')
    ) {
      const defaultUrl = isUser_NotAllowDevelop ? 'space-square' : 'library';
      resolvedPath = `/space/${spaceId}/${defaultUrl}`;
    } else {
      // 其他路径的通用处理：
      // 如果没有路由参数（params 为空对象），直接跳转到当前路径
      // 如果有路由参数，则只更新 spaceId，保持当前页面不变
      const hasParams =
        params && Object.keys(params as Record<string, unknown>).length > 0;

      if (!hasParams) {
        // 没有动态参数，直接跳转当前路径（仅更新本地 SPACE_ID）
        resolvedPath = pathname;
      } else {
        const spaceParams = params as Record<string, string | undefined>;
        const currentSpaceId = spaceParams.spaceId;

        if (currentSpaceId) {
          // 将当前路径中的 spaceId 替换为新的 spaceId，保持在同一页面
          const newPathname = pathname.replace(
            String(currentSpaceId),
            String(spaceId),
          );
          resolvedPath = newPathname;
        } else {
          // 没有 spaceId 参数时，退回到当前路径
          resolvedPath = pathname;
        }
      }
    }

    try {
      const pathUrl = localStorage.getItem(PATH_URL);
      if (pathUrl) {
        const pathUrlObj = JSON.parse(pathUrl);
        pathUrlObj['workspace'] = resolvedPath;

        // 存储当前路径
        localStorage.setItem(PATH_URL, JSON.stringify(pathUrlObj));
      } else {
        const pathUrlObj = {
          workspace: resolvedPath,
        };
        // 存储当前路径
        localStorage.setItem(PATH_URL, JSON.stringify(pathUrlObj));
      }
    } catch {}

    // 跳转
    history.push(resolvedPath);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'overflow-hide')}>
      <div className={cx(styles['p-header'], 'flex')}>
        <CheckOutlined className={styles.icon} />
        <span className={cx('flex-1', styles.title, 'text-ellipsis')}>
          {currentSpaceInfo?.name || '个人空间'}
        </span>
      </div>
      <Divider className={styles['divider']} />
      <ul className={cx('flex-1', 'overflow-y')}>
        {/* 空间列表 */}
        {filterSpaceList?.map((item: SpaceInfo) => (
          <li
            key={item.id}
            className={cx(styles['team-info'], 'flex', 'items-center')}
            onClick={() => handleClick(item)}
          >
            <span className={cx('text-ellipsis')}>{item.name}</span>
          </li>
        ))}
      </ul>
      <div
        className={cx(styles['create-team'], 'flex', 'cursor-pointer')}
        onClick={onCreateTeam}
      >
        <SvgIcon name="icons-common-plus" style={{ fontSize: 16 }} />
        <span className={cx('flex-1', 'text-ellipsis')}>创建团队空间</span>
      </div>
    </div>
  );
};

export default PersonalSpaceContent;
