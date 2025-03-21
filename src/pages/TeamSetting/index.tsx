import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 团队设置页面
 */
const TeamSetting: React.FC = () => {
  return <div className={cx(styles.container)}>团队设置页面</div>;
};

export default TeamSetting;
