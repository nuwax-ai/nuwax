import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiSearchFiles } from '@/services/vncDesktop';
import { FileNode } from '@/types/interfaces/appDev';
import { flattenFiles, getFileIcon } from '@/utils/fileTree';
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FileTreeContainerProps } from '../../types/file-tree-git-source';
import styles from './index.less';
import { mapSearchFileToNode } from './mapSearchFileToNode';

const cx = classNames.bind(styles);

/** 输入停顿后再请求，避免每个字符都打搜索接口 */
const REMOTE_SEARCH_DEBOUNCE_MS = 300;

interface SearchViewProps {
  className?: string;
  files: FileNode[];
  /** 传入后按会话搜索服务端文件；不传则只过滤已加载的树 */
  remoteFileSearch?: FileTreeContainerProps['remoteFileSearch'];
  /** 选中搜索结果；传入完整节点，便于打开尚未懒加载进树的文件 */
  onFileSelect?: (file: FileNode) => void;
}

/**
 * 搜索视图组件
 * 提供文件搜索功能和项目根目录显示
 */
const SearchView: React.FC<SearchViewProps> = ({
  className,
  files,
  remoteFileSearch,
  onFileSelect,
}) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  /** 服务端搜索命中的文件（已转成文件树节点） */
  const [remoteFiles, setRemoteFiles] = useState<FileNode[]>([]);
  /** 服务端搜索是否进行中；进行中时不展示「暂无匹配」 */
  const [searching, setSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  /**
   * 搜索请求序号。关键词变化或清空时递增，丢弃过期响应，
   * 避免慢请求把新一次搜索的结果盖掉。
   */
  const requestSeqRef = useRef(0);
  /** 已加载文件树的最新引用，接口失败回退本地过滤时读取，避免把 files 放进请求依赖 */
  const filesRef = useRef(files);
  filesRef.current = files;
  /** 服务端搜索配置的最新引用，请求闭包里读它，树刷新不会重新发请求 */
  const remoteSearchRef = useRef(remoteFileSearch);
  remoteSearchRef.current = remoteFileSearch;
  /** 拆成基本类型作为 effect 依赖：会话、节点 id 规则或数据源变了才重搜 */
  const remoteCId = remoteFileSearch?.cId;
  const remoteToNodeId = remoteFileSearch?.toNodeId;
  const remoteDataSourceId = remoteFileSearch?.dataSourceId;

  /**
   * 未接服务端搜索时，只过滤当前已加载的文件树
   */
  const localFiles = useMemo(() => {
    if (remoteFileSearch || !searchValue.trim()) {
      return [];
    }
    return flattenFiles(files, searchValue);
  }, [files, remoteFileSearch, searchValue]);

  /** 下拉列表实际展示的结果：有服务端搜索用接口结果，否则用本地过滤 */
  const filteredFiles = remoteFileSearch ? remoteFiles : localFiles;

  /**
   * 会话文件树是按目录懒加载的，前端过滤看不到未展开的文件，改走搜索接口。
   * 接口失败时退回已加载树的本地过滤。
   */
  useEffect(() => {
    const search = remoteSearchRef.current;
    // 未配置服务端搜索（如应用开发页）时不请求
    if (!search) {
      return;
    }
    const kw = searchValue.trim();
    // 空关键词或会话 id 无效：作废在途请求并清空结果
    if (!kw || !Number.isFinite(search.cId)) {
      requestSeqRef.current += 1;
      setRemoteFiles([]);
      setSearching(false);
      return;
    }

    // 本次请求的序号，响应对不上时说明已有更新的搜索
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;
    setSearching(true);
    setRemoteFiles([]);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await apiSearchFiles({
            cId: search.cId,
            kw,
          });
          if (seq !== requestSeqRef.current) {
            return;
          }
          if (result.code !== SUCCESS_CODE) {
            setRemoteFiles(flattenFiles(filesRef.current, kw));
            return;
          }
          setRemoteFiles(
            (result.data?.files || []).map((file) =>
              mapSearchFileToNode(file, search),
            ),
          );
        } catch (error) {
          console.error('搜索文件失败，回退到已加载文件过滤', error);
          if (seq !== requestSeqRef.current) {
            return;
          }
          setRemoteFiles(flattenFiles(filesRef.current, kw));
        } finally {
          if (seq === requestSeqRef.current) {
            setSearching(false);
          }
        }
      })();
    }, REMOTE_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [remoteCId, remoteDataSourceId, remoteToNodeId, searchValue]);

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
      onFileSelect(file);
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
    <div
      className={cx(styles['search-view'], 'relative', className)}
      ref={searchContainerRef}
    >
      {/* 搜索栏 */}
      <div className={cx(styles['search-bar'])}>
        <Input
          placeholder={dict('PC.Components.SearchView.searchPlaceholder')}
          className={cx(styles['search-input'])}
          prefix={<SearchOutlined className={cx(styles['search-icon'])} />}
          value={searchValue}
          allowClear
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
      {isDropdownVisible && (
        <div className={cx(styles['search-dropdown'])} ref={dropdownRef}>
          {filteredFiles.length > 0 || searching ? (
            // 有搜索结果时显示文件列表
            filteredFiles.map((file: FileNode, index: number) => {
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
            })
          ) : (
            // 没有搜索结果时显示提示
            <div className={cx(styles['search-empty'])}>
              <div className={cx(styles['empty-text'])}>
                {dict('PC.Components.SearchView.noMatchingFiles')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchView;
