import SvgIcon from '@/components/base/SvgIcon';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import { useBackgroundStyle } from '@/utils/backgroundStyle';
import { FIRST_MENU_WIDTH, MENU_WIDTH } from '../../layout.constants';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 二级菜单收起/展开切换按钮
 */
const CollapseButton: React.FC = () => {
  const { isSecondMenuCollapsed, toggleSecondMenuCollapse } =
    useModel('layout');
  const { navigationStyle } = useBackgroundStyle();
  
  // 计算动态导航宽度
  const firstMenuWidth = navigationStyle === 'style2' ? 88 : 60;
  const menuTotalWidth = firstMenuWidth + 240; // 240是二级菜单宽度

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
