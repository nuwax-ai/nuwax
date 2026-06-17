import SvgIcon from '@/components/base/SvgIcon';
import { t } from '@/services/i18nRuntime';
import { AgentManualComponentInfo } from '@/types/interfaces/agent';
import { ManualComponentItemProps } from '@/types/interfaces/common';
import { EllipsisOutlined } from '@ant-design/icons';
import { useSize } from 'ahooks';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const containsKeyword = (text: string, keyword: string) => {
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  return normalizedText.includes(normalizedKeyword);
};

const isInfoContains = (item: AgentManualComponentInfo, keywords: string[]) => {
  return keywords.some(
    (keyword) =>
      containsKeyword(item.name || '', keyword) ||
      containsKeyword(item.description || '', keyword),
  );
};

const getNetworkKeywords = () => [
  t('PC.Components.ChatInputHomeManualComponentItem.keywordNetwork'),
  t('PC.Components.ChatInputHomeManualComponentItem.keywordSearch'),
  'network',
  'search',
];

const getThinkingKeywords = () => [
  t('PC.Components.ChatInputHomeManualComponentItem.keywordReasoning'),
  t('PC.Components.ChatInputHomeManualComponentItem.keywordThinking'),
  'reasoning',
  'thinking',
];

const getIcon = (_item: AgentManualComponentInfo) => {
  if (_item.type === 'Plugin' && isInfoContains(_item, getNetworkKeywords())) {
    return 'icons-chat-network';
  }
  if (_item.type === 'Model' || isInfoContains(_item, getThinkingKeywords())) {
    return 'icons-chat-deep_thinking';
  }
  return _item.icon;
};

const isShowIcon = (name: string) => {
  return (
    containsKeyword(
      name,
      t('PC.Components.ChatInputHomeManualComponentItem.keywordThinking'),
    ) ||
    containsKeyword(
      name,
      t('PC.Components.ChatInputHomeManualComponentItem.keywordNetwork'),
    ) ||
    containsKeyword(name, 'thinking') ||
    containsKeyword(name, 'network')
  );
};

/**
 * 手动选择组件
 */
const ManualComponentItem: React.FC<ManualComponentItemProps> = ({
  manualComponents,
  selectedComponentList,
  onSelectComponent,
}) => {
  const normalizeManualComponents = useMemo(() => {
    return manualComponents?.reduce((acc, item) => {
      acc.push({
        ...item,
        icon: getIcon(item),
      });
      return acc;
    }, [] as AgentManualComponentInfo[]);
  }, [manualComponents]);

  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const size = useSize(containerRef);
  const [itemWidths, setItemWidths] = useState<number[]>([]);

  useEffect(() => {
    if (!rulerRef.current) return;
    const children = Array.from(rulerRef.current.children) as HTMLElement[];
    const widths = children
      .slice(0, normalizeManualComponents?.length || 0)
      .map((child) => child.offsetWidth);
    setItemWidths(widths);
  }, [normalizeManualComponents, selectedComponentList]);

  const visibleCount = useMemo(() => {
    if (!size?.width || itemWidths.length === 0) {
      return normalizeManualComponents?.length || 0;
    }
    const containerWidth = size.width;
    const gap = 8; // @marginXs is approx 8px
    const moreIconWidth = 32;

    const totalWidth =
      itemWidths.reduce((a, b) => a + b, 0) +
      Math.max(0, itemWidths.length - 1) * gap;

    if (totalWidth <= containerWidth) {
      return itemWidths.length;
    }

    let currentWidth = 0;
    let count = 0;
    for (let i = 0; i < itemWidths.length; i++) {
      const itemW = itemWidths[i];
      const widthWithMore =
        currentWidth + itemW + (i > 0 ? gap : 0) + gap + moreIconWidth;

      if (widthWithMore <= containerWidth) {
        currentWidth += itemW + (i > 0 ? gap : 0);
        count = i + 1;
      } else {
        break;
      }
    }
    return count;
  }, [size?.width, itemWidths, normalizeManualComponents]);

  const visibleItems = normalizeManualComponents?.slice(0, visibleCount) || [];
  const hiddenItems = normalizeManualComponents?.slice(visibleCount) || [];

  const renderItem = (item: AgentManualComponentInfo, index: number) => {
    const isActive = selectedComponentList?.some((c) => c.id === item.id);
    return (
      <span
        key={item.id || index}
        className={cx(
          styles['manual-box'],
          'flex',
          'items-center',
          'cursor-pointer',
          {
            [styles.active]: isActive,
          },
        )}
        onClick={() => onSelectComponent?.(item)}
      >
        {isShowIcon(item.name) && (
          <SvgIcon
            className={cx(styles['svg-icon'])}
            name={item.icon}
            style={{
              marginRight: 5,
              width: 12,
              height: 12,
              borderRadius: 4,
              fontSize: 14,
            }}
          />
        )}
        {item.name}
      </span>
    );
  };

  return (
    <div
      className={cx('flex-1', styles['chat-input-manual-component-wrapper'])}
      ref={containerRef}
    >
      <div className={cx('flex', 'items-center', styles['manual-container'])}>
        {visibleItems.map((item, index) => renderItem(item, index))}
        {hiddenItems.length > 0 && (
          <Popover
            placement="bottomLeft"
            content={
              <div
                className={cx(
                  'flex',
                  'items-center',
                  styles['manual-container'],
                  styles['more-popover-content'],
                )}
              >
                {hiddenItems.map((item, index) => renderItem(item, index))}
              </div>
            }
          >
            <span
              className={cx(
                styles['manual-box'],
                'flex',
                'items-center',
                'justify-center',
                'cursor-pointer',
                styles['more-btn'],
              )}
            >
              <EllipsisOutlined />
              {/* 增加隐藏空文本以维持同普通按钮一致的 Line-height 高度 */}
              <span className={styles['invisible-height-placeholder']}>字</span>
            </span>
          </Popover>
        )}
      </div>

      {/* 用于计算宽度的隐藏标尺 */}
      <div
        ref={rulerRef}
        className={cx(
          'flex',
          'items-center',
          styles['manual-container'],
          'absolute',
          styles['invisible-ruler'],
        )}
      >
        {normalizeManualComponents?.map((item, index) =>
          renderItem(item, index),
        )}
      </div>
    </div>
  );
};

export default ManualComponentItem;
