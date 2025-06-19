import { AgentAddComponentStatusEnum } from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { Button } from 'antd';
import { useCallback } from 'react';

interface MCPToolsProps {
  tools: any[];
  item: CreatedNodeItem;
  onAddTool: (tool: any) => void;
  fold: boolean;
  addedComponents: AgentAddComponentStatusInfo[];
}
const loadingStatus = AgentAddComponentStatusEnum.Loading;
const addedStatus = AgentAddComponentStatusEnum.Added;
export default function MCPTools({
  tools,
  item,
  onAddTool,
  fold,
  addedComponents,
}: MCPToolsProps): React.ReactNode {
  const handleAddTool = useCallback(
    (toolName: string) => {
      onAddTool({
        ...item,
        toolName,
      });
    },
    [onAddTool, item],
  );

  const isAdded = useCallback(
    (
      item: CreatedNodeItem,
      status: AgentAddComponentStatusEnum,
      toolName: string,
    ) => {
      return addedComponents?.some(
        (info) =>
          info.type === item.targetType &&
          info.targetId === item.targetId &&
          info.toolName === toolName &&
          info.status === status,
      );
    },
    [addedComponents, item],
  );

  if (fold) {
    return null;
  }
  return (
    <div
      key={`${item.targetId}-tools`}
      style={{ marginLeft: 65, marginRight: 16 }}
    >
      {tools.map((tool: any, index: number) => (
        <div
          key={`${item.targetId}-${index}-tools-${tool.name}`}
          style={{
            width: '100%',
            display: 'flex',
            padding: '12px 0',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <div
            className="dis-sb"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#333',
                lineHeight: '22px',
              }}
            >
              {tool.name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#666',
                lineHeight: '22px',
              }}
            >
              {tool.description || '暂无描述'}
            </div>
          </div>
          <div className="dis-sb">
            <Button
              color="primary"
              variant="outlined"
              onClick={() => handleAddTool(tool.name)}
              disabled={isAdded(item, addedStatus, tool.name)}
              loading={isAdded(item, loadingStatus, tool.name)}
            >
              {isAdded(item, addedStatus, tool.name) ? '已添加' : '添加'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
