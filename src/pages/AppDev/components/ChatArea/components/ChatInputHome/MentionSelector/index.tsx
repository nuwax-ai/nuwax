/**
 * MentionSelector 组件
 * 用于显示文件列表和数据源列表的下拉选择器
 */

import type { FileNode } from '@/types/interfaces/appDev';
import type { DataResource } from '@/types/interfaces/dataResource';
import { FileOutlined, FolderOutlined } from '@ant-design/icons';
import { Empty, Tabs, Tree } from 'antd';
import React, { useMemo } from 'react';
import styles from './index.less';
import type { MentionSelectorProps } from './types';

/**
 * MentionSelector 组件
 */
const MentionSelector: React.FC<MentionSelectorProps> = ({
  visible,
  position,
  searchText,
  files,
  dataSources,
  activeTab,
  onTabChange,
  onSelectFile,
  onSelectDataSource,
  selectedIndex,
  containerRef,
}) => {
  /**
   * 过滤文件列表（扁平化，只显示文件，不显示文件夹）
   */
  const filteredFiles = useMemo(() => {
    const flattenFiles = (nodes: FileNode[]): FileNode[] => {
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
          result.push(...flattenFiles(node.children));
        }
      });
      return result;
    };

    return flattenFiles(files);
  }, [files, searchText]);

  /**
   * 转换为 Tree 组件需要的格式
   */
  const treeData = useMemo(() => {
    const convertToTreeData = (nodes: FileNode[]): any[] => {
      return nodes
        .filter((node) => {
          // 过滤：根据搜索文本过滤
          if (searchText) {
            const searchLower = searchText.toLowerCase();
            return (
              node.name.toLowerCase().includes(searchLower) ||
              node.path.toLowerCase().includes(searchLower) ||
              (node.children &&
                node.children.some((child) =>
                  child.name.toLowerCase().includes(searchLower),
                ))
            );
          }
          return true;
        })
        .map((node) => ({
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {node.type === 'folder' ? <FolderOutlined /> : <FileOutlined />}
              <span>{node.name}</span>
            </div>
          ),
          key: node.id,
          isLeaf: node.type === 'file',
          children:
            node.children && node.children.length > 0
              ? convertToTreeData(node.children)
              : undefined,
          selectable: node.type === 'file', // 只允许选择文件
        }));
    };

    return convertToTreeData(files);
  }, [files, searchText]);

  /**
   * 过滤数据源列表
   */
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

  // 早期返回必须在所有 hooks 之后
  if (!visible || !position.visible) {
    return null;
  }

  /**
   * 处理文件选择
   */
  const handleFileSelect = (selectedKeys: React.Key[], info: any) => {
    if (info.selected && info.node.selectable) {
      // 找到对应的文件节点
      const findFileNode = (
        nodes: FileNode[],
        key: string,
      ): FileNode | null => {
        for (const node of nodes) {
          if (node.id === key && node.type === 'file') {
            return node;
          }
          if (node.children) {
            const found = findFileNode(node.children, key);
            if (found) return found;
          }
        }
        return null;
      };

      const file = findFileNode(files, selectedKeys[0] as string);
      if (file) {
        onSelectFile(file);
      }
    }
  };

  /**
   * 处理数据源选择
   */
  const handleDataSourceSelect = (dataSource: DataResource) => {
    onSelectDataSource(dataSource);
  };

  /**
   * 渲染文件列表 Tab
   */
  const renderFilesTab = () => {
    if (filteredFiles.length === 0) {
      return (
        <Empty
          description="未找到匹配的文件"
          className={styles['mention-empty']}
        />
      );
    }

    // 获取当前选中的文件 key（用于键盘导航）
    const selectedKeys =
      selectedIndex < filteredFiles.length
        ? [filteredFiles[selectedIndex]?.id].filter(Boolean)
        : [];

    return (
      <Tree
        className={styles['mention-tree']}
        treeData={treeData}
        onSelect={handleFileSelect}
        selectedKeys={selectedKeys}
        defaultExpandAll={!!searchText}
        showIcon={false}
        blockNode
      />
    );
  };

  /**
   * 渲染数据源列表 Tab
   */
  const renderDataSourcesTab = () => {
    if (filteredDataSources.length === 0) {
      return (
        <Empty
          description="未找到匹配的数据源"
          className={styles['mention-empty']}
        />
      );
    }

    return (
      <div className={styles['mention-list']}>
        {filteredDataSources.map((ds, index) => (
          <div
            key={ds.id}
            className={`${styles['mention-item']} ${
              index === selectedIndex ? styles.selected : ''
            }`}
            onClick={() => handleDataSourceSelect(ds)}
          >
            <div className={styles['mention-item-title']}>{ds.name}</div>
            {ds.description && (
              <div className={styles['mention-item-desc']}>
                {ds.description}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={styles['mention-selector']}
      style={{
        position: 'fixed',
        right: `${window.innerWidth - position.left}px`, // 右侧对齐光标右侧
        bottom: `${window.innerHeight - position.top}px`, // 底部对齐光标底部
        display: visible && position.visible ? 'block' : 'none',
      }}
      ref={containerRef || undefined}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as 'files' | 'datasources')}
        className={styles['mention-tabs']}
        items={[
          {
            key: 'files',
            label: '文件列表',
          },
          {
            key: 'datasources',
            label: '数据源列表',
          },
        ]}
      />
      <div className={styles['mention-content']}>
        {activeTab === 'files' ? renderFilesTab() : renderDataSourcesTab()}
      </div>
    </div>
  );
};

export default MentionSelector;
