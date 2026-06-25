import { dict } from '@/services/i18nRuntime';
import type { HookConfig } from '@/types/interfaces/agent';
import type { HookListProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * Hook 列表（折叠面板内展示）
 */
const HookList: React.FC<HookListProps> = ({
  textClassName,
  list,
  onClick,
}) => {
  const hooks = list?.filter((item) => item.name) ?? [];

  if (hooks.length === 0) {
    return (
      <p className={cx(textClassName)}>
        {dict('PC.Components.HookList.description')}
      </p>
    );
  }

  return (
    <div className={cx('flex', 'items-center', styles.container)}>
      {hooks.map((item: HookConfig, index) => (
        <span
          key={`${item.name}-${item.event}-${index}`}
          className={cx(styles.box, 'radius-6', 'hover-box', 'cursor-pointer')}
          onClick={onClick}
        >
          {item.name}
        </span>
      ))}
    </div>
  );
};

export default HookList;
