import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { VariableListProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 变量列表
 */
const VariableList: React.FC<VariableListProps> = ({ list, onClick }) => {
  const [variableList, setVariableList] = useState<BindConfigWithSub[]>([]);

  useEffect(() => {
    // 过滤变量列表（系统变量不显示）
    const _list = list?.filter((info) => !info.systemVariable) || [];
    setVariableList(_list);
  }, [list]);

  return (
    <>
      {variableList?.length > 0 ? (
        <div className={cx('flex', 'items-center', styles.container)}>
          {variableList?.map((item) => (
            <span
              key={item.key}
              className={cx(
                styles.box,
                'radius-6',
                'hover-box',
                'cursor-pointer',
              )}
              onClick={onClick}
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
