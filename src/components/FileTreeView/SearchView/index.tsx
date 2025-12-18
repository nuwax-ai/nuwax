import { flattenFiles } from '@/pages/AppDev/components/ChatArea/components/MentionSelector/utils';
import { FileNode } from '@/types/interfaces/appDev';
import { getFileIcon } from '@/utils/fileTree';
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SearchViewProps {
  files: FileNode[];
  onFileSelect?: (fileId: string) => void;
}

/**
 * 搜索视图组件
 * 提供文件搜索功能和项目根目录显示
 */
const SearchView: React.FC<SearchViewProps> = ({ files, onFileSelect }) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * 扁平化并过滤文件列表
   */
  const filteredFiles = useMemo(() => {
    if (!searchValue.trim()) {
      return [];
    }
    return flattenFiles(files, searchValue);
  }, [files, searchValue]);

  /**
   * 处理搜索输入变化
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setIsDropdownVisible(value.trim().length > 0);
    setSelectedIndex(0);
  };

  /**
   * 处理文件选择
   */
  const handleFileClick = (file: FileNode) => {
    if (onFileSelect) {
      onFileSelect(file.id);
    }
    setSearchValue('');
    setIsDropdownVisible(false);
  };

  /**
   * 处理键盘导航
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownVisible || filteredFiles.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredFiles.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          handleFileClick(filteredFiles[selectedIndex]);
        }
        break;
      case 'Escape':
        setSearchValue('');
        setIsDropdownVisible(false);
        break;
    }
  };

  /**
   * 获取文件路径（去掉文件名）
   */
  const getFileDirPath = (filePath: string): string => {
    const parts = filePath.split('/');
    return parts.slice(0, -1).join('/');
  };

  /**
   * 点击外部关闭下拉列表
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };

    if (isDropdownVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownVisible]);

  /**
   * 滚动到选中项
   */
  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const selectedElement = dropdownRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={cx(styles['search-view'])} ref={searchContainerRef}>
      {/* 搜索栏 */}
      <div className={cx(styles['search-bar'])}>
        <Input
          placeholder="搜索文件..."
          prefix={<SearchOutlined className={cx(styles['search-icon'])} />}
          value={searchValue}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchValue.trim().length > 0) {
              setIsDropdownVisible(true);
            }
          }}
        />
      </div>

      {/* 搜索结果下拉列表 */}
      {isDropdownVisible && filteredFiles.length > 0 && (
        <div className={cx(styles['search-dropdown'])} ref={dropdownRef}>
          {filteredFiles.map((file: FileNode, index: number) => {
            const isSelected = index === selectedIndex;
            const fileDirPath = getFileDirPath(file.path || file.id);

            return (
              <div
                key={file.id}
                className={cx(styles['search-item'], {
                  [styles['search-item-selected']]: isSelected,
                })}
                onClick={() => handleFileClick(file)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {/* 文件图标 */}
                <div className={cx(styles['file-icon'])}>
                  {getFileIcon(file.name)}
                </div>

                {/* 文件信息 */}
                <div className={cx(styles['file-info'])}>
                  <div className={cx(styles['file-name'])}>{file.name}</div>
                  <div className={cx(styles['file-path'])}>{fileDirPath}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchView;
