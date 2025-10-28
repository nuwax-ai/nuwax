import ConditionRender from '@/components/ConditionRender';
import { CardChildProps } from '@/types/interfaces/cardInfo';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片四
 */
const CardFour: React.FC<CardChildProps> = ({
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
      <h3 className={'text-ellipsis-2'}>{title}</h3>
      <ConditionRender condition={image}>
        <img className={'radius-6'} src={image} alt="" />
      </ConditionRender>
      <p className={'text-ellipsis-2'}>{content}</p>
    </div>
  );
};

export default CardFour;
