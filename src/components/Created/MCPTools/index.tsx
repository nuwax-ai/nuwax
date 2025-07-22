import { AgentAddComponentStatusEnum } from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { Button } from 'antd';
import classNames from 'classnames';
import { useCallback } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MCPToolsProps {
  tools: any[];
  item: CreatedNodeItem;
  onAddTool: (tool: any) => void;
  fold: boolean;
  addedComponents: AgentAddComponentStatusInfo[];
  getToolLoading: (item: CreatedNodeItem) => boolean | undefined;
}
const addedStatus = AgentAddComponentStatusEnum.Added;
const MCPTools: React.FC<MCPToolsProps> = ({
  tools,
  item,
  onAddTool,
  fold,
  getToolLoading,
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
    (item: CreatedNodeItem, status: AgentAddComponentStatusEnum) => {
      return addedComponents?.some(
        (info) =>
          info.type === item.targetType &&
          info.targetId === item.targetId &&
          (info.toolName || '') === (item.toolName || '') &&
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
      className={cx(styles['mcp-tools-style'])}
    >
      {tools.map((tool: any, index: number) => (
        <div
          key={`${item.targetId}-${index}-tools-${tool.name}`}
          className={cx(styles['mcp-tools-item-style'])}
        >
          <div className={cx('dis-sb', styles['mcp-tools-item-content-style'])}>
            <div className={cx(styles['mcp-tools-item-name-style'])}>
              {tool.name}
            </div>
            <div className={cx(styles['mcp-tools-item-description-style'])}>
              {tool.description || '暂无描述'}
            </div>
          </div>
          <div className={cx(styles['mcp-tools-item-button-style'], 'dis-sb')}>
            <Button
              color="primary"
              variant="outlined"
              onClick={() => handleAddTool(tool.name, tool.description)}
              disabled={
                getToolLoading({ ...item, toolName: tool.name })
                  ? false
                  : isAdded({ ...item, toolName: tool.name }, addedStatus)
              }
              loading={getToolLoading({ ...item, toolName: tool.name })}
            >
              {isAdded({ ...item, toolName: tool.name }, addedStatus)
                ? '已添加'
                : '添加'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MCPTools;
