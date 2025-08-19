import { LeftOutlined, RightOutlined } from '@ant-design/icons';
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

  return (
    <Tooltip
      title={isSecondMenuCollapsed ? '展开菜单' : '收起菜单'}
      placement="left"
      arrow={false}
    >
      <div
        className={cx(styles['collapse-button'], {
          [styles.collapsed]: isSecondMenuCollapsed,
        })}
        onClick={toggleSecondMenuCollapse}
      >
        {isSecondMenuCollapsed ? (
          <RightOutlined className={cx(styles.icon)} />
        ) : (
          <LeftOutlined className={cx(styles.icon)} />
        )}
      </div>
    </Tooltip>
  );
};

export default CollapseButton;
