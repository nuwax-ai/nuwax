/**
 * MentionSelector 工具函数
 * 用于管理最近使用的文件和数据源
 */

import type { FileNode } from '@/types/interfaces/appDev';
import type { DataResource } from '@/types/interfaces/dataResource';

const STORAGE_KEY_RECENT_FILES = 'app-dev-recent-files';
const STORAGE_KEY_RECENT_DATA_SOURCES = 'app-dev-recent-data-sources';
const MAX_RECENT_ITEMS = 7;

/**
 * 最近使用的文件项
 */
export interface RecentFileItem {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'folder';
  timestamp: number;
}

/**
 * 最近使用的数据源项
 */
export interface RecentDataSourceItem {
  id: string | number;
  name: string;
  type: string;
  timestamp: number;
}

/**
 * 获取最近使用的文件列表
 */
export const getRecentFiles = (): RecentFileItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RECENT_FILES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get recent files:', error);
  }
  return [];
};

/**
 * 保存最近使用的文件
 */
export const saveRecentFile = (file: FileNode) => {
  try {
    const recentFiles = getRecentFiles();
    // 移除已存在的同 ID 文件
    const filtered = recentFiles.filter((item) => item.id !== file.id);
    // 添加新文件到最前面
    const newRecent: RecentFileItem = {
      id: file.id,
      path: file.path,
      name: file.name,
      type: file.type,
      timestamp: Date.now(),
    };
    const updated = [newRecent, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(STORAGE_KEY_RECENT_FILES, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent file:', error);
  }
};

/**
 * 获取最近使用的数据源列表
 */
export const getRecentDataSources = (): RecentDataSourceItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RECENT_DATA_SOURCES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get recent data sources:', error);
  }
  return [];
};

/**
 * 保存最近使用的数据源
 */
export const saveRecentDataSource = (dataSource: DataResource) => {
  try {
    const recentDataSources = getRecentDataSources();
    // 移除已存在的同 ID 数据源
    const filtered = recentDataSources.filter(
      (item) => item.id !== dataSource.id,
    );
    // 添加新数据源到最前面
    const newRecent: RecentDataSourceItem = {
      id: dataSource.id,
      name: dataSource.name,
      type: dataSource.type,
      timestamp: Date.now(),
    };
    const updated = [newRecent, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(
      STORAGE_KEY_RECENT_DATA_SOURCES,
      JSON.stringify(updated),
    );
  } catch (error) {
    console.error('Failed to save recent data source:', error);
  }
};

/**
 * 将 FileNode 扁平化为文件列表
 */
export const flattenFiles = (
  nodes: FileNode[],
  searchText?: string,
): FileNode[] => {
  const result: FileNode[] = [];
  nodes.forEach((node) => {
    if (node.type === 'file') {
      // 只添加文件节点
      if (
        !searchText ||
        node.name.toLowerCase().includes(searchText.toLowerCase()) ||
        node.path.toLowerCase().includes(searchText.toLowerCase()) ||
        node.id.toLowerCase().includes(searchText.toLowerCase())
      ) {
        result.push(node);
      }
    }
    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      result.push(...flattenFiles(node.children, searchText));
    }
  });
  return result;
};

/**
 * 按类型分组数据源
 */
export const groupDataSourcesByType = (
  dataSources: DataResource[],
): Record<string, DataResource[]> => {
  const grouped: Record<string, DataResource[]> = {};
  dataSources.forEach((ds) => {
    const type = ds.type || 'other';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(ds);
  });
  return grouped;
};

/**
 * 获取数据源类型的中文名称
 */
export const getDataSourceTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    workflow: '工作流',
    plugin: '插件',
    other: '其他',
  };
  return typeMap[type] || type;
};
