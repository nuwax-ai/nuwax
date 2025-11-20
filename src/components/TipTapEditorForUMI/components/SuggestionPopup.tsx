import type { ToolItem, VariableItem } from '@/types/tiptap';
import type { TreeDataNode } from 'antd';
import { Empty, Tabs, Tree } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

const { TabPane } = Tabs;

export interface SuggestionPopupProps {
  /** 变量列表 */
  variables: VariableItem[];
  /** 工具列表 */
  tools: ToolItem[];
  /** 选择回调 */
  onSelect: (item: VariableItem | ToolItem, type: 'variable' | 'tool') => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 可见性状态 */
  visible: boolean;
  /** 位置 */
  position?: { x: number; y: number };
}

/**
 * 统一的建议弹窗组件（参考VariableInferenceInput设计）
 * 简洁优雅，去掉搜索框，直接展示树形结构
 */
const SuggestionPopup: React.FC<SuggestionPopupProps> = ({
  variables = [],
  tools = [],
  onSelect,
  onCancel,
  visible,
  position = { x: 0, y: 0 },
}) => {
  const [activeTab, setActiveTab] = useState('variables');

  // 转换变量为树形结构
  const variableTreeData = useMemo(() => {
    return variables.map((variable) => ({
      key: variable.key,
      title: (
        <div className="tree-node-content">
          <span className="node-type variable">变量</span>
          <span className="node-title">{variable.name}</span>
          <span className="node-key">{variable.key}</span>
        </div>
      ),
      value: variable,
      icon: <span className="variable-icon">📝</span>,
    }));
  }, [variables]);

  // 转换工具为树形结构
  const toolTreeData = useMemo(() => {
    const convertTools = (toolList: ToolItem[]): TreeDataNode[] => {
      return toolList.map((tool) => ({
        key: tool.key,
        title: (
          <div className="tree-node-content">
            <span className="node-type tool">工具</span>
            <span className="node-title">{tool.title}</span>
            <span className="node-key">{tool.key}</span>
          </div>
        ),
        value: tool,
        icon: <span className="tool-icon">🛠️</span>,
        children: tool.children ? convertTools(tool.children) : undefined,
      }));
    };
    return convertTools(tools);
  }, [tools]);

  // 合并的树形数据（全部选项）
  const allTreeData = useMemo(() => {
    return [...variableTreeData, ...toolTreeData];
  }, [variableTreeData, toolTreeData]);

  // 键盘事件处理
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onCancel]);

  if (!visible) return null;

  return (
    <div
      className="tiptap-suggestion-popup"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
    >
      <div className="suggestion-header">
        <span className="suggestion-title">选择变量或工具</span>
        <span className="suggestion-count">
          变量 {variables.length} | 工具 {toolTreeData.length}
        </span>
      </div>

      <div className="suggestion-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          className="suggestion-tabs"
          tabBarStyle={{ margin: '0 0 8px 0' }}
        >
          <TabPane tab={`全部 (${allTreeData.length})`} key="all">
            <div className="tree-container">
              {allTreeData.length === 0 ? (
                <Empty
                  description="暂无可用选项"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Tree
                  treeData={allTreeData}
                  showIcon
                  onSelect={(keys) => {
                    if (keys.length > 0) {
                      const selectedNode = allTreeData.find(
                        (node) => node.key === keys[0],
                      );
                      if (selectedNode) {
                        const isTool = (
                          selectedNode as any
                        ).value?.hasOwnProperty('children');
                        onSelect(
                          (selectedNode as any).value,
                          isTool ? 'tool' : 'variable',
                        );
                      }
                    }
                  }}
                  height={240}
                  itemHeight={28}
                  virtual={true}
                />
              )}
            </div>
          </TabPane>

          <TabPane tab={`变量 (${variableTreeData.length})`} key="variables">
            <div className="tree-container">
              {variableTreeData.length === 0 ? (
                <Empty
                  description="暂无可用变量"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Tree
                  treeData={variableTreeData}
                  showIcon
                  onSelect={(keys) => {
                    if (keys.length > 0) {
                      const selectedNode = variableTreeData.find(
                        (node) => node.key === keys[0],
                      );
                      if (selectedNode) {
                        onSelect(selectedNode.value, 'variable');
                      }
                    }
                  }}
                  height={240}
                  itemHeight={28}
                  virtual={true}
                />
              )}
            </div>
          </TabPane>

          <TabPane tab={`工具 (${toolTreeData.length})`} key="tools">
            <div
              className="tree-container"
              style={{ maxHeight: '240px', overflow: 'auto' }}
            >
              {toolTreeData.length === 0 ? (
                <Empty
                  description="暂无可用工具"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Tree
                  treeData={toolTreeData}
                  showIcon
                  onSelect={(keys) => {
                    if (keys.length > 0) {
                      const findNodeByKey = (
                        nodes: TreeDataNode[],
                        key: string,
                      ): TreeDataNode | null => {
                        for (const node of nodes) {
                          if (node.key === key) return node;
                          if (node.children) {
                            const found = findNodeByKey(node.children, key);
                            if (found) return found;
                          }
                        }
                        return null;
                      };

                      const selectedNode = findNodeByKey(
                        toolTreeData,
                        keys[0] as string,
                      );
                      if (selectedNode) {
                        onSelect((selectedNode as any).value, 'tool');
                      }
                    }
                  }}
                  height={240}
                  itemHeight={28}
                  virtual={true}
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default SuggestionPopup;
