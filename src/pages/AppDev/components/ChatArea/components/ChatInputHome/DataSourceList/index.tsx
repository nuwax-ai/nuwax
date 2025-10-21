import HoverScrollbar from '@/components/base/HoverScrollbar';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 手动选择组件属性
export interface DataSourceListProps {
  // 数据源列表
  dataSourceList?: any[];
  selectedDataSourceList?: any[];
  onSelectDataSource?: (dataSource: any) => void;
}

/**
 * 手动选择数据资源
 */
const DataSourceList: React.FC<DataSourceListProps> = ({
  dataSourceList,
  selectedDataSourceList,
  onSelectDataSource,
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
                    [styles.active]: selectedDataSourceList?.some(
                      (c) => c.id === item.id,
                    ),
                  },
                )}
                onClick={() => onSelectDataSource?.(item)}
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
