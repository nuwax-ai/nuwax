import SvgIcon from '@/components/base/SvgIcon';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 二级菜单收起/展开切换按钮
 */
const CollapseButton: React.FC = () => {
  const { isSecondMenuCollapsed, toggleSecondMenuCollapse } =
    useModel('layout');
  const { navigationStyle } = useUnifiedTheme();

  // 计算动态导航宽度
  const firstMenuWidth =
    navigationStyle === ThemeNavigationStyleType.STYLE2
      ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE2
      : NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1;
  const menuTotalWidth =
    NAVIGATION_LAYOUT_SIZES.getTotalMenuWidth(navigationStyle);

  return (
    <Tooltip
      title={isSecondMenuCollapsed ? '展开菜单' : '收起菜单'}
      placement="right"
      arrow={false}
    >
      <div
        className={cx(styles['collapse-button'], {
          [styles.collapsed]: isSecondMenuCollapsed,
        })}
        onClick={toggleSecondMenuCollapse}
        style={{
          left: isSecondMenuCollapsed ? firstMenuWidth : menuTotalWidth,
        }}
      >
        <SvgIcon
          name="icons-common-caret_left"
          rotate={isSecondMenuCollapsed ? 180 : 0}
          className={cx(styles.icon)}
        />
      </div>
    </Tooltip>
  );
};

export default CollapseButton;
