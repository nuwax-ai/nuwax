import HoverScrollbar from '@/components/base/HoverScrollbar';
import SvgIcon from '@/components/base/SvgIcon';
import { AgentManualComponentInfo } from '@/types/interfaces/agent';
import { ManualComponentItemProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);
const isInfoContains = (item: AgentManualComponentInfo, keywords: string[]) => {
  return keywords.some(
    (keyword) =>
      item.name.includes(keyword) || item.description.includes(keyword),
  );
};

const getIcon = (_item: AgentManualComponentInfo) => {
  if (_item.type === 'Plugin' && isInfoContains(_item, ['联网', '搜索'])) {
    return 'icons-chat-network';
  }
  if (_item.type === 'Model' || isInfoContains(_item, ['推理', '思考'])) {
    return 'icons-chat-deep_thinking';
  }
  return _item.icon;
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
      <HoverScrollbar bodyWidth="100%" height="50px">
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
                <SvgIcon
                  name={item.icon}
                  style={{
                    marginRight: 8,
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                  }}
                />
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
