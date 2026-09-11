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
  // pill 元素索引（id → button），供选中项定位（自动命中场景滚动到可见）
  const itemRefsRef = useRef<Map<number, HTMLButtonElement>>(new Map());
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
  const lastItemKeyRef = useRef<string>('');

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const itemsChanged = lastItemKeyRef.current !== itemKey;
    if (itemsChanged) {
      lastItemKeyRef.current = itemKey;
      list.scrollLeft = 0;
      // 列表重建（切分类/上框命中换列表）后把选中 pill 滚动到居中可见——
      // 必须在 reset 之后执行否则被吞；手动算居中（scrollIntoView 会带动页面纵向滚动）
      const selectedEl =
        selectedId !== undefined
          ? itemRefsRef.current.get(selectedId)
          : undefined;
      if (selectedEl) {
        list.scrollLeft = Math.max(
          0,
          selectedEl.offsetLeft -
            (list.clientWidth - selectedEl.offsetWidth) / 2,
        );
      }
    }
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(list);
    Array.from(list.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [itemKey, selectedId, updateEdges]);

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
              ref={(el) => {
                if (el) {
                  itemRefsRef.current.set(item.id, el);
                } else {
                  itemRefsRef.current.delete(item.id);
                }
              }}
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
