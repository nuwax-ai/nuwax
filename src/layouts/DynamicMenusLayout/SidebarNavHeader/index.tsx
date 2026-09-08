/**
 * 侧栏顶部导航区
 * @description 主导航改造（单栏模式）：顶栏 = Logo + 搜索 + 折叠（固定），
 * 下方为「新建任务」固定项 + 后端菜单接口下发的一级导航项（全量渲染，仅排除新对话）。
 * 点导航项时右侧并列展开原二级菜单列；分离菜单（文档/通知/我的电脑/更多）在侧栏底部栏展示。
 */
import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { isImmersiveShell, isMac } from '@/utils/nuwaClawBridge';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo } from 'react';
import { history, useModel } from 'umi';
import { useSidebarCollapse } from '../useSidebarCollapse';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 快捷键徽标前缀：mac 用 ⌘，其余平台用 Ctrl */
const MOD_KEY = isMac() ? '⌘' : 'Ctrl';

/** 原型同款描边搜索图标（SVG 自需求原型移植） */
const SearchSvg: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    width="1em"
    height="1em"
    aria-hidden
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/**
 * 原型同款折叠面板图标（SVG 自需求原型移植）。
 * flip=true 时镜像（分隔线/箭头朝右），用于侧栏折叠后的展开态。
 */
const PanelToggleSvg: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    width="1em"
    height="1em"
    style={flip ? { transform: 'rotate(180deg)' } : undefined}
    aria-hidden
  >
    <rect x="5.4" y="4.6" width="13.2" height="14.8" rx="2.6" />
    <path d="M10.2 4.6v14.8" />
    <path d="m15.2 9.6-2.6 2.4 2.6 2.4" />
  </svg>
);

interface SidebarNavHeaderProps {
  /** 后端菜单接口下发的一级菜单（导航行走接口，全量渲染） */
  menus: MenuItemDto[];
  /** 当前激活的一级菜单 code（导航行选中高亮） */
  activeTab: string;
  /** 一级菜单点击（复用原一级栏 handleTabClick 行为，展开原二级菜单列） */
  onMenuClick: (menu: MenuItemDto) => void;
  /** 新建任务（新建会话） */
  onNewTask: () => void;
}

const SidebarNavHeader: React.FC<SidebarNavHeaderProps> = ({
  menus,
  activeTab,
  onMenuClick,
  onNewTask,
}) => {
  const { isSecondMenuCollapsed, toggleCollapse } = useSidebarCollapse();
  const { setOpenSearchModal } = useModel('layout');
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  /** 搜索：打开搜索弹窗（命令面板） */
  const handleSearchClick = useCallback(() => {
    setOpenSearchModal(true);
  }, [setOpenSearchModal]);

  /** ⌘N 新建任务（⌘K 由 SidebarSearchModal 全局接管；浏览器可能占用 ⌘N，尽力拦截） */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) {
        return;
      }
      if (e.key?.toLowerCase() === 'n') {
        e.preventDefault();
        onNewTask();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewTask]);

  /** 导航行：接口下发的一级菜单全量渲染，仅排除新对话（新建任务为固定项） */
  const navMenus = useMemo(
    () => (menus || []).filter((menu) => menu.code !== 'new_conversation'),
    [menus],
  );

  return (
    <div className={cx(styles['sidebar-nav-header'])}>
      {/* 顶栏：Logo + 搜索固定；桌面端沉浸式仅把折叠入口交给 nuwaclaw 工具栏。 */}
      <div className={cx(styles['header-bar'])}>
        {/* 直接渲染站点 Logo（原 Header 组件的 logo-container 带老竖栏固定高度，单栏顶栏不适用） */}
        {tenantConfigInfo?.siteLogo && (
          <img
            className={cx(styles['header-logo'])}
            src={tenantConfigInfo.siteLogo}
            alt=""
            onClick={() => history.push('/home')}
          />
        )}
        <div className={cx(styles['header-actions'])}>
          <Tooltip
            title={dict(
              'PC.Layouts.DynamicMenusLayout.SidebarNavHeader.search',
            )}
            placement="bottom"
            arrow={false}
          >
            <div
              className={cx(styles['header-action-btn'])}
              onClick={handleSearchClick}
            >
              <SearchSvg />
            </div>
          </Tooltip>
          {!isImmersiveShell() && (
            <Tooltip
              title={dict(
                isSecondMenuCollapsed
                  ? 'PC.Layouts.DynamicMenusLayout.CollapseButton.expandMenu'
                  : 'PC.Layouts.DynamicMenusLayout.CollapseButton.collapseMenu',
              )}
              placement="bottom"
              arrow={false}
            >
              <div
                className={cx(styles['header-action-btn'])}
                onClick={toggleCollapse}
              >
                <PanelToggleSvg flip={isSecondMenuCollapsed} />
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* 新建任务（固定项） */}
      <div
        className={cx(styles['action-row'], styles['new-task-row'])}
        onClick={onNewTask}
      >
        <span className={cx(styles['action-icon'])}>
          <SvgIcon name="icons-nav-new_chat" />
        </span>
        <span className={cx(styles['action-label'])}>
          {dict('PC.Layouts.DynamicMenusLayout.SidebarNavHeader.newTask')}
        </span>
        <span className={cx(styles['action-shortcut'])}>{`${MOD_KEY}N`}</span>
      </div>

      {/* 导航行：走菜单接口，选中时右侧展开原二级菜单列 */}
      <div className={cx(styles['nav-list'])}>
        {navMenus.map((menu: MenuItemDto) => (
          <div
            key={menu.code || menu.path || menu.name}
            className={cx(styles['nav-item'], {
              [styles['nav-item-active']]: activeTab === menu.code,
            })}
            onClick={() => onMenuClick(menu)}
          >
            <span className={cx(styles['nav-item-icon'])}>
              {/* 菜单 icon 动态下发，空时走默认兜底图标（与经典布局 TabItem 同款） */}
              <SvgIcon name={menu.icon || 'icons-nav-task-time'} />
            </span>
            <span className={cx(styles['nav-item-label'])}>{menu.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarNavHeader;
