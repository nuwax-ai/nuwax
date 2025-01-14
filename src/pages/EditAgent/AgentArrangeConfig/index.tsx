import classNames from 'classnames';
import React from 'react';
import ConfigOptionsHeader from './ConfigOptionsHeader';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 智能体编排区域配置
 * @constructor
 */
const AgentArrangeConfig: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <ConfigOptionsHeader title="技能" />
    </div>
  );
};

export default AgentArrangeConfig;
