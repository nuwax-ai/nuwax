/**
 * 侧栏顶部导航操作区
 * @description 主导航改造（单栏模式）：原一级 icon 竖栏移除后，
 * 新建任务/搜索/自动化/插件市场常驻侧栏顶部（参考 Claude/Codex 桌面端），
 * 其余后端下发的一级菜单与分离菜单收进「探索」下拉，保留后端权限过滤。
 */
import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { isImmersiveShell, isMac } from '@/utils/nuwaClawBridge';
import { EllipsisOutlined, SearchOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo } from 'react';
import { history, useModel } from 'umi';
import Header from '../Header';
import { focusSidebarSearch } from '../NewHomeSection/searchFocus';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 探索下拉排除项：新对话是动作入口（顶部行已覆盖）、主页即侧栏本体 */
const EXPLORE_EXCLUDED_CODES = new Set(['new_conversation', 'homepage']);

/** 快捷键徽标前缀：mac 用 ⌘，其余平台用 Ctrl */
const MOD_KEY = isMac() ? '⌘' : 'Ctrl';

interface SidebarNavHeaderProps {
  /** 后端下发的一级菜单（驱动探索下拉） */
  menus: MenuItemDto[];
  /** 分离菜单（文档/通知/我的电脑/更多） */
  otherMenus: MenuItemDto[];
  /** 一级菜单点击（复用原一级栏 handleTabClick 行为） */
  onMenuClick: (menu: MenuItemDto) => void;
  /** 分离菜单点击（复用原用户操作区 handleUserClick 行为） */
  onOtherMenuClick: (menu: MenuItemDto) => void;
  /** 新建任务（新建会话） */
  onNewTask: () => void;
}

interface ActionRow {
  key: string;
  icon: React.ReactNode;
  label: string;
  /** 右侧快捷键徽标（可选） */
  shortcut?: string;
  onClick: () => void;
}

const SidebarNavHeader: React.FC<SidebarNavHeaderProps> = ({
  menus,
  otherMenus,
  onMenuClick,
  onOtherMenuClick,
  onNewTask,
}) => {
  const { spaceList, getSpaceId } = useModel('spaceModel');

  /** 自动化：跳当前/默认空间的任务中心 */
  const handleAutomationClick = useCallback(() => {
    const spaceId = getSpaceId() || spaceList?.[0]?.id;
    if (spaceId) {
      history.push(`/space/${spaceId}/task-center`);
    }
  }, [getSpaceId, spaceList]);

  /** 搜索：聚焦侧栏搜索框；非会话域（搜索框未挂载）则先回首页 */
  const handleSearchClick = useCallback(() => {
    if (!focusSidebarSearch()) {
      history.push('/home');
    }
  }, []);

  const handleGoHome = useCallback(() => {
    history.push('/home');
  }, []);

  /** ⌘K 聚焦搜索 / ⌘N 新建任务（浏览器可能占用 ⌘N，尽力拦截） */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) {
        return;
      }
      const key = e.key?.toLowerCase();
      if (key === 'k') {
        e.preventDefault();
        handleSearchClick();
      } else if (key === 'n') {
        e.preventDefault();
        onNewTask();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSearchClick, onNewTask]);

  const actionRows: ActionRow[] = useMemo(
    () => [
      {
        key: 'new_task',
        icon: <SvgIcon name="icons-nav-new_chat" />,
        label: dict('PC.Layouts.DynamicMenusLayout.SidebarNavHeader.newTask'),
        shortcut: `${MOD_KEY}N`,
        onClick: onNewTask,
      },
      {
        key: 'search',
        icon: <SearchOutlined />,
        label: dict('PC.Layouts.DynamicMenusLayout.SidebarNavHeader.search'),
        shortcut: `${MOD_KEY}K`,
        onClick: handleSearchClick,
      },
      {
        key: 'automation',
        icon: <SvgIcon name="icons-nav-task-time" />,
        label: dict(
          'PC.Layouts.DynamicMenusLayout.SidebarNavHeader.automation',
        ),
        onClick: handleAutomationClick,
      },
      {
        key: 'plugin_market',
        icon: <SvgIcon name="icons-nav-plugins" />,
        label: dict(
          'PC.Layouts.DynamicMenusLayout.SidebarNavHeader.pluginMarket',
        ),
        onClick: () => history.push('/square?cate_type=Plugin'),
      },
    ],
    [handleAutomationClick, handleSearchClick, onNewTask],
  );

  /** 探索下拉：其余一级菜单 + 分离菜单，沿用后端菜单下发与权限过滤 */
  const exploreItems = useMemo<MenuProps['items']>(() => {
    const firstLevelItems = (menus || [])
      .filter((menu) => !EXPLORE_EXCLUDED_CODES.has(menu.code || ''))
      .map((menu) => ({
        key: menu.code || menu.path || menu.name,
        icon: menu.icon ? <SvgIcon name={menu.icon} /> : undefined,
        label: menu.name,
        onClick: () => onMenuClick(menu),
      }));
    const otherItems = (otherMenus || []).map((menu) => ({
      key: menu.code || menu.path || menu.name,
      icon: menu.icon ? <SvgIcon name={menu.icon} /> : undefined,
      label: menu.name,
      onClick: () => onOtherMenuClick(menu),
    }));
    if (!firstLevelItems.length && !otherItems.length) {
      return [];
    }
    return [
      ...firstLevelItems,
      ...(firstLevelItems.length && otherItems.length
        ? [{ type: 'divider' as const }]
        : []),
      ...otherItems,
    ];
  }, [menus, otherMenus, onMenuClick, onOtherMenuClick]);

  const renderRow = (row: ActionRow) => (
    <div
      key={row.key}
      className={cx(styles['action-row'])}
      onClick={row.onClick}
    >
      <span className={cx(styles['action-icon'])}>{row.icon}</span>
      <span className={cx(styles['action-label'])}>{row.label}</span>
      {row.shortcut && (
        <span className={cx(styles['action-shortcut'])}>{row.shortcut}</span>
      )}
    </div>
  );

  return (
    <div className={cx(styles['sidebar-nav-header'])}>
      {/* 桌面端沉浸式：logo 由 nuwaclaw 工具栏承载，与原一级栏行为一致 */}
      {!isImmersiveShell() && (
        <div className={cx(styles['logo-row'])} onClick={handleGoHome}>
          <Header />
        </div>
      )}
      <div className={cx(styles['action-list'])}>
        {actionRows.map(renderRow)}
        {exploreItems?.length ? (
          <Dropdown
            menu={{ items: exploreItems }}
            trigger={['click']}
            placement="bottomLeft"
          >
            <div className={cx(styles['action-row'])}>
              <span className={cx(styles['action-icon'])}>
                <EllipsisOutlined />
              </span>
              <span className={cx(styles['action-label'])}>
                {dict('PC.Layouts.DynamicMenusLayout.SidebarNavHeader.explore')}
              </span>
            </div>
          </Dropdown>
        ) : null}
      </div>
    </div>
  );
};

export default SidebarNavHeader;
