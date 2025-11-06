/**
 * MentionSelector 组件
 * 用于显示文件列表和数据源列表的下拉选择器
 * 支持多层级视图：主视图、文件列表、数据源分类、数据源列表
 */

import type { FileNode } from '@/types/interfaces/appDev';
import type { DataResource } from '@/types/interfaces/dataResource';
import {
  DatabaseOutlined,
  FileOutlined,
  FolderOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Empty } from 'antd';
import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import styles from './index.less';
import type {
  MentionSelectorHandle,
  MentionSelectorProps,
  ViewType,
} from './types';
import {
  flattenFiles,
  flattenFolders,
  getDataSourceTypeName,
  getDefaultDescription,
  getRecentDataSources,
  getRecentFiles,
  groupDataSourcesByType,
  saveRecentDataSource,
  saveRecentFile,
} from './utils';

/**
 * MentionSelector 组件
 */
const MentionSelector = React.forwardRef<
  MentionSelectorHandle,
  MentionSelectorProps
>(
  (
    {
      visible,
      position,
      searchText,
      files,
      dataSources,
      onSelectFile,
      onSelectDataSource,
      selectedIndex,
      containerRef,
      onSelectedIndexChange,
    },
    ref,
  ) => {
    // 视图状态：main-主视图, files-文件列表, datasources-数据源分类, datasource-list-数据源列表, datasource-category-数据源分类详情
    const [viewType, setViewType] = useState<ViewType>('main');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // 当 visible 变为 false 时，重置视图状态
    useEffect(() => {
      if (!visible) {
        setViewType('main');
        setSelectedCategory('');
        onSelectedIndexChange?.(0);
      }
    }, [visible, onSelectedIndexChange]);

    // 获取最近使用的文件和数据源
    const recentFiles = useMemo(() => getRecentFiles(), []);
    const recentDataSources = useMemo(() => getRecentDataSources(), []);

    // 扁平化文件列表
    const flattenedFiles = useMemo(() => {
      return flattenFiles(files, searchText);
    }, [files, searchText]);

    // 扁平化目录列表
    const flattenedFolders = useMemo(() => {
      return flattenFolders(files, searchText);
    }, [files, searchText]);

    // 过滤数据源列表
    const filteredDataSources = useMemo(() => {
      if (!searchText) {
        return dataSources;
      }
      const searchLower = searchText.toLowerCase();
      return dataSources.filter(
        (ds) =>
          ds.name.toLowerCase().includes(searchLower) ||
          ds.description?.toLowerCase().includes(searchLower),
      );
    }, [dataSources, searchText]);

    // 按类型分组数据源
    const groupedDataSources = useMemo(() => {
      return groupDataSourcesByType(filteredDataSources);
    }, [filteredDataSources]);

    // 合并最近使用的文件和数据源（最多7个）
    const recentItems = useMemo(() => {
      const items: Array<{
        type: 'file' | 'folder' | 'datasource' | 'action' | 'category';
        id?: string | number;
        name: string;
        path?: string;
        dataSource?: DataResource;
        file?: FileNode;
        key?: string;
        label?: string;
        icon?: React.ReactNode;
        onClick?: () => void;
        description?: string;
        category?: string;
        count?: number;
      }> = [];

      // 添加最近使用的文件（同时从文件和目录列表中查找）
      recentFiles.forEach((item) => {
        const file = flattenedFiles.find((f) => f.id === item.id);
        if (file) {
          items.push({
            type: 'file',
            id: item.id,
            name: item.name,
            path: item.path,
            file,
          });
        } else {
          // 如果在文件列表中没找到，尝试在目录列表中查找
          const folder = flattenedFolders.find((f) => f.id === item.id);
          if (folder) {
            items.push({
              type: 'folder',
              id: item.id,
              name: item.name,
              path: item.path,
              file: folder,
            });
          }
        }
      });

      // 添加最近使用的数据源
      recentDataSources.forEach((item) => {
        const dataSource = dataSources.find((ds) => ds.id === item.id);
        if (dataSource) {
          items.push({
            type: 'datasource',
            id: item.id,
            name: item.name,
            dataSource,
            description: dataSource.description,
          });
        }
      });

      // 如果有最近使用记录，按时间戳排序
      if (items.length > 0) {
        const sortedItems = items.sort((a, b) => {
          const aTime =
            a.type === 'file' || a.type === 'folder'
              ? recentFiles.find((f) => f.id === a.id)?.timestamp || 0
              : recentDataSources.find((ds) => ds.id === a.id)?.timestamp || 0;
          const bTime =
            b.type === 'file' || b.type === 'folder'
              ? recentFiles.find((f) => f.id === b.id)?.timestamp || 0
              : recentDataSources.find((ds) => ds.id === b.id)?.timestamp || 0;
          return bTime - aTime;
        });

        // 如果不满7个，从文件/目录列表中补充
        if (sortedItems.length < 7) {
          const existingIds = new Set(sortedItems.map((item) => item.id));
          const allFiles = flattenFiles(files, '');
          const allFolders = flattenFolders(files, '');

          // 先补充文件
          for (const file of allFiles) {
            if (sortedItems.length >= 7) break;
            if (!existingIds.has(file.id)) {
              sortedItems.push({
                type: 'file',
                id: file.id,
                name: file.name,
                path: file.path,
                file,
              });
              existingIds.add(file.id);
            }
          }

          // 再补充目录
          for (const folder of allFolders) {
            if (sortedItems.length >= 7) break;
            if (!existingIds.has(folder.id)) {
              sortedItems.push({
                type: 'folder',
                id: folder.id,
                name: folder.name,
                path: folder.path,
                file: folder,
              });
              existingIds.add(folder.id);
            }
          }
        }

        return sortedItems.slice(0, 7);
      }

      // 如果没有最近使用记录，显示默认推荐项（从文件和目录列表中取前7个）
      const defaultItems: Array<{
        type: 'file' | 'datasource' | 'folder';
        id: string | number;
        name: string;
        path?: string;
        dataSource?: DataResource;
        file?: FileNode;
        description?: string;
      }> = [];

      // 添加文件列表的前5个（使用原始文件列表，不经过搜索过滤）
      const allFiles = flattenFiles(files, '');
      const allFolders = flattenFolders(files, '');

      // 先添加文件
      if (allFiles.length > 0) {
        allFiles.slice(0, 5).forEach((file) => {
          defaultItems.push({
            type: 'file',
            id: file.id,
            name: file.name,
            path: file.path,
            file,
          });
        });
      }

      // 如果文件不足5个，补充目录
      if (defaultItems.length < 5 && allFolders.length > 0) {
        const remaining = 5 - defaultItems.length;
        allFolders.slice(0, remaining).forEach((folder) => {
          defaultItems.push({
            type: 'folder',
            id: folder.id,
            name: folder.name,
            path: folder.path,
            file: folder,
          });
        });
      }

      // 添加数据列表的第一个（如果有）
      if (dataSources.length > 0) {
        const firstDataSource = dataSources[0];
        defaultItems.push({
          type: 'datasource',
          id: firstDataSource.id,
          name: firstDataSource.name,
          dataSource: firstDataSource,
          description: firstDataSource.description,
        });
      }

      return defaultItems;
    }, [
      recentFiles,
      recentDataSources,
      files,
      dataSources,
      flattenedFiles,
      flattenedFolders,
    ]);

    /**
     * 获取当前视图的可选项列表
     */
    const getCurrentItems = useMemo(() => {
      switch (viewType) {
        case 'main': {
          const mainItems = [
            { type: 'action', key: 'files', label: '文件/目录' },
            { type: 'action', key: 'datasources', label: '数据资源' },
          ];
          return [...recentItems, ...mainItems];
        }
        case 'files':
          // 文件列表视图：先返回文件，再返回目录（与渲染顺序一致）
          return [...flattenedFiles, ...flattenedFolders];
        case 'datasources': {
          const categories = Object.keys(groupedDataSources);
          return categories.map((cat) => ({
            type: 'category',
            category: cat,
            label: getDataSourceTypeName(cat),
            count: groupedDataSources[cat].length,
          }));
        }
        case 'datasource-list':
          return filteredDataSources;
        case 'datasource-category': {
          const categoryDataSources = selectedCategory
            ? groupedDataSources[selectedCategory] || []
            : [];
          return categoryDataSources;
        }
        default:
          return [];
      }
    }, [
      viewType,
      recentItems,
      flattenedFiles,
      flattenedFolders,
      groupedDataSources,
      selectedCategory,
      filteredDataSources,
    ]);

    /**
     * 获取当前视图的最大索引
     */
    const maxIndex = useMemo(() => {
      return Math.max(0, getCurrentItems.length - 1);
    }, [getCurrentItems]);

    /**
     * 处理文件选择（参考 Ant Design Mentions，选择后关闭弹窗）
     */
    const handleFileSelect = (file: FileNode) => {
      saveRecentFile(file);
      onSelectFile(file);
      // 选择后关闭弹窗（由父组件通过 onSelectFile 回调处理）
    };

    /**
     * 处理数据源选择（参考 Ant Design Mentions，选择后关闭弹窗）
     */
    const handleDataSourceSelect = (dataSource: DataResource) => {
      saveRecentDataSource(dataSource);
      onSelectDataSource(dataSource);
      // 选择后关闭弹窗（由父组件通过 onSelectDataSource 回调处理）
    };

    /**
     * 处理最近使用项选择
     */
    const handleRecentItemSelect = (item: (typeof recentItems)[0]) => {
      if (item.type === 'file' && item.file) {
        handleFileSelect(item.file);
      } else if (item.type === 'datasource' && item.dataSource) {
        handleDataSourceSelect(item.dataSource);
      }
    };

    /**
     * 处理文件/目录点击，显示平铺文件列表
     */
    const handleFilesClick = () => {
      setViewType('files');
      onSelectedIndexChange?.(0);
    };

    /**
     * 处理数据源点击，直接显示数据源列表
     * @deprecated 暂时未使用，保留以备后续使用
     */
    const handleDataSourcesClick = () => {
      setViewType('datasource-list');
      onSelectedIndexChange?.(0);
    };

    /**
     * 处理返回主视图
     */
    const handleBackToMain = () => {
      setViewType('main');
      setSelectedCategory('');
      onSelectedIndexChange?.(0);
    };

    /**
     * 处理数据源分类点击
     */
    const handleCategoryClick = (category: string) => {
      setSelectedCategory(category);
      setViewType('datasource-category');
      onSelectedIndexChange?.(0);
    };

    /**
     * 处理当前选中项的选择（用于键盘导航回车确认）
     */
    const handleSelectCurrentItem = () => {
      const currentItems = getCurrentItems;
      const validIndex = Math.min(selectedIndex, currentItems.length - 1);
      if (validIndex < 0 || validIndex >= currentItems.length) {
        return;
      }

      switch (viewType) {
        case 'main': {
          // 主视图：处理最近使用项或操作项
          const currentItem = currentItems[validIndex];
          if (!currentItem) break;

          // 判断是最近使用项还是操作项
          if ('type' in currentItem && currentItem.type === 'action') {
            // 操作项（文件/目录 或 数据资源）
            const actionItem = currentItem as {
              type: 'action';
              key: string;
              label: string;
            };
            if (actionItem.key === 'files') {
              // 文件/目录
              handleFilesClick();
            } else if (actionItem.key === 'datasources') {
              // 数据资源
              handleDataSourcesClick();
            }
          } else if (
            ('type' in currentItem && currentItem.type === 'file') ||
            ('type' in currentItem && currentItem.type === 'folder') ||
            ('type' in currentItem && currentItem.type === 'datasource')
          ) {
            // 最近使用项（文件、目录或数据源）
            handleRecentItemSelect(currentItem as (typeof recentItems)[0]);
          }
          break;
        }
        case 'files': {
          // 文件列表视图：处理文件或目录选择
          // getCurrentItems 已经按顺序返回了 [文件列表, 目录列表]
          const currentItem = currentItems[validIndex];
          if (currentItem && 'id' in currentItem) {
            // 是文件节点（FileNode），直接选择
            handleFileSelect(currentItem as FileNode);
          }
          break;
        }
        case 'datasources': {
          // 数据源分类视图：处理分类点击
          const currentItem = currentItems[validIndex] as
            | {
                type: 'category';
                category: string;
                label: string;
                count: number;
              }
            | undefined;
          if (currentItem && currentItem.type === 'category') {
            handleCategoryClick(currentItem.category);
          }
          break;
        }
        case 'datasource-list': {
          // 数据源列表视图：处理数据源选择
          const currentItem = currentItems[validIndex] as
            | DataResource
            | undefined;
          if (currentItem && 'id' in currentItem && 'name' in currentItem) {
            handleDataSourceSelect(currentItem as DataResource);
          }
          break;
        }
        case 'datasource-category': {
          // 数据源分类详情视图：处理数据源选择
          const currentItem = currentItems[validIndex] as
            | DataResource
            | undefined;
          if (currentItem && 'id' in currentItem && 'name' in currentItem) {
            handleDataSourceSelect(currentItem as DataResource);
          }
          break;
        }
        default:
          break;
      }
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      handleSelectCurrentItem,
    }));

    /**
     * 限制 selectedIndex 在有效范围内，并自动滚动到选中项（参考 Ant Design Mentions）
     */
    useEffect(() => {
      if (selectedIndex > maxIndex) {
        onSelectedIndexChange?.(maxIndex);
      } else {
        // 自动滚动到选中项
        setTimeout(() => {
          const selectedElement = containerRef?.current?.querySelector(
            '[class*="mention-item"][class*="selected"]',
          ) as HTMLElement;
          if (selectedElement) {
            selectedElement.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
        }, 0);
      }
    }, [selectedIndex, maxIndex, onSelectedIndexChange, containerRef]);

    /**
     * 判断是否有真实的最近使用记录（从 localStorage 读取的）
     */
    const hasRealRecentItems = useMemo(() => {
      return recentFiles.length > 0 || recentDataSources.length > 0;
    }, [recentFiles, recentDataSources]);

    // 早期返回必须在所有 hooks 之后
    if (!visible || !position.visible) {
      return null;
    }

    /**
     * 渲染最近使用列表
     */
    const renderRecentItems = () => {
      if (recentItems.length === 0) {
        return null;
      }

      return (
        <>
          <div className={styles['mention-section-title']}>
            {hasRealRecentItems ? '最近使用' : '推荐'}
          </div>
          <div className={styles['mention-list']}>
            {recentItems.map((item, index) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`${styles['mention-item']} ${
                  index === selectedIndex && viewType === 'main'
                    ? styles.selected
                    : ''
                }`}
                onClick={() => handleRecentItemSelect(item)}
              >
                <div className={styles['mention-item-icon']}>
                  {item.type === 'file' ? (
                    <FileOutlined />
                  ) : item.type === 'folder' ? (
                    <FolderOutlined />
                  ) : (
                    <DatabaseOutlined />
                  )}
                </div>
                <div className={styles['mention-item-content']}>
                  <div className={styles['mention-item-title']}>
                    {item.name}
                  </div>
                  {item.type === 'datasource' ? (
                    <div className={styles['mention-item-desc']}>
                      {item.description ||
                        (item.dataSource
                          ? getDefaultDescription(item.dataSource.type)
                          : '数据资源')}
                    </div>
                  ) : item.path ? (
                    <div className={styles['mention-item-desc']}>
                      {item.path}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className={styles['mention-divider']} />
        </>
      );
    };

    /**
     * 渲染主视图
     */
    const renderMainView = () => {
      const mainItems = [
        {
          key: 'files',
          label: '文件/目录',
          icon: <FileOutlined />,
          onClick: handleFilesClick,
          description: '浏览项目文件',
        },
        {
          key: 'datasources',
          label: '数据资源',
          icon: <DatabaseOutlined />,
          onClick: handleDataSourcesClick,
          description: '工作流、插件等',
        },
      ];

      const adjustedIndex = selectedIndex - recentItems.length;

      return (
        <div className={styles['mention-content']}>
          {renderRecentItems()}
          <div className={styles['mention-list']}>
            {mainItems.map((item, index) => (
              <div
                key={item.key}
                className={`${styles['mention-item']} ${
                  index === adjustedIndex && adjustedIndex >= 0
                    ? styles.selected
                    : ''
                }`}
                onClick={item.onClick}
              >
                <div className={styles['mention-item-icon']}>{item.icon}</div>
                <div className={styles['mention-item-content']}>
                  <div className={styles['mention-item-title']}>
                    {item.label}
                  </div>
                  <div className={styles['mention-item-desc']}>
                    {item.description}
                  </div>
                </div>
                <RightOutlined className={styles['mention-item-arrow']} />
              </div>
            ))}
          </div>
        </div>
      );
    };

    /**
     * 渲染文件列表视图（平铺）
     */
    const renderFilesView = () => {
      // 当文件和目录都为空时显示空状态
      if (flattenedFiles.length === 0 && flattenedFolders.length === 0) {
        return (
          <div className={styles['mention-content']}>
            <div className={styles['mention-header']}>
              <span
                className={styles['mention-back']}
                onClick={handleBackToMain}
              >
                ← 返回
              </span>
              <span className={styles['mention-title']}>文件列表</span>
            </div>
            <Empty
              description="未找到匹配的文件或目录"
              className={styles['mention-empty']}
            />
          </div>
        );
      }

      return (
        <div className={styles['mention-content']}>
          <div className={styles['mention-header']}>
            <span className={styles['mention-back']} onClick={handleBackToMain}>
              ← 返回
            </span>
            <span className={styles['mention-title']}>文件列表</span>
          </div>
          <div className={styles['mention-list']}>
            {/* 先渲染文件 */}
            {flattenedFiles.map((file, index) => (
              <div
                key={file.id}
                className={`${styles['mention-item']} ${
                  index === selectedIndex ? styles.selected : ''
                }`}
                onClick={() => handleFileSelect(file)}
              >
                <div className={styles['mention-item-icon']}>
                  <FileOutlined />
                </div>
                <div className={styles['mention-item-content']}>
                  <div className={styles['mention-item-title']}>
                    {file.name}
                  </div>
                  <div className={styles['mention-item-desc']}>{file.path}</div>
                </div>
              </div>
            ))}
            {/* 然后渲染目录 */}
            {flattenedFolders.map((folder, index) => (
              <div
                key={folder.id}
                className={`${styles['mention-item']} ${
                  index + flattenedFiles.length === selectedIndex
                    ? styles.selected
                    : ''
                }`}
                onClick={() => handleFileSelect(folder)}
              >
                <div className={styles['mention-item-icon']}>
                  <FolderOutlined />
                </div>
                <div className={styles['mention-item-content']}>
                  <div className={styles['mention-item-title']}>
                    {folder.name}
                  </div>
                  <div className={styles['mention-item-desc']}>
                    {folder.path}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    /**
     * 渲染数据源分类视图
     */
    const renderDataSourcesView = () => {
      const categories = Object.keys(groupedDataSources);
      if (categories.length === 0) {
        return (
          <div className={styles['mention-content']}>
            <div className={styles['mention-header']}>
              <span
                className={styles['mention-back']}
                onClick={handleBackToMain}
              >
                ← 返回
              </span>
              <span className={styles['mention-title']}>数据资源</span>
            </div>
            <Empty
              description="未找到数据资源"
              className={styles['mention-empty']}
            />
          </div>
        );
      }

      return (
        <div className={styles['mention-content']}>
          <div className={styles['mention-header']}>
            <span className={styles['mention-back']} onClick={handleBackToMain}>
              ← 返回
            </span>
            <span className={styles['mention-title']}>数据资源</span>
          </div>
          <div className={styles['mention-list']}>
            {categories.map((category, index) => {
              const isSelected =
                viewType === 'datasources' && index === selectedIndex;
              return (
                <div
                  key={category}
                  className={`${styles['mention-item']} ${
                    isSelected ? styles.selected : ''
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className={styles['mention-item-icon']}>
                    <DatabaseOutlined />
                  </div>
                  <div className={styles['mention-item-content']}>
                    <div className={styles['mention-item-title']}>
                      {getDataSourceTypeName(category)}
                    </div>
                    <div className={styles['mention-item-desc']}>
                      {groupedDataSources[category].length} 项
                    </div>
                  </div>
                  <RightOutlined className={styles['mention-item-arrow']} />
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    /**
     * 渲染数据源列表视图（直接显示所有数据源）
     */
    const renderDataSourceListView = () => {
      if (filteredDataSources.length === 0) {
        return (
          <div className={styles['mention-content']}>
            <div className={styles['mention-header']}>
              <span
                className={styles['mention-back']}
                onClick={handleBackToMain}
              >
                ← 返回
              </span>
              <span className={styles['mention-title']}>数据资源</span>
            </div>
            <Empty
              description="未找到数据资源"
              className={styles['mention-empty']}
            />
          </div>
        );
      }

      return (
        <div className={styles['mention-content']}>
          <div className={styles['mention-header']}>
            <span className={styles['mention-back']} onClick={handleBackToMain}>
              ← 返回
            </span>
            <span className={styles['mention-title']}>数据资源</span>
          </div>
          <div className={styles['mention-list']}>
            {filteredDataSources.map((ds, index) => (
              <div
                key={ds.id}
                className={`${styles['mention-item']} ${
                  index === selectedIndex ? styles.selected : ''
                }`}
                onClick={() => handleDataSourceSelect(ds)}
              >
                <div className={styles['mention-item-icon']}>
                  <DatabaseOutlined />
                </div>
                <div className={styles['mention-item-content']}>
                  <div className={styles['mention-item-title']}>{ds.name}</div>
                  <div className={styles['mention-item-desc']}>
                    {ds.description || getDefaultDescription(ds.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    /**
     * 渲染数据源分类详情视图
     */
    const renderDataSourceCategoryView = () => {
      const categoryDataSources = selectedCategory
        ? groupedDataSources[selectedCategory] || []
        : [];

      if (categoryDataSources.length === 0) {
        return (
          <div className={styles['mention-content']}>
            <div className={styles['mention-header']}>
              <span
                className={styles['mention-back']}
                onClick={() => setViewType('datasources')}
              >
                ← 返回
              </span>
              <span className={styles['mention-title']}>
                {getDataSourceTypeName(selectedCategory)}
              </span>
            </div>
            <Empty
              description="未找到数据资源"
              className={styles['mention-empty']}
            />
          </div>
        );
      }

      return (
        <div className={styles['mention-content']}>
          <div className={styles['mention-header']}>
            <span
              className={styles['mention-back']}
              onClick={() => setViewType('datasources')}
            >
              ← 返回
            </span>
            <span className={styles['mention-title']}>
              {getDataSourceTypeName(selectedCategory)}
            </span>
          </div>
          <div className={styles['mention-list']}>
            {categoryDataSources.map((ds, index) => (
              <div
                key={ds.id}
                className={`${styles['mention-item']} ${
                  index === selectedIndex ? styles.selected : ''
                }`}
                onClick={() => handleDataSourceSelect(ds)}
              >
                <div className={styles['mention-item-icon']}>
                  <DatabaseOutlined />
                </div>
                <div className={styles['mention-item-content']}>
                  <div className={styles['mention-item-title']}>{ds.name}</div>
                  <div className={styles['mention-item-desc']}>
                    {ds.description || getDefaultDescription(ds.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    /**
     * 根据视图类型渲染内容
     */
    const renderContent = () => {
      switch (viewType) {
        case 'files':
          return renderFilesView();
        case 'datasources':
          return renderDataSourcesView();
        case 'datasource-list':
          return renderDataSourceListView();
        case 'datasource-category':
          return renderDataSourceCategoryView();
        default:
          return renderMainView();
      }
    };

    return (
      <div
        className={styles['mention-selector']}
        style={{
          position: 'fixed',
          left: `${position.left}px`,
          top: `${position.top}px`,
          display: visible && position.visible ? 'block' : 'none',
        }}
        ref={containerRef || undefined}
      >
        {renderContent()}
      </div>
    );
  },
);

MentionSelector.displayName = 'MentionSelector';

export default MentionSelector;
