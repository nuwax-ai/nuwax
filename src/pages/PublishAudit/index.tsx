import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 发布审核页面
 */
const PublishAudit: React.FC = () => {
  return <div className={cx(styles.container)}>发布审核页面</div>;
};

export default PublishAudit;
