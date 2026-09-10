import { t } from '@/services/i18nRuntime';
import { FileTextOutlined } from '@ant-design/icons';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import styles from './index.less';
import type {
  MentionItem,
  MentionPopupHandle,
  MentionPopupProps,
  SlashItem,
} from './types';

type Item = MentionItem | SlashItem;
interface Props extends Omit<MentionPopupProps, 'onSelect'> {
  items: Item[];
  onSelect: (item: Item) => void;
  loading: boolean;
  error?: boolean;
  header?: React.ReactNode;
  resetKey?: string;
  onPreviousTab?: () => void;
  onNextTab?: () => void;
  onLoadMore?: () => void;
  onSearchChange?: (text: string) => void;
}

/** 文件和命令共用定位、列表及键盘行为，业务取数留在外层。 */
const PopupList = React.forwardRef<MentionPopupHandle, Props>(
  (
    {
      visible,
      position,
      items,
      onSelect,
      onClose,
      loading,
      error,
      header,
      resetKey,
      onPreviousTab,
      onNextTab,
      onLoadMore,
      onHeightChange,
      maxHeight,
      showSearchInput,
      searchText,
      onSearchChange,
      enableSubscription,
    },
    ref,
  ) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const pendingIndex = useRef<number | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
      setSelectedIndex(0);
      pendingIndex.current = null;
      const list = rootRef.current?.querySelector('[role="listbox"]');
      if (list) list.scrollTop = 0;
    }, [searchText, resetKey, visible]);
    useEffect(() => {
      if (
        pendingIndex.current !== null &&
        items.length > pendingIndex.current
      ) {
        setSelectedIndex(pendingIndex.current);
        pendingIndex.current = null;
      } else {
        setSelectedIndex((index) =>
          Math.min(index, Math.max(0, items.length - 1)),
        );
      }
    }, [items.length]);
    useEffect(() => {
      if (visible && showSearchInput) inputRef.current?.focus();
    }, [visible, showSearchInput]);
    useEffect(() => {
      const el = rootRef.current;
      if (!visible || !el || !onHeightChange) return;
      const report = () => onHeightChange(el.offsetHeight);
      report();
      const observer = new ResizeObserver(report);
      observer.observe(el);
      return () => observer.disconnect();
    }, [visible, onHeightChange]);
    useEffect(() => {
      rootRef.current
        ?.querySelector('[aria-selected="true"]')
        ?.scrollIntoView?.({ block: 'nearest' });
    }, [selectedIndex]);
    const up = () => setSelectedIndex((index) => Math.max(0, index - 1));
    const down = () => {
      if (selectedIndex >= items.length - 1 && onLoadMore) {
        pendingIndex.current = items.length;
        onLoadMore();
        return;
      }
      setSelectedIndex((index) =>
        Math.min(index + 1, Math.max(0, items.length - 1)),
      );
    };
    const select = () => {
      if (items[selectedIndex]) onSelect(items[selectedIndex]);
    };
    useImperativeHandle(ref, () => ({
      handleArrowUp: up,
      handleArrowDown: down,
      handleArrowLeft: () => onPreviousTab?.(),
      handleArrowRight: () => onNextTab?.(),
      handleSelectCurrentItem: select,
      resetSelectedIndex: () => setSelectedIndex(0),
    }));
    if (!visible) return null;
    return (
      <div
        ref={rootRef}
        data-mention-popup
        className={styles['mention-popup']}
        style={{
          position: 'fixed',
          left: position.left,
          ...(position.bottom !== undefined
            ? { bottom: position.bottom }
            : { top: position.top }),
          maxHeight,
        }}
        onMouseDown={(e) => {
          if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          const actions: Record<string, (() => void) | undefined> = {
            ArrowUp: up,
            ArrowDown: down,
            Enter: select,
            Escape: onClose,
            ArrowLeft: onPreviousTab,
            ArrowRight: onNextTab,
          };
          // 内置搜索框保留左右移动光标。
          if (
            e.target instanceof HTMLInputElement &&
            ['ArrowLeft', 'ArrowRight'].includes(e.key)
          )
            return;
          if (actions[e.key]) {
            e.preventDefault();
            e.stopPropagation();
            actions[e.key]?.();
          }
        }}
      >
        {showSearchInput && (
          <div className={styles['mention-search-wrap']}>
            <input
              ref={inputRef}
              value={searchText ?? ''}
              aria-label={t('PC.Components.ChatInputCommands.search')}
              placeholder={t('PC.Components.ChatInputCommands.search')}
              className={styles['mention-search-input']}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        )}
        {header}
        <div
          role="listbox"
          className={styles['mention-list']}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (
              el.scrollHeight - el.scrollTop - el.clientHeight < 48 &&
              !loading
            )
              onLoadMore?.();
          }}
        >
          {items.map((item, index) => (
            <div
              role="option"
              aria-selected={index === selectedIndex}
              key={`${item.kind ?? 'skill'}:${
                item.kind === 'file' ? item.relativePath : item.targetId
              }`}
              className={`${styles['mention-item']} ${
                item.kind === 'file' ? styles['mention-item-file'] : ''
              } ${index === selectedIndex ? styles.selected : ''}`}
              onMouseMove={() => setSelectedIndex(index)}
              onClick={() => onSelect(item)}
            >
              {item.kind === 'file' ? (
                /* 文件项：单行紧凑布局，图标不带背景容器 */
                <FileTextOutlined className={styles['mention-file-icon']} />
              ) : (
                <span className={styles['mention-item-icon']}>
                  {item.icon ? <img src={item.icon} alt="" /> : '/'}
                </span>
              )}
              <div className={styles['mention-item-content']}>
                {item.kind === 'file' ? (
                  <div
                    className={`${styles['mention-item-inline']} flex items-center`}
                  >
                    <span
                      className={`${styles['mention-item-name']} text-ellipsis`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`${styles['mention-item-path']} text-ellipsis`}
                      title={item.relativePath}
                    >
                      {item.relativePath}
                    </span>
                  </div>
                ) : (
                  <>
                    <div
                      className={`${styles['mention-item-name']} text-ellipsis`}
                    >
                      {item.name}
                    </div>
                    <div
                      className={`${styles['mention-item-desc']} text-ellipsis`}
                      title={item.description}
                    >
                      {item.description}
                    </div>
                  </>
                )}
              </div>
              {enableSubscription && item.paymentRequired && (
                <span className={styles['mention-item-tag']}>
                  {t(
                    item.subscribed
                      ? 'PC.Pages.Square.SingleAgent.subscribed'
                      : 'PC.Pages.Square.SingleAgent.paid',
                  )}
                </span>
              )}
            </div>
          ))}
          {(loading || error || !items.length) && (
            <div className={styles['mention-empty']} role="status">
              {t(
                loading
                  ? 'PC.Components.ChatInputHomeMentionPopup.loading'
                  : error
                  ? 'PC.Components.ChatInputCommands.loadFailed'
                  : 'PC.Components.ChatInputHomeMentionPopup.emptyNotFound',
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);
export default PopupList;
