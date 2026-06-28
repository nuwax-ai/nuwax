import type { DisplayRecommendInfo } from '@/types/interfaces/displayRecommend';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ChatBoxRecommendNavProps {
  items: DisplayRecommendInfo[];
  selectedId?: number;
  onSelect: (item: DisplayRecommendInfo) => void;
}

const ChatBoxRecommendNav: React.FC<ChatBoxRecommendNavProps> = ({
  items,
  selectedId,
  onSelect,
}) => {
  if (!items.length) {
    return null;
  }

  return (
    <div className={cx(styles['recommend-nav'])}>
      {items.map((item) => {
        const active = selectedId === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className={cx(styles['recommend-item'], {
              [styles.active]: active,
            })}
            title={item.label}
            aria-pressed={active}
            onClick={() => onSelect(item)}
          >
            {item.icon && (
              <img
                className={cx(styles.icon)}
                src={item.icon}
                alt=""
                aria-hidden="true"
              />
            )}
            <span className={cx(styles.label)}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ChatBoxRecommendNav;
