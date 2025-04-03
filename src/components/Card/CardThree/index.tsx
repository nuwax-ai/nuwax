import ConditionRender from '@/components/ConditionRender';
import { CardProps } from '@/types/interfaces/cardInfo';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片三
 */
const CardThree: React.FC<CardProps> = ({
  className,
  title,
  content,
  image,
  onClick,
}) => {
  return (
    <div
      className={cx(styles.container, 'cursor-pointer', className)}
      onClick={onClick}
    >
      <h3>{title}</h3>
      <ConditionRender condition={image}>
        <img className={'radius-6'} src={image} alt="" />
      </ConditionRender>
      <p className={'text-ellipsis-2'}>{content}</p>
    </div>
  );
};

export default CardThree;
