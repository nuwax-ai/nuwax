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
  useCallback,
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
    // 视图状态：main-主视图, search-搜索视图, files-文件列表, datasources-数据源分类, datasource-list-数据源列表, datasource-category-数据源分类详情
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

    // 监听 searchText 变化，自动切换到搜索视图
    useEffect(() => {
      if (!visible) return;

      if (searchText && searchText.trim()) {
        // 当有搜索文本时，如果不是在搜索视图，切换到搜索视图
        // 这样可以确保无论用户在哪个视图，输入搜索文本都会显示搜索结果
        if (viewType !== 'search') {
          setViewType('search');
          onSelectedIndexChange?.(0);
        }
      } else {
        // 当搜索文本为空时，如果当前在搜索视图，返回主视图
        if (viewType === 'search') {
          setViewType('main');
          onSelectedIndexChange?.(0);
        }
      }
    }, [searchText, visible, viewType, onSelectedIndexChange]);

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

    // 合并最近使用的文件和数据源（最多5个）
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

        // 如果不满5个，从文件/目录列表中补充
        if (sortedItems.length < 5) {
          const existingIds = new Set(sortedItems.map((item) => item.id));
          const allFiles = flattenFiles(files, '');
          const allFolders = flattenFolders(files, '');

          // 先补充文件
          for (const file of allFiles) {
            if (sortedItems.length >= 5) break;
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
            if (sortedItems.length >= 5) break;
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

        return sortedItems.slice(0, 5);
      }

      // 如果没有最近使用记录，显示默认推荐项（从文件和目录列表中取前5个）
      const defaultItems: Array<{
        type: 'file' | 'datasource' | 'folder';
        id: string | number;
        name: string;
        path?: string;
        dataSource?: DataResource;
        file?: FileNode;
        description?: string;
      }> = [];

      // 添加文件列表的前4个（使用原始文件列表，不经过搜索过滤）
      const allFiles = flattenFiles(files, '');
      const allFolders = flattenFolders(files, '');

      // 先添加文件
      if (allFiles.length > 0) {
        allFiles.slice(0, 4).forEach((file) => {
          defaultItems.push({
            type: 'file',
            id: file.id,
            name: file.name,
            path: file.path,
            file,
          });
        });
      }

      // 如果文件不足4个，补充目录
      if (defaultItems.length < 4 && allFolders.length > 0) {
        const remaining = 4 - defaultItems.length;
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

      return defaultItems.slice(0, 5);
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
        case 'search': {
          // 搜索视图：合并显示文件、文件夹和数据资源
          const searchItems: Array<
            | { type: 'file'; file: FileNode }
            | { type: 'folder'; file: FileNode }
            | { type: 'datasource'; dataSource: DataResource }
          > = [];

          // 添加文件
          flattenedFiles.forEach((file) => {
            searchItems.push({ type: 'file', file });
          });

          // 添加文件夹
          flattenedFolders.forEach((folder) => {
            searchItems.push({ type: 'folder', file: folder });
          });

          // 添加数据资源
          filteredDataSources.forEach((ds) => {
            searchItems.push({ type: 'datasource', dataSource: ds });
          });

          return searchItems;
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
     * 统一处理所有末级节点的选择（文件、文件夹、数据源）
     * 用于统一处理 click 和回车事件
     * 自动判断节点类型并调用对应的回调函数
     * 与之前的 handleFileSelect 和 handleDataSourceSelect 逻辑一致
     */
    const handleItemSelect = useCallback(
      (item: FileNode | DataResource) => {
        // 判断是文件节点还是数据源：FileNode 有 path 属性（必需），DataResource 没有 path 属性
        if ('path' in item) {
          // 是文件节点（文件或文件夹）
          const file = item as FileNode;
          saveRecentFile(file);
          // 确保回调函数存在并调用
          if (onSelectFile) {
            onSelectFile(file);
          }
        } else {
          // 是数据源（DataResource 没有 path 属性）
          const dataSource = item as DataResource;
          saveRecentDataSource(dataSource);
          // 确保回调函数存在并调用
          if (onSelectDataSource) {
            onSelectDataSource(dataSource);
          }
        }
      },
      [onSelectFile, onSelectDataSource],
    );

    /**
     * 处理最近使用项选择
     */
    const handleRecentItemSelect = (item: (typeof recentItems)[0]) => {
      if (item.type === 'file' && item.file) {
        handleItemSelect(item.file);
      } else if (item.type === 'folder' && item.file) {
        // 文件夹类型也使用 handleItemSelect 处理
        handleItemSelect(item.file);
      } else if (item.type === 'datasource' && item.dataSource) {
        handleItemSelect(item.dataSource);
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
     * 统一处理所有视图的选择逻辑，与点击处理保持一致
     * 直接调用 handleItemSelect，确保与点击事件完全一致
     */
    const handleSelectCurrentItem = () => {
      switch (viewType) {
        case 'main': {
          // 主视图：处理最近使用项或操作项
          const currentItems = getCurrentItems;
          const validIndex = Math.min(selectedIndex, currentItems.length - 1);
          if (validIndex < 0 || validIndex >= currentItems.length) {
            break;
          }

          const currentItem = currentItems[validIndex];
          if (!currentItem) break;

          // 通过索引判断：索引 < recentItems.length 的是最近使用项，否则是操作项
          if (validIndex < recentItems.length) {
            // 最近使用项（文件、目录或数据源）
            // 直接使用 recentItems 中的项，确保数据完整
            const recentItem = recentItems[validIndex];
            if (recentItem) {
              handleRecentItemSelect(recentItem);
            }
          } else {
            // 操作项（文件/目录 或 数据资源）
            if ('type' in currentItem && currentItem.type === 'action') {
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
            }
          }
          break;
        }
        case 'search': {
          // 搜索视图：处理文件、文件夹或数据资源选择
          // 与点击处理保持一致：直接使用原始数组，而不是从 getCurrentItems 获取
          const totalItems =
            flattenedFiles.length +
            flattenedFolders.length +
            filteredDataSources.length;
          const validIndex = Math.min(selectedIndex, totalItems - 1);
          if (validIndex < 0 || validIndex >= totalItems) {
            break;
          }

          if (validIndex < flattenedFiles.length) {
            // 文件
            const file = flattenedFiles[validIndex];
            if (file) {
              handleItemSelect(file);
            }
          } else if (
            validIndex <
            flattenedFiles.length + flattenedFolders.length
          ) {
            // 文件夹
            const folderIndex = validIndex - flattenedFiles.length;
            const folder = flattenedFolders[folderIndex];
            if (folder) {
              handleItemSelect(folder);
            }
          } else {
            // 数据资源
            const dsIndex =
              validIndex - flattenedFiles.length - flattenedFolders.length;
            const dataSource = filteredDataSources[dsIndex];
            if (dataSource) {
              handleItemSelect(dataSource);
            }
          }
          break;
        }
        case 'files': {
          // 文件列表视图：处理文件或目录选择
          // 与点击处理保持一致：直接使用原始数组，而不是从 getCurrentItems 获取
          const totalItems = flattenedFiles.length + flattenedFolders.length;
          const validIndex = Math.min(selectedIndex, totalItems - 1);
          if (validIndex < 0 || validIndex >= totalItems) {
            break;
          }

          if (validIndex < flattenedFiles.length) {
            // 文件
            const file = flattenedFiles[validIndex];
            if (file) {
              handleItemSelect(file);
            }
          } else {
            // 目录
            const folderIndex = validIndex - flattenedFiles.length;
            const folder = flattenedFolders[folderIndex];
            if (folder) {
              handleItemSelect(folder);
            }
          }
          break;
        }
        case 'datasources': {
          // 数据源分类视图：处理分类点击
          const currentItems = getCurrentItems;
          const validIndex = Math.min(selectedIndex, currentItems.length - 1);
          if (validIndex < 0 || validIndex >= currentItems.length) {
            break;
          }

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
          // 与点击处理保持一致：直接使用原始数组，而不是从 getCurrentItems 获取
          const validIndex = Math.min(
            selectedIndex,
            filteredDataSources.length - 1,
          );
          if (validIndex < 0 || validIndex >= filteredDataSources.length) {
            break;
          }

          const dataSource = filteredDataSources[validIndex];
          if (dataSource) {
            handleItemSelect(dataSource);
          }
          break;
        }
        case 'datasource-category': {
          // 数据源分类详情视图：处理数据源选择
          // 与点击处理保持一致：直接使用原始数组，而不是从 getCurrentItems 获取
          const categoryDataSources = selectedCategory
            ? groupedDataSources[selectedCategory] || []
            : [];
          const validIndex = Math.min(
            selectedIndex,
            categoryDataSources.length - 1,
          );
          if (validIndex < 0 || validIndex >= categoryDataSources.length) {
            break;
          }

          const dataSource = categoryDataSources[validIndex];
          if (dataSource) {
            handleItemSelect(dataSource);
          }
          break;
        }
        default:
          break;
      }
    };

    /**
     * 处理 ESC 键返回上一级
     * @returns 如果处理了 ESC 键（返回了上一级），返回 true；否则返回 false
     */
    const handleEscapeKey = () => {
      switch (viewType) {
        case 'search':
          // 搜索视图返回到主视图
          setViewType('main');
          onSelectedIndexChange?.(0);
          return true;
        case 'files':
          // 文件列表视图返回到主视图
          setViewType('main');
          onSelectedIndexChange?.(0);
          return true;
        case 'datasources':
          // 数据源分类视图返回到主视图
          setViewType('main');
          setSelectedCategory('');
          onSelectedIndexChange?.(0);
          return true;
        case 'datasource-list':
          // 数据源列表视图返回到主视图
          setViewType('main');
          onSelectedIndexChange?.(0);
          return true;
        case 'datasource-category':
          // 数据源分类详情视图返回到数据源分类视图
          setViewType('datasources');
          setSelectedCategory('');
          onSelectedIndexChange?.(0);
          return true;
        case 'main':
          // 主视图不处理，由父组件关闭弹层
          return false;
        default:
          return false;
      }
    };

    /**
     * 处理右方向键：进入下一级或选择当前项
     * @returns 如果处理了右方向键，返回 true；否则返回 false
     */
    const handleArrowRightKey = () => {
      switch (viewType) {
        case 'main': {
          // 主视图：右方向键进入选中的操作项
          const currentItems = getCurrentItems;
          const validIndex = Math.min(selectedIndex, currentItems.length - 1);
          if (validIndex < 0 || validIndex >= currentItems.length) {
            return false;
          }

          // 只有操作项可以进入下一级（最近使用项不可以）
          if (validIndex >= recentItems.length) {
            const adjustedIndex = validIndex - recentItems.length;
            // 从 currentItems 中获取操作项，注意跳过了 recentItems
            const actionItems = currentItems.slice(recentItems.length);
            const actionItem = actionItems[adjustedIndex];

            // actionItem 是 { type: 'action', key: 'files'|'datasources', label: string } 类型
            if (
              actionItem &&
              'type' in actionItem &&
              actionItem.type === 'action'
            ) {
              const { key } = actionItem as {
                type: 'action';
                key: string;
                label: string;
              };
              if (key === 'files') {
                handleFilesClick();
                return true;
              } else if (key === 'datasources') {
                handleDataSourcesClick();
                return true;
              }
            }
          }
          return false;
        }
        case 'files':
          // 文件列表视图：右方向键选择当前项
          handleSelectCurrentItem();
          return true;
        case 'search':
          // 搜索视图：右方向键选择当前项
          handleSelectCurrentItem();
          return true;
        case 'datasources': {
          // 数据源分类视图：右方向键进入选中的分类
          const categories = Object.keys(groupedDataSources);
          const validIndex = Math.min(selectedIndex, categories.length - 1);
          if (validIndex < 0 || validIndex >= categories.length) {
            return false;
          }

          const selectedCategory = categories[validIndex];
          if (selectedCategory) {
            handleCategoryClick(selectedCategory);
            return true;
          }
          return false;
        }
        case 'datasource-list':
          // 数据源列表视图：右方向键选择当前项
          handleSelectCurrentItem();
          return true;
        case 'datasource-category':
          // 数据源分类详情视图：右方向键选择当前项
          handleSelectCurrentItem();
          return true;
        default:
          return false;
      }
    };

    /**
     * 处理左方向键：返回上一级
     * @returns 如果处理了左方向键，返回 true；否则返回 false
     */
    const handleArrowLeftKey = () => {
      switch (viewType) {
        case 'files':
          // 文件列表视图返回到主视图
          setViewType('main');
          onSelectedIndexChange?.(0);
          return true;
        case 'datasources':
          // 数据源分类视图返回到主视图
          setViewType('main');
          setSelectedCategory('');
          onSelectedIndexChange?.(0);
          return true;
        case 'datasource-list':
          // 数据源列表视图返回到主视图
          setViewType('main');
          onSelectedIndexChange?.(0);
          return true;
        case 'datasource-category':
          // 数据源分类详情视图返回到数据源分类视图
          setViewType('datasources');
          setSelectedCategory('');
          onSelectedIndexChange?.(0);
          return true;
        case 'main':
        case 'search':
          // 主视图和搜索视图不处理左方向键
          return false;
        default:
          return false;
      }
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      handleSelectCurrentItem,
      handleEscapeKey,
      handleArrowRightKey,
      handleArrowLeftKey,
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
          label: '文件/文件夹',
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
     * 渲染搜索视图（合并显示文件、文件夹和数据资源）
     */
    const renderSearchView = () => {
      // 计算当前索引对应的项在哪个分组
      let currentSection: 'files' | 'folders' | 'datasources' | null = null;
      let currentItemIndex = 0;

      // 计算当前选中项在哪个分组
      if (selectedIndex < flattenedFiles.length) {
        currentSection = 'files';
        currentItemIndex = selectedIndex;
      } else if (
        selectedIndex <
        flattenedFiles.length + flattenedFolders.length
      ) {
        currentSection = 'folders';
        currentItemIndex = selectedIndex - flattenedFiles.length;
      } else {
        currentSection = 'datasources';
        currentItemIndex =
          selectedIndex - flattenedFiles.length - flattenedFolders.length;
      }

      // 如果所有结果都为空，显示空状态
      if (
        flattenedFiles.length === 0 &&
        flattenedFolders.length === 0 &&
        filteredDataSources.length === 0
      ) {
        return (
          <div className={styles['mention-content']}>
            <Empty
              description="未找到匹配的结果"
              className={styles['mention-empty']}
            />
          </div>
        );
      }

      return (
        <div className={styles['mention-content']}>
          {/* 文件分组 */}
          {flattenedFiles.length > 0 && (
            <>
              <div className={styles['mention-section-title']}>文件</div>
              <div className={styles['mention-list']}>
                {flattenedFiles.map((file, index) => (
                  <div
                    key={`file-${file.id}`}
                    className={`${styles['mention-item']} ${
                      currentSection === 'files' && index === currentItemIndex
                        ? styles.selected
                        : ''
                    }`}
                    onClick={() => handleItemSelect(file)}
                  >
                    <div className={styles['mention-item-icon']}>
                      <FileOutlined />
                    </div>
                    <div className={styles['mention-item-content']}>
                      <div className={styles['mention-item-title']}>
                        {file.name}
                      </div>
                      <div className={styles['mention-item-desc']}>
                        {file.path}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 文件夹分组 */}
          {flattenedFolders.length > 0 && (
            <>
              <div className={styles['mention-section-title']}>文件夹</div>
              <div className={styles['mention-list']}>
                {flattenedFolders.map((folder, index) => (
                  <div
                    key={`folder-${folder.id}`}
                    className={`${styles['mention-item']} ${
                      currentSection === 'folders' && index === currentItemIndex
                        ? styles.selected
                        : ''
                    }`}
                    onClick={() => handleItemSelect(folder)}
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
            </>
          )}

          {/* 数据资源分组 */}
          {filteredDataSources.length > 0 && (
            <>
              <div className={styles['mention-section-title']}>数据资源</div>
              <div className={styles['mention-list']}>
                {filteredDataSources.map((ds, index) => (
                  <div
                    key={`datasource-${ds.id}`}
                    className={`${styles['mention-item']} ${
                      currentSection === 'datasources' &&
                      index === currentItemIndex
                        ? styles.selected
                        : ''
                    }`}
                    onClick={() => handleItemSelect(ds)}
                  >
                    <div className={styles['mention-item-icon']}>
                      <DatabaseOutlined />
                    </div>
                    <div className={styles['mention-item-content']}>
                      <div className={styles['mention-item-title']}>
                        {ds.name}
                      </div>
                      <div className={styles['mention-item-desc']}>
                        {ds.description || getDefaultDescription(ds.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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
                onClick={() => handleItemSelect(file)}
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
                onClick={() => handleItemSelect(folder)}
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
                onClick={() => handleItemSelect(ds)}
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
                onClick={() => handleItemSelect(ds)}
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
        case 'search':
          return renderSearchView();
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
