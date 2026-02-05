import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ResourceListProps {
  /** 资源列表数据 */
  list: SquarePublishedItemInfo[];
  /** 已选中的资源ID列表 */
  selectedIds: number[];
  /** 切换选中状态的回调函数 */
  onToggle: (targetId: number) => void;
}

/**
 * 资源列表组件
 * 用于渲染智能体或应用页面列表，支持选择功能
 */
const ResourceList: React.FC<ResourceListProps> = ({
  list,
  selectedIds,
  onToggle,
}) => {
  return (
    <div className={cx(styles.listSection)}>
      {list.map((item) => {
        const isSelected = selectedIds.includes(item.targetId);
        return (
          <div
            key={item.id}
            className={cx(styles.listItem, 'flex', 'items-center')}
          >
            <div className={cx(styles.itemIcon)}>
              {item.icon ? (
                <img
                  src={item.icon}
                  alt="icon"
                  className={cx(styles.iconImg)}
                />
              ) : (
                <div className={cx(styles.iconPlaceholder)} />
              )}
            </div>
            <div className={cx(styles.itemMain, 'flex-1')}>
              <div className={cx(styles.itemTitle, 'text-ellipsis')}>
                {item.name}
              </div>
              <div className={cx(styles.itemDesc, 'text-ellipsis-2')}>
                {item.description || '暂无描述'}
              </div>
            </div>
            <div className={cx(styles.itemExtra)}>
              <Button
                type={isSelected ? 'primary' : 'default'}
                size="small"
                onClick={() => onToggle(item.targetId)}
              >
                {isSelected ? '已添加' : '添加'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResourceList;
