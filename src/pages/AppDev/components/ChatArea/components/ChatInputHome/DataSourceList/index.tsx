import HoverScrollbar from '@/components/base/HoverScrollbar';
import { DataResource } from '@/types/interfaces/dataResource';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 手动选择组件属性
export interface DataSourceListProps {
  // 数据源列表
  dataSourceList?: DataResource[];
  // 切换数据源选择状态
  onToggleSelectDataSource?: (dataSource: DataResource) => void;
}

/**
 * 手动选择数据资源
 */
const DataSourceList: React.FC<DataSourceListProps> = ({
  dataSourceList,
  onToggleSelectDataSource,
}) => {
  return (
    <div className={cx('flex-1')}>
      <HoverScrollbar bodyWidth="100%" height="40px" style={{ marginTop: 3 }}>
        <div className={cx('flex', 'items-center', styles['manual-container'])}>
          {dataSourceList?.map((item, index) => {
            return (
              <span
                key={index}
                className={cx(
                  styles['manual-box'],
                  'flex',
                  'items-center',
                  'cursor-pointer',
                  {
                    [styles.active]: item.isSelected,
                  },
                )}
                onClick={() => onToggleSelectDataSource?.(item)}
              >
                {item.name}
              </span>
            );
          })}
        </div>
      </HoverScrollbar>
    </div>
  );
};

export default DataSourceList;
