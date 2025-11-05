/**
 * MentionSelector 工具函数
 * 包含文件扁平化、数据源分组、最近使用管理等工具函数
 */

import type { FileNode } from '@/types/interfaces/appDev';
import type {
  DataResource,
  DataResourceType,
} from '@/types/interfaces/dataResource';

/**
 * 扁平化文件列表（只显示文件，不显示文件夹）
 */
export const flattenFiles = (
  nodes: FileNode[],
  searchText?: string,
): FileNode[] => {
  const result: FileNode[] = [];
  const searchLower = searchText?.toLowerCase() || '';

  const traverse = (nodeList: FileNode[]) => {
    nodeList.forEach((node) => {
      if (node.type === 'file') {
        // 只添加文件节点
        if (
          !searchText ||
          node.name.toLowerCase().includes(searchLower) ||
          node.path?.toLowerCase().includes(searchLower) ||
          node.id.toLowerCase().includes(searchLower)
        ) {
          result.push(node);
        }
      }
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  return result;
};

/**
 * 扁平化文件树，提取所有目录节点
 * @param nodes 文件树节点数组
 * @param searchText 搜索文本（可选）
 * @returns 扁平化后的目录节点数组
 */
export const flattenFolders = (
  nodes: FileNode[],
  searchText?: string,
): FileNode[] => {
  const result: FileNode[] = [];
  const searchLower = searchText?.toLowerCase() || '';

  const traverse = (nodeList: FileNode[]) => {
    nodeList.forEach((node) => {
      if (node.type === 'folder') {
        // 只添加目录节点
        if (
          !searchText ||
          node.name.toLowerCase().includes(searchLower) ||
          node.path?.toLowerCase().includes(searchLower) ||
          node.id.toLowerCase().includes(searchLower)
        ) {
          result.push(node);
        }
      }
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  return result;
};

/**
 * 获取数据源类型显示名称
 */
export const getDataSourceTypeName = (
  type: DataResourceType | string,
): string => {
  const typeMap: Record<string, string> = {
    workflow: '工作流',
    plugin: '插件',
    reverse_proxy: '反向代理',
  };
  return typeMap[type] || type;
};

/**
 * 获取资源类型的默认描述
 * @param type 资源类型
 * @returns 默认描述文本
 */
export const getDefaultDescription = (
  type: DataResourceType | string,
): string => {
  switch (type) {
    case 'plugin':
      return '插件资源，提供特定功能和服务';
    case 'workflow':
      return '工作流资源，支持复杂的业务流程编排';
    case 'reverse_proxy':
      return '反向代理资源，提供网络代理服务';
    default:
      return '数据资源';
  }
};

/**
 * 按类型分组数据源
 */
export const groupDataSourcesByType = (
  dataSources: DataResource[],
): Record<string, DataResource[]> => {
  const grouped: Record<string, DataResource[]> = {};
  dataSources.forEach((ds) => {
    const type = ds.type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(ds);
  });
  return grouped;
};

/**
 * 最近使用的文件/数据源存储键名
 */
const RECENT_FILES_KEY = 'mention_recent_files';
const RECENT_DATA_SOURCES_KEY = 'mention_recent_data_sources';
const MAX_RECENT_ITEMS = 7;

/**
 * 最近使用的文件项
 */
interface RecentFileItem {
  id: string;
  name: string;
  path: string;
  timestamp: number;
}

/**
 * 最近使用的数据源项
 */
interface RecentDataSourceItem {
  id: number | string;
  name: string;
  timestamp: number;
}

/**
 * 获取最近使用的文件
 */
export const getRecentFiles = (): RecentFileItem[] => {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    if (!stored) return [];
    const items: RecentFileItem[] = JSON.parse(stored);
    // 按时间戳倒序排序，取前7个
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
};

/**
 * 保存最近使用的文件
 */
export const saveRecentFile = (file: FileNode): void => {
  try {
    const items = getRecentFiles();
    // 移除已存在的相同文件
    const filtered = items.filter((item) => item.id !== file.id);
    // 添加新文件到开头
    const newItem: RecentFileItem = {
      id: file.id,
      name: file.name,
      path: file.path || file.id,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('保存最近使用的文件失败:', error);
  }
};

/**
 * 获取最近使用的数据源
 */
export const getRecentDataSources = (): RecentDataSourceItem[] => {
  try {
    const stored = localStorage.getItem(RECENT_DATA_SOURCES_KEY);
    if (!stored) return [];
    const items: RecentDataSourceItem[] = JSON.parse(stored);
    // 按时间戳倒序排序，取前7个
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
};

/**
 * 保存最近使用的数据源
 */
export const saveRecentDataSource = (dataSource: DataResource): void => {
  try {
    const items = getRecentDataSources();
    // 移除已存在的相同数据源
    const filtered = items.filter((item) => item.id !== dataSource.id);
    // 添加新数据源到开头
    const newItem: RecentDataSourceItem = {
      id: dataSource.id,
      name: dataSource.name,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENT_DATA_SOURCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('保存最近使用的数据源失败:', error);
  }
};
