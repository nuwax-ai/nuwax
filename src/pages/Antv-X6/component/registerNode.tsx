import { ChildNode } from '@/types/interfaces/workflow';
import { returnBackgroundColor, returnImg } from '@/utils/workflow';
import { DashOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import React, { useEffect, useState } from 'react';
// registerCustomNodes.ts
import { Graph } from '@antv/x6';
interface GeneralNodeState {
  isEditingTitle: boolean;
  editedTitle: string;
}

const GeneralNode: React.FC = ({ node }) => {
  const [state, setState] = useState<GeneralNodeState>({
    isEditingTitle: false,
    editedTitle: node.getData<ChildNode>().name || '',
  });

  useEffect(() => {
    // 监听节点大小变化事件
    const handleResized = () => {
      console.log('Node has been resized.');
      // 如果需要，可以在这里更新组件状态或调用其他逻辑
    };

    node.on('resize', handleResized);

    return () => {
      // 移除监听器
      node.off('resize', handleResized);
    };
  }, [node]);

  // 省略了其他方法和渲染逻辑...
  // 注意：这里的方法（如 changeNode, handleTitleChange, startEditTitle, finishEditTitle）应该按照需求实现

  const data = node.getData<ChildNode>();
  if (!data) {
    return null;
  }

  const width = data.nodeConfig?.extension?.width ?? 304;
  const height = data.nodeConfig?.extension?.height ?? 83;

  return (
    <div
      className="general-node"
      style={{
        width: width,
        height: height,
      }}
    >
      {/* 节点头部，包含标题、图像和操作菜单 */}
      <div
        className="general-node-header"
        style={{
          background: `linear-gradient(to bottom, ${returnBackgroundColor(
            data.type,
          )} 0%, white 70%)`,
        }}
      >
        <div className="general-node-header-image">
          {returnImg(data.type)}
          {state.isEditingTitle ? (
            <input
              value={state.editedTitle}
              onChange={(e) =>
                setState({ ...state, editedTitle: e.target.value })
              }
              onBlur={() => setState({ ...state, isEditingTitle: false })}
              onKeyDown={(e) =>
                e.key === 'Enter'
                  ? setState({ ...state, isEditingTitle: false })
                  : null
              }
              autoFocus
            />
          ) : (
            <span onClick={() => setState({ ...state, isEditingTitle: true })}>
              {data.name}
            </span>
          )}
        </div>
        <div>
          {data.type !== 'Start' && (
            <>
              <Popover placement="top" content={'测试该节点'}>
                <PlayCircleOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    // 触发父组件的事件
                    node.getData().onChange?.('TestRun', node);
                  }}
                />
              </Popover>
              <Popover content={123} trigger="hover">
                <DashOutlined
                  style={{ marginLeft: '10px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popover>
            </>
          )}
        </div>
      </div>
      {/* 节点内容区，根据 data.content 的类型显示不同的内容 */}
      <div className="general-node-content">
        <div className="text-ellipsis">{data.description}</div>
      </div>
    </div>
  );
};

import { createRoot } from 'react-dom/client';
interface CustomNodeProps {
  node: any; // 根据 @antv/x6 的节点类型调整
  container: HTMLElement;
}
export function registerCustomNodes() {
  Graph.registerNode(
    'general-node',
    {
      isHtml: true,
      markup: [
        {
          tagName: 'div',
          selector: 'body',
          children: [
            {
              tagName: 'div',
              selector: 'header',
            },
            {
              tagName: 'div',
              selector: 'content',
            },
          ],
        },
      ],
      component: (props: CustomNodeProps) => {
        const { node, container } = props;
        const root = createRoot(container); // 使用 createRoot 替代 ReactDOM.render
        root.render(<GeneralNode node={node} />);
      },
    },
    true,
  );
}
