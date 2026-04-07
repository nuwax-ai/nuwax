import HoverScrollbar from '@/components/base/HoverScrollbar';
import SvgIcon from '@/components/base/SvgIcon';
import { t } from '@/services/i18nRuntime';
import { AgentManualComponentInfo } from '@/types/interfaces/agent';
import { ManualComponentItemProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React, { useMemo } from 'react';
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
  return (
    <div className={cx('flex-1')}>
      <HoverScrollbar bodyWidth="100%" height="40px" style={{ marginTop: 3 }}>
        <div className={cx('flex', 'items-center', styles['manual-container'])}>
          {normalizeManualComponents?.map((item, index) => {
            return (
              <span
                key={index}
                className={cx(
                  styles['manual-box'],
                  'flex',
                  'items-center',
                  'cursor-pointer',
                  {
                    [styles.active]: selectedComponentList?.some(
                      (c) => c.id === item.id,
                    ),
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
          })}
        </div>
      </HoverScrollbar>
    </div>
  );
};

export default ManualComponentItem;
