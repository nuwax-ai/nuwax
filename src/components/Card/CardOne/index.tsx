import ConditionRender from '@/components/ConditionRender';
import { CardChildProps } from '@/types/interfaces/cardInfo';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片一
 */
const CardOne: React.FC<CardChildProps> = ({
  className,
  title,
  content,
  image,
  onClick,
}) => {
  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'cursor-pointer',
        'items-center',
        className,
      )}
      onClick={onClick}
    >
      <ConditionRender condition={image}>
        <img className={'radius-6'} src={image} alt="" />
      </ConditionRender>
      <div className={cx(styles.box, 'flex-1', 'overflow-hide')}>
        <h3 className={'text-ellipsis'}>{title}</h3>
        <p className={'text-ellipsis-2'}>{content}</p>
      </div>
    </div>
  );
};

export default CardOne;
