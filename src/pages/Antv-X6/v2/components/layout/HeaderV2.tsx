/**
 * V2 Header 组件
 *
 * 顶部导航栏，包含：
 * - 返回按钮
 * - 工作流名称/图标/描述
 * - 发布状态标签
 * - 自动保存时间
 * - 撤销/重做按钮
 * - 版本历史入口
 * - 发布按钮
 *
 * 完全独立，不依赖 v1 任何代码
 */

import {
  CheckCircleFilled,
  ClockCircleOutlined,
  FormOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Button, Popover, Tag, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { history, useParams } from 'umi';

import './HeaderV2.less';

// ==================== 类型定义 ====================

export interface WorkflowInfoV2 {
  id?: number;
  name?: string;
  icon?: string;
  description?: string;
  publishStatus?: string;
  publishDate?: string | null;
  modified?: string;
  permissions?: string[];
}

export interface HeaderV2Props {
  /** 工作流信息 */
  info: WorkflowInfoV2;
  /** 是否有未保存的更改 */
  isDirty?: boolean;
  /** 是否正在保存 */
  isSaving?: boolean;
  /** 是否可以撤销 */
  canUndo?: boolean;
  /** 是否可以重做 */
  canRedo?: boolean;
  /** 是否正在校验 */
  isValidating?: boolean;
  /** 撤销回调 */
  onUndo?: () => void;
  /** 重做回调 */
  onRedo?: () => void;
  /** 保存回调 */
  onSave?: () => void;
  /** 发布回调 */
  onPublish?: () => void;
  /** 编辑工作流信息回调 */
  onEditInfo?: () => void;
  /** 打开版本历史回调 */
  onOpenVersionHistory?: () => void;
}

// ==================== 工具函数 ====================

/**
 * 格式化时间显示
 */
function formatTime(dateStr?: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }

  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}小时前`;
  }

  // 超过24小时，显示具体日期
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${month}月${day}日 ${hour}:${minute}`;
}

/**
 * 获取默认工作流图标
 */
function getDefaultIcon(): string {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzUxNDdGRiIvPgo8cGF0aCBkPSJNNyA4SDEyTTcgMTJIMTdNNyAxNkgxNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+';
}

// ==================== 组件实现 ====================

const HeaderV2: React.FC<HeaderV2Props> = ({
  info,
  isDirty = false,
  isSaving = false,
  canUndo = false,
  canRedo = false,
  isValidating = false,
  onUndo,
  onRedo,
  onSave,
  onPublish,
  onEditInfo,
  onOpenVersionHistory,
}) => {
  const { spaceId } = useParams<{ spaceId: string }>();

  const {
    name = '工作流',
    icon,
    description,
    publishStatus,
    publishDate,
    modified,
    permissions = [],
  } = info || {};

  // 发布按钮是否禁用
  const isPublishDisabled = useMemo(() => {
    return !permissions.includes('Publish');
  }, [permissions]);

  // 是否已发布
  const isPublished = publishStatus === 'Published';

  // 是否有更新未发布
  const hasUnpublishedChanges = useMemo(() => {
    if (!publishDate || !modified) return false;
    return new Date(modified) > new Date(publishDate);
  }, [publishDate, modified]);

  // 返回上一页
  const handleBack = () => {
    history.push(`/space/${spaceId}/library`);
  };

  return (
    <div className="header-v2">
      {/* 左侧：返回 + 工作流信息 */}
      <div className="header-v2-left">
        <LeftOutlined className="header-v2-back" onClick={handleBack} />

        <img src={icon || getDefaultIcon()} alt="" className="header-v2-icon" />

        <div className="header-v2-info">
          <div className="header-v2-title">
            <strong className="header-v2-name">{name}</strong>

            {description && (
              <Popover content={description} placement="bottom">
                <InfoCircleOutlined className="header-v2-info-icon" />
              </Popover>
            )}

            {isPublished && (
              <Popover content="已发布" placement="bottom">
                <CheckCircleFilled className="header-v2-published-icon" />
              </Popover>
            )}

            <FormOutlined
              className="header-v2-edit-icon"
              onClick={onEditInfo}
            />
          </div>
        </div>
      </div>

      {/* 中间：撤销/重做/保存 */}
      <div className="header-v2-center">
        <Tooltip title="撤销 (Ctrl+Z)">
          <Button
            type="text"
            icon={<UndoOutlined />}
            disabled={!canUndo}
            onClick={onUndo}
          />
        </Tooltip>

        <Tooltip title="重做 (Ctrl+Shift+Z)">
          <Button
            type="text"
            icon={<RedoOutlined />}
            disabled={!canRedo}
            onClick={onRedo}
          />
        </Tooltip>

        <Tooltip title="保存 (Ctrl+S)">
          <Button
            type="text"
            icon={<SaveOutlined />}
            loading={isSaving}
            onClick={onSave}
          >
            {isSaving ? '保存中' : '保存'}
          </Button>
        </Tooltip>
      </div>

      {/* 右侧：状态标签 + 版本历史 + 发布 */}
      <div className="header-v2-right">
        {/* 自动保存时间 */}
        <Tag color="default" bordered={false}>
          {isDirty ? '有未保存的更改' : `已自动保存 ${formatTime(modified)}`}
        </Tag>

        {/* 发布状态标签 */}
        {publishDate === null && (
          <Tag color="#EBECF5" style={{ color: 'rgba(15,21,40,0.82)' }}>
            未发布
          </Tag>
        )}

        {hasUnpublishedChanges && (
          <Tag bordered={false} color="volcano">
            有更新未发布
          </Tag>
        )}

        {/* 版本历史 */}
        <Tooltip title="版本历史">
          <ClockCircleOutlined
            className="header-v2-history-icon"
            onClick={onOpenVersionHistory}
          />
        </Tooltip>

        {/* 发布按钮 */}
        <Button
          type="primary"
          disabled={isPublishDisabled}
          loading={isValidating}
          onClick={onPublish}
        >
          {isValidating ? '校验中' : '发布'}
        </Button>
      </div>
    </div>
  );
};

export default HeaderV2;
