import ConditionRender from '@/components/ConditionRender';
import type { CardProps } from '@/types/interfaces/cardInfo';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片二
 */
const CardTwo: React.FC<CardProps> = ({
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
        'flex-col',
        'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <h3>{title}</h3>
      <div className={'flex'}>
        <p className={'flex-1 text-ellipsis-2'}>{content}</p>
        <ConditionRender condition={image}>
          <img className={'radius-6'} src={image} alt="" />
        </ConditionRender>
      </div>
    </div>
  );
};

export default CardTwo;
