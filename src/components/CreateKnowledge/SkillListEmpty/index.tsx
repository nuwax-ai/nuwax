import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SkillListEmpty: React.FC<{
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}> = ({ title = '请选择工作流', onClick }) => (
  <div className={cx(styles['workflow-desc'])} onClick={onClick}>
    {title}
  </div>
);

export default SkillListEmpty;
