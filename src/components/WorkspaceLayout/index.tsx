import { SearchOutlined } from '@ant-design/icons';
import { Input, Space } from 'antd';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface WorkspaceLayoutProps {
  children?: React.ReactNode | null;
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightPrefixSlot?: React.ReactNode;
  rightSuffixSlot?: React.ReactNode;
  inputPlaceholder?: string;
  title?: string;
  defaultSearchValue?: string;
  onSearch?: (value: string) => void;
  // 是否隐藏滚动条
  hideScroll?: boolean;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children = null,
  leftSlot,
  centerSlot,
  rightPrefixSlot,
  rightSuffixSlot,
  inputPlaceholder,
  title,
  defaultSearchValue,
  onSearch,
  hideScroll = false,
}) => {
  // 搜索框
  const [searchValue, setSearchValue] = useState<string>('');

  // 搜索框变化
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  // 搜索框清除
  const handleSearchClear = () => {
    setSearchValue('');
    onSearch?.('');
  };

  // 默认搜索值
  useEffect(() => {
    if (defaultSearchValue) {
      setSearchValue(defaultSearchValue);
    }
  }, [defaultSearchValue]);

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div
        className={cx('flex', 'content-between')}
        style={{ marginBottom: 5 }}
      >
        <div style={{ flex: 1 }}>
          <Space>
            <h3 className={cx(styles.title)}>{title || ''}</h3>
            {/* 左侧区域插槽 */}
            {leftSlot}
          </Space>
        </div>
        <div>
          {/* 中间区域插槽 */}
          {centerSlot}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Space size={10}>
            {/* 右侧前置区域插槽 */}
            {rightPrefixSlot}
            <Input
              rootClassName={cx(styles.input)}
              placeholder={inputPlaceholder || '请输入搜索内容'}
              value={searchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleSearchChange(e.target.value)
              }
              prefix={<SearchOutlined />}
              allowClear
              onClear={handleSearchClear}
            />
            {/* 右侧后置区域插槽 */}
            {rightSuffixSlot}
          </Space>
        </div>
      </div>
      <div
        className={cx(
          styles.content,
          hideScroll ? 'scroll-container-hide' : '',
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default WorkspaceLayout;
