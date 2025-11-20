import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Card, Input, Space, Tag, Tooltip } from 'antd';
import React from 'react';

export interface ToolBlockViewProps {
  /** 工具名称 */
  tool: string;
  /** 内容 */
  content: string;
  /** 是否可编辑 */
  editable?: boolean;
  /** 编辑回调 */
  onEdit?: (tool: string, content: string) => void;
  /** 删除回调 */
  onDelete?: () => void;
  /** 工具信息 */
  toolInfo?: {
    title?: string;
    description?: string;
    category?: string;
    parameters?: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
  };
}

/**
 * ToolBlock 视图组件
 * 用于显示和编辑 ToolBlock 内容
 */
const ToolBlockView: React.FC<ToolBlockViewProps> = ({
  tool,
  content,
  editable = false,
  onEdit,
  onDelete,
  toolInfo,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(content);

  const handleSave = () => {
    onEdit?.(tool, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  return (
    <Card
      size="small"
      className="toolblock-view"
      title={
        <div className="toolblock-header">
          <Space>
            <span className="tool-icon">🛠️</span>
            <span className="tool-name">{tool}</span>
            {toolInfo?.category && <Tag color="blue">{toolInfo.category}</Tag>}
          </Space>
          {editable && (
            <Space>
              <Tooltip title="工具信息">
                <Button
                  type="text"
                  size="small"
                  icon={<InfoCircleOutlined />}
                />
              </Tooltip>
              <Button type="text" size="small" icon={<SettingOutlined />} />
            </Space>
          )}
        </div>
      }
      extra={
        editable && (
          <Space>
            {!isEditing ? (
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              />
            ) : (
              <Space>
                <Button type="text" size="small" onClick={handleSave}>
                  保存
                </Button>
                <Button type="text" size="small" onClick={handleCancel}>
                  取消
                </Button>
              </Space>
            )}
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={onDelete}
            />
          </Space>
        )
      }
      bordered={false}
    >
      <div className="toolblock-content">
        {isEditing ? (
          <div className="edit-mode">
            <Input.TextArea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="输入 ToolBlock 的内容..."
              autoSize={{ minRows: 3, maxRows: 10 }}
            />
          </div>
        ) : (
          <div className="content-display">
            {content || '点击编辑按钮添加内容...'}
          </div>
        )}
      </div>

      {/* 工具参数说明 */}
      {toolInfo?.parameters && toolInfo.parameters.length > 0 && (
        <div className="tool-parameters">
          <div className="parameters-title">
            <InfoCircleOutlined />
            <span>参数说明</span>
          </div>
          <div className="parameters-list">
            {toolInfo.parameters.map((param, index) => (
              <div key={index} className="parameter-item">
                <Space>
                  <code className="param-name">{param.name}</code>
                  <Tag color={param.required ? 'red' : 'default'}>
                    {param.type}
                  </Tag>
                  {param.required && <Tag color="red">必填</Tag>}
                </Space>
                {param.description && (
                  <div className="param-description">{param.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ToolBlockView;
