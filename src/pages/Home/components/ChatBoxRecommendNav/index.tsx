import { dict } from '@/services/i18nRuntime';
import type { DisplayRecommendInfo } from '@/types/interfaces/displayRecommend';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const listRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const updateEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setEdges({
      left: list.scrollLeft > 1,
      right: list.scrollWidth - list.clientWidth - list.scrollLeft > 1,
    });
  }, []);
  const itemKey = items.map((item) => item.id).join(',');

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollLeft = 0;
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(list);
    Array.from(list.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [itemKey, updateEdges]);

  const scroll = (direction: number) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollBy({
      left: direction * Math.max(list.clientWidth * 0.75, 120),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  };

  if (!items.length) {
    return null;
  }

  return (
    <div
      className={cx(styles['recommend-nav'], {
        [styles['has-left']]: edges.left,
        [styles['has-right']]: edges.right,
      })}
    >
      <button
        type="button"
        className={cx(styles.arrow, styles['arrow-left'])}
        aria-label={dict('PC.Pages.Home.previousTypes')}
        disabled={!edges.left}
        onClick={() => scroll(-1)}
      >
        <LeftOutlined />
      </button>
      <div
        ref={listRef}
        className={styles['recommend-list']}
        onScroll={updateEdges}
      >
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
      <button
        type="button"
        className={cx(styles.arrow, styles['arrow-right'])}
        aria-label={dict('PC.Pages.Home.moreTypes')}
        disabled={!edges.right}
        onClick={() => scroll(1)}
      >
        <RightOutlined />
      </button>
    </div>
  );
};

export default ChatBoxRecommendNav;
