import ConditionRender from '@/components/ConditionRender';
import { CardProps } from '@/types/interfaces/cardInfo';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片一
 */
const CardOne: React.FC<CardProps> = ({
  className,
  title,
  content,
  image,
  onClick,
}) => {
  return (
    <div
      className={cx(styles.container, 'flex', 'cursor-pointer', className)}
      onClick={onClick}
    >
      <ConditionRender condition={image}>
        <img className={'radius-6'} src={image} alt="" />
      </ConditionRender>
      <div className={cx(styles.box, 'flex-1')}>
        <h3 className={'text-ellipsis-2'}>{title}</h3>
        <p className={'text-ellipsis-2'}>{content}</p>
      </div>
    </div>
  );
};

export default CardOne;
