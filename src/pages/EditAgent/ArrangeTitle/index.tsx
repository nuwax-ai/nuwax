import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import type { ArrangeTitleProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 编排顶部title组件
 */
const ArrangeTitle: React.FC<ArrangeTitleProps> = ({
  icon,
  modelName,
  onClick,
}) => {
  return (
    <div
      className={cx(
        'flex',
        'content-between',
        'items-center',
        styles['edit-header'],
      )}
    >
      <h3>编排</h3>
      <div
        className={cx(
          'flex',
          'items-center',
          'cursor-pointer',
          styles['drop-box'],
        )}
        onClick={onClick}
      >
        <ConditionRender condition={!!icon}>
          <img src={icon} alt="" />
        </ConditionRender>
        <span>{modelName}</span>
        <SvgIcon name="icons-common-caret_down" />
      </div>
    </div>
  );
};

export default ArrangeTitle;
