/**
 * V2 版本历史组件
 * 显示和管理工作流版本历史
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useState } from 'react';
import {
  Drawer,
  Timeline,
  Button,
  Typography,
  Tag,
  Space,
  Popconfirm,
  Empty,
  Spin,
  Tooltip,
} from 'antd';
import {
  HistoryOutlined,
  RollbackOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

import './VersionHistoryV2.less';

const { Text, Paragraph } = Typography;

// ==================== 类型定义 ====================

/** 版本信息 */
export interface VersionInfo {
  /** 版本ID */
  id: string;
  /** 版本号 */
  version: string;
  /** 版本描述 */
  description?: string;
  /** 创建时间 */
  createdAt: string;
  /** 创建人 */
  createdBy?: string;
  /** 是否为当前版本 */
  isCurrent?: boolean;
  /** 是否为已发布版本 */
  isPublished?: boolean;
  /** 状态 */
  status?: 'draft' | 'published' | 'archived';
}

export interface VersionHistoryV2Props {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 版本列表 */
  versions: VersionInfo[];
  /** 当前版本ID */
  currentVersionId?: string;
  /** 回滚回调 */
  onRollback?: (versionId: string) => Promise<void>;
  /** 预览回调 */
  onPreview?: (versionId: string) => void;
  /** 是否加载中 */
  loading?: boolean;
}

// ==================== 组件实现 ====================

const VersionHistoryV2: React.FC<VersionHistoryV2Props> = ({
  open,
  onClose,
  versions = [],
  currentVersionId,
  onRollback,
  onPreview,
  loading = false,
}) => {
  const [rollbackingId, setRollbackingId] = useState<string | null>(null);

  // 格式化时间
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  // 获取状态标签
  const getStatusTag = (version: VersionInfo) => {
    if (version.isCurrent) {
      return (
        <Tag color="blue" icon={<CheckCircleOutlined />}>
          当前版本
        </Tag>
      );
    }
    if (version.isPublished || version.status === 'published') {
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          已发布
        </Tag>
      );
    }
    if (version.status === 'archived') {
      return <Tag color="default">已归档</Tag>;
    }
    return (
      <Tag color="orange" icon={<ClockCircleOutlined />}>
        草稿
      </Tag>
    );
  };

  // 处理回滚
  const handleRollback = async (versionId: string) => {
    try {
      setRollbackingId(versionId);
      await onRollback?.(versionId);
    } finally {
      setRollbackingId(null);
    }
  };

  // 渲染版本项
  const renderVersionItem = (version: VersionInfo) => {
    const isCurrent = version.id === currentVersionId || version.isCurrent;

    return (
      <Timeline.Item
        key={version.id}
        color={isCurrent ? 'blue' : version.isPublished ? 'green' : 'gray'}
        dot={
          isCurrent ? (
            <CheckCircleOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          ) : undefined
        }
      >
        <div className="version-history-v2-item">
          {/* 头部 */}
          <div className="version-history-v2-item-header">
            <Space>
              <Text strong className="version-history-v2-item-version">
                {version.version}
              </Text>
              {getStatusTag(version)}
            </Space>
            <Text type="secondary" className="version-history-v2-item-time">
              {formatTime(version.createdAt)}
            </Text>
          </div>

          {/* 描述 */}
          {version.description && (
            <Paragraph
              className="version-history-v2-item-desc"
              ellipsis={{ rows: 2, expandable: true }}
            >
              {version.description}
            </Paragraph>
          )}

          {/* 创建人 */}
          {version.createdBy && (
            <Text type="secondary" className="version-history-v2-item-creator">
              创建人: {version.createdBy}
            </Text>
          )}

          {/* 操作按钮 */}
          <div className="version-history-v2-item-actions">
            <Tooltip title="预览此版本">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onPreview?.(version.id)}
              >
                预览
              </Button>
            </Tooltip>
            {!isCurrent && (
              <Popconfirm
                title="确定要回滚到此版本吗？"
                description="回滚后当前未保存的更改将丢失"
                onConfirm={() => handleRollback(version.id)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="回滚到此版本">
                  <Button
                    type="text"
                    size="small"
                    icon={<RollbackOutlined />}
                    loading={rollbackingId === version.id}
                  >
                    回滚
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}
          </div>
        </div>
      </Timeline.Item>
    );
  };

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>版本历史</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={400}
      className="version-history-v2"
    >
      <Spin spinning={loading}>
        {versions.length > 0 ? (
          <Timeline className="version-history-v2-timeline">
            {versions.map(renderVersionItem)}
          </Timeline>
        ) : (
          <Empty
            description="暂无版本历史"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Spin>
    </Drawer>
  );
};

export default VersionHistoryV2;
