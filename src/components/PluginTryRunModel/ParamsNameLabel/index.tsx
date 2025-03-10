import ConditionRender from '@/components/ConditionRender';
import type { DataTypeEnum } from '@/types/enums/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ParamsNameLabelProps {
  require?: boolean;
  paramName: string;
  paramType: DataTypeEnum;
}

/**
 * 参数名称label
 */
const ParamsNameLabel: React.FC<ParamsNameLabelProps> = ({
  require,
  paramName,
  paramType,
}) => {
  return (
    <div className={cx('flex', 'items-center', styles.container)}>
      <span>{paramName}</span>
      <ConditionRender condition={require}>
        <span className={cx(styles.star)}>*</span>
      </ConditionRender>
      <span className={cx(styles['param-type'])}>{paramType}</span>
    </div>
  );
};

export default ParamsNameLabel;
