import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ParamsNameLabelProps {
  paramName: string;
  paramType: string;
}

/**
 * 参数名称label
 */
const ParamsNameLabel: React.FC<ParamsNameLabelProps> = ({
  paramName,
  paramType,
}) => {
  return (
    <div className={cx('flex', 'items-center', styles.container)}>
      <span>{paramName}</span>
      <span className={cx(styles.star)}>*</span>
      <span className={cx(styles['param-type'])}>{paramType}</span>
    </div>
  );
};

export default ParamsNameLabel;
