import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface WorkspaceSearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
}
const WorkspaceSearch: React.FC<WorkspaceSearchProps> = ({
  placeholder = '请输入搜索内容',
  value = '',
  onChange = () => {},
  onClear = () => {},
}) => {
  return (
    <Input
      rootClassName={cx(styles.input)}
      placeholder={placeholder}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
      prefix={<SearchOutlined />}
      allowClear
      onClear={onClear}
    />
  );
};

export default WorkspaceSearch;
