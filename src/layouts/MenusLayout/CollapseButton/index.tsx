import SvgIcon from '@/components/base/SvgIcon';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useModel, useSearchParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 二级菜单收起/展开切换按钮
 * @description 支持通过 URL 参数 ?hideMenu=true 来默认收起二级菜单
 */
const CollapseButton: React.FC = () => {
  const {
    isSecondMenuCollapsed,
    setIsSecondMenuCollapsed,
    toggleSecondMenuCollapse,
  } = useModel('layout');
  const { navigationStyle } = useUnifiedTheme();
  const [searchParams] = useSearchParams();

  // 从 URL 参数中读取 hideMenu 配置
  useEffect(() => {
    const hideMenu = searchParams.get('hideMenu');
    if (hideMenu === 'true') {
      // 如果 URL 参数中 hideMenu=true，则收起菜单
      setIsSecondMenuCollapsed(true);
    }
  }, [searchParams, setIsSecondMenuCollapsed]);

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
