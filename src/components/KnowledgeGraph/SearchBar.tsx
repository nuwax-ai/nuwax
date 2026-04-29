/**
 * 搜索栏组件
 */
import { SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import React, { useState } from 'react';
import styles from './SearchBar.less';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClear }) => {
  const [keyword, setKeyword] = useState('');

  const handleSearch = () => {
    if (keyword.trim()) {
      onSearch(keyword.trim());
    } else {
      onClear();
    }
  };

  const handleClear = () => {
    setKeyword('');
    onClear();
  };

  return (
    <div className={styles.searchBar}>
      <Input
        placeholder="搜索对象或内容..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onPressEnter={handleSearch}
        className={styles.input}
        allowClear
        onClear={handleClear}
      />
      <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
        查询
      </Button>
    </div>
  );
};

export default SearchBar;
