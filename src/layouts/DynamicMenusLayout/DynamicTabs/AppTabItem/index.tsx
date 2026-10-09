/**
 * 女娲应用多开标签项（经典布局一级图标栏）
 * @description 挂在女娲应用一级菜单图标正下方（DynamicTabs 内），几何与
 * TabItem 对齐（style1 40×40 纯图标 / style2 64×64 图标+文字）；hover 出
 * 右上角关闭钮；激活态复用 TabItem 同款视觉（品牌色 + 高亮底）。
 */
import agentImage from '@/assets/images/agent_image.png';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import type { OpenedAppTabInfo } from '@/models/openedAppTabs';
import { dict } from '@/services/i18nRuntime';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { CloseOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface AppTabItemProps {
  /** 标签数据（应用名/图标/落地路由） */
  tab: OpenedAppTabInfo;
  /** 当前路由命中该标签（高亮） */
  active: boolean;
  /** 点击标签（跳对应应用） */
  onClick: () => void;
  /** 关闭标签（右上角关闭钮） */
  onClose: (e: React.MouseEvent) => void;
}

const AppTabItem: React.FC<
  AppTabItemProps & { isSecondMenuCollapsed?: boolean }
> = ({ tab, active, onClick, onClose, isSecondMenuCollapsed = false }) => {
  const { navigationStyle } = useUnifiedTheme();
  const isStyle2 = useMemo(
    () => navigationStyle === ThemeNavigationStyleType.STYLE2,
    [navigationStyle],
  );
  const navStyle: React.CSSProperties = useMemo(
    () =>
      isStyle2
        ? { width: '64px', height: '64px' }
        : { width: '40px', height: '40px', padding: 0 },
    [isStyle2],
  );

  const content = (
    <div
      onClick={onClick}
      className={cx(
        'flex',
        'flex-col',
        'items-center',
        'content-center',
        'cursor-pointer',
        styles.box,
        {
          [styles.active]: active,
        },
      )}
    >
      <div className={cx(styles['active-box'])} style={navStyle}>
        <div className={cx(styles['active-icon-container'])}>
          {/* 应用图标为下发 URL，空串/加载失败兜底默认图（同女娲应用页） */}
          <img
            className={cx(styles['icon-image'])}
            src={tab.icon || agentImage}
            alt={tab.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = agentImage;
            }}
          />
        </div>
        {/* style2 图标+文字形态（与 TabItem 一致；style1 纯图标走 Tooltip） */}
        {isStyle2 && (
          <span className={cx(styles.text)} title={tab.name}>
            {tab.name}
          </span>
        )}
      </div>
      {/* 右上角关闭钮：hover 行时显示（触屏常显），点击关闭不触发跳转 */}
      <span
        role="button"
        aria-label={dict(
          'PC.Layouts.DynamicMenusLayout.SidebarNavHeader.closeAppTab',
        )}
        className={cx(styles.close)}
        onClick={onClose}
      >
        <CloseOutlined />
      </span>
    </div>
  );

  // 与 TabItem 同策略：二级收起或 style2（自带文字）时不套 Tooltip
  if (isSecondMenuCollapsed || isStyle2) {
    return content;
  }
  return (
    <Tooltip
      title={tab.name}
      placement="right"
      color="#fff"
      styles={{ body: { color: '#000' } }}
    >
      {content}
    </Tooltip>
  );
};

export default AppTabItem;
