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
const MCPTools: React.FC<MCPToolsProps> = ({
  tools,
  item,
  onAddTool,
  fold,
  addedComponents,
}) => {
  const handleAddTool = useCallback(
    (toolName: string, toolDescription: string) => {
      onAddTool({
        ...item,
        name: `${item.name}/${toolName}`,
        description: toolDescription,
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
    <div key={`${item.targetId}-tools`} className="mcp-tools-style">
      {tools.map((tool: any, index: number) => (
        <div
          key={`${item.targetId}-${index}-tools-${tool.name}`}
          className="mcp-tools-item-style"
        >
          <div className="dis-sb mcp-tools-item-content-style">
            <div className="mcp-tools-item-name-style">{tool.name}</div>
            <div className="mcp-tools-item-description-style">
              {tool.description || '暂无描述'}
            </div>
          </div>
          <div className="dis-sb mcp-tools-item-button-style">
            <Button
              color="primary"
              variant="outlined"
              onClick={() => handleAddTool(tool.name, tool.description)}
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
};

export default MCPTools;
