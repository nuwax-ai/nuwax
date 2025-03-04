import type { VariableListProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 变量列表
 */
const VariableList: React.FC<VariableListProps> = ({ list }) => {
  return (
    <>
      {list?.length > 0 ? (
        <div className={cx('flex', 'items-center', styles.container)}>
          {list?.map((item) => (
            <span
              className={cx(
                styles.box,
                'radius-6',
                'hover-box',
                'cursor-pointer',
              )}
              key={item.id}
            >
              {item.name}
            </span>
          ))}
        </div>
      ) : (
        <p>用于保存用户个人信息，让智能体记住用户的特征，使回复更加个性化。</p>
      )}
    </>
  );
};

export default VariableList;
