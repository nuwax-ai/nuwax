/**
 * V2 错误列表组件
 * 显示工作流校验错误信息
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useState } from 'react';
import { Badge, Popover, List, Typography, Button, Empty, Tag } from 'antd';
import {
  WarningOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';

import type { ValidationErrorV2 } from '../../types';

import './ErrorListV2.less';

const { Text } = Typography;

// ==================== 类型定义 ====================

export interface ErrorListV2Props {
  /** 错误列表 */
  errors: ValidationErrorV2[];
  /** 点击错误项回调 */
  onErrorClick?: (error: ValidationErrorV2) => void;
  /** 是否显示徽章 */
  showBadge?: boolean;
  /** 自定义触发器 */
  trigger?: React.ReactNode;
}

// 错误级别配置
const ERROR_LEVEL_CONFIG = {
  error: {
    icon: <CloseCircleOutlined />,
    color: '#ff4d4f',
    tag: '错误',
    tagColor: 'error',
  },
  warning: {
    icon: <WarningOutlined />,
    color: '#faad14',
    tag: '警告',
    tagColor: 'warning',
  },
  info: {
    icon: <InfoCircleOutlined />,
    color: '#1890ff',
    tag: '提示',
    tagColor: 'processing',
  },
};

// ==================== 组件实现 ====================

const ErrorListV2: React.FC<ErrorListV2Props> = ({
  errors = [],
  onErrorClick,
  showBadge = true,
  trigger,
}) => {
  const [visible, setVisible] = useState(false);

  // 统计各级别错误数量
  const errorCount = errors.filter((e) => e.level === 'error').length;
  const warningCount = errors.filter((e) => e.level === 'warning').length;
  const infoCount = errors.filter((e) => e.level === 'info').length;

  // 处理错误项点击
  const handleErrorClick = (error: ValidationErrorV2) => {
    onErrorClick?.(error);
    setVisible(false);
  };

  // 渲染错误项
  const renderErrorItem = (error: ValidationErrorV2) => {
    const config = ERROR_LEVEL_CONFIG[error.level] || ERROR_LEVEL_CONFIG.error;

    return (
      <List.Item
        className="error-list-v2-item"
        onClick={() => handleErrorClick(error)}
      >
        <div className="error-list-v2-item-content">
          <div className="error-list-v2-item-header">
            <span
              className="error-list-v2-item-icon"
              style={{ color: config.color }}
            >
              {config.icon}
            </span>
            <Tag color={config.tagColor} className="error-list-v2-item-tag">
              {config.tag}
            </Tag>
            {error.nodeName && (
              <Text type="secondary" className="error-list-v2-item-node">
                {error.nodeName}
              </Text>
            )}
          </div>
          <div className="error-list-v2-item-message">{error.message}</div>
        </div>
        <RightOutlined className="error-list-v2-item-arrow" />
      </List.Item>
    );
  };

  // 渲染弹出内容
  const renderContent = () => {
    if (errors.length === 0) {
      return (
        <div className="error-list-v2-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无错误"
          />
        </div>
      );
    }

    return (
      <div className="error-list-v2-content">
        {/* 统计信息 */}
        <div className="error-list-v2-summary">
          {errorCount > 0 && (
            <span className="error-list-v2-summary-item error">
              <CloseCircleOutlined /> {errorCount} 个错误
            </span>
          )}
          {warningCount > 0 && (
            <span className="error-list-v2-summary-item warning">
              <WarningOutlined /> {warningCount} 个警告
            </span>
          )}
          {infoCount > 0 && (
            <span className="error-list-v2-summary-item info">
              <InfoCircleOutlined /> {infoCount} 个提示
            </span>
          )}
        </div>

        {/* 错误列表 */}
        <List
          className="error-list-v2-list"
          dataSource={errors}
          renderItem={renderErrorItem}
          size="small"
        />
      </div>
    );
  };

  // 默认触发器
  const defaultTrigger = (
    <Button
      type="text"
      className={`error-list-v2-trigger ${errors.length > 0 ? 'has-errors' : ''}`}
    >
      {showBadge ? (
        <Badge
          count={errorCount}
          offset={[-2, 2]}
          size="small"
          overflowCount={99}
        >
          <WarningOutlined
            style={{
              fontSize: 18,
              color: errorCount > 0 ? '#ff4d4f' : 'rgba(0, 0, 0, 0.45)',
            }}
          />
        </Badge>
      ) : (
        <WarningOutlined
          style={{
            fontSize: 18,
            color: errorCount > 0 ? '#ff4d4f' : 'rgba(0, 0, 0, 0.45)',
          }}
        />
      )}
    </Button>
  );

  return (
    <Popover
      content={renderContent()}
      title="校验结果"
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
      overlayClassName="error-list-v2-popover"
      arrow={{ pointAtCenter: true }}
    >
      {trigger || defaultTrigger}
    </Popover>
  );
};

export default ErrorListV2;
