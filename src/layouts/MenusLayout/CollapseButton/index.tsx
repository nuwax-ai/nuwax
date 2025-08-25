import SvgIcon from '@/components/base/SvgIcon';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import { FIRST_MENU_WIDTH, MENU_WIDTH } from '../../layout.constants';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 二级菜单收起/展开切换按钮
 */
const CollapseButton: React.FC = () => {
  const { isSecondMenuCollapsed, toggleSecondMenuCollapse } =
    useModel('layout');

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
          left: isSecondMenuCollapsed ? FIRST_MENU_WIDTH : MENU_WIDTH,
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
