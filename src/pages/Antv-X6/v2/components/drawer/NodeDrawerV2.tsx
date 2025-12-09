/**
 * V2 NodeDrawer 组件
 *
 * 右侧节点配置抽屉，包含：
 * - 节点头部（图标、名称、描述、操作菜单）
 * - 节点配置表单
 * - 底部操作按钮
 *
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useCallback, useState, useEffect } from 'react';
import { Button, Dropdown, Input, Tooltip, Form } from 'antd';
import type { MenuProps } from 'antd';
import {
  CloseOutlined,
  EditOutlined,
  MoreOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

import type { ChildNodeV2, NodeConfigV2 } from '../../types';
import { NodeTypeEnumV2 } from '../../types';
import { ICONS } from '../../constants/stencilConfigV2';

import './NodeDrawerV2.less';

// ==================== 类型定义 ====================

export interface NodeDrawerV2Props {
  /** 是否可见 */
  visible: boolean;
  /** 当前节点数据 */
  node: ChildNodeV2 | null;
  /** 表单实例 */
  form: ReturnType<typeof Form.useForm<NodeConfigV2>>[0];
  /** 关闭回调 */
  onClose: () => void;
  /** 节点名称修改回调 */
  onNameChange: (name: string, description?: string) => void;
  /** 删除节点回调 */
  onDelete: () => void;
  /** 复制节点回调 */
  onCopy: () => void;
  /** 试运行回调 */
  onTestRun: () => void;
  /** 表单值变化回调 */
  onFormValuesChange?: (changedValues: any, allValues: any) => void;
  /** 子组件（表单内容） */
  children?: React.ReactNode;
}

// ==================== 工具函数 ====================

/**
 * 获取节点背景色
 */
function getNodeBackgroundColor(type: NodeTypeEnumV2): string {
  const colorMap: Partial<Record<NodeTypeEnumV2, string>> = {
    [NodeTypeEnumV2.Start]: '#E6F7FF',
    [NodeTypeEnumV2.End]: '#FFF7E6',
    [NodeTypeEnumV2.LLM]: '#F0F0FF',
    [NodeTypeEnumV2.Code]: '#E6F4FF',
    [NodeTypeEnumV2.Condition]: '#FFFBE6',
    [NodeTypeEnumV2.IntentRecognition]: '#FFF0F6',
    [NodeTypeEnumV2.Loop]: '#F9F0FF',
    [NodeTypeEnumV2.Knowledge]: '#E6FFFB',
    [NodeTypeEnumV2.Variable]: '#FFF2E8',
    [NodeTypeEnumV2.QA]: '#E6FFFB',
    [NodeTypeEnumV2.HTTPRequest]: '#E6F7FF',
    [NodeTypeEnumV2.Output]: '#F9F0FF',
  };
  return colorMap[type] || '#FAFAFA';
}

/**
 * 获取节点图标
 */
function getNodeIcon(type: NodeTypeEnumV2): string {
  const iconMap: Partial<Record<NodeTypeEnumV2, string>> = {
    [NodeTypeEnumV2.LLM]: ICONS.LLM,
    [NodeTypeEnumV2.Plugin]: ICONS.Plugin,
    [NodeTypeEnumV2.Workflow]: ICONS.Workflow,
    [NodeTypeEnumV2.MCP]: ICONS.MCP,
    [NodeTypeEnumV2.Code]: ICONS.Code,
    [NodeTypeEnumV2.Condition]: ICONS.Condition,
    [NodeTypeEnumV2.IntentRecognition]: ICONS.IntentRecognition,
    [NodeTypeEnumV2.Loop]: ICONS.Loop,
    [NodeTypeEnumV2.LoopContinue]: ICONS.LoopContinue,
    [NodeTypeEnumV2.LoopBreak]: ICONS.LoopBreak,
    [NodeTypeEnumV2.Knowledge]: ICONS.Knowledge,
    [NodeTypeEnumV2.Variable]: ICONS.Variable,
    [NodeTypeEnumV2.LongTermMemory]: ICONS.LongTermMemory,
    [NodeTypeEnumV2.TableDataAdd]: ICONS.TableDataAdd,
    [NodeTypeEnumV2.TableDataDelete]: ICONS.TableDataDelete,
    [NodeTypeEnumV2.TableDataUpdate]: ICONS.TableDataUpdate,
    [NodeTypeEnumV2.TableDataQuery]: ICONS.TableDataQuery,
    [NodeTypeEnumV2.TableSQL]: ICONS.TableSQL,
    [NodeTypeEnumV2.QA]: ICONS.QA,
    [NodeTypeEnumV2.TextProcessing]: ICONS.TextProcessing,
    [NodeTypeEnumV2.DocumentExtraction]: ICONS.DocumentExtraction,
    [NodeTypeEnumV2.HTTPRequest]: ICONS.HTTPRequest,
    [NodeTypeEnumV2.Output]: ICONS.Output,
  };
  return iconMap[type] || ICONS.LLM;
}

/**
 * 是否可以删除的节点类型
 */
function canDeleteNode(type: NodeTypeEnumV2): boolean {
  return type !== NodeTypeEnumV2.Start && type !== NodeTypeEnumV2.End;
}

/**
 * 是否支持试运行的节点类型
 */
function canTestRunNode(type: NodeTypeEnumV2): boolean {
  const testRunTypes = [
    NodeTypeEnumV2.LLM,
    NodeTypeEnumV2.Code,
    NodeTypeEnumV2.HTTPRequest,
    NodeTypeEnumV2.Knowledge,
    NodeTypeEnumV2.TextProcessing,
    NodeTypeEnumV2.DocumentExtraction,
    NodeTypeEnumV2.Start,
  ];
  return testRunTypes.includes(type);
}

// ==================== 组件实现 ====================

const NodeDrawerV2: React.FC<NodeDrawerV2Props> = ({
  visible,
  node,
  form,
  onClose,
  onNameChange,
  onDelete,
  onCopy,
  onTestRun,
  onFormValuesChange,
  children,
}) => {
  // 是否编辑名称
  const [isEditingName, setIsEditingName] = useState(false);
  // 临时名称
  const [tempName, setTempName] = useState('');

  // 当节点变化时，重置编辑状态
  useEffect(() => {
    setIsEditingName(false);
    setTempName(node?.name || '');
  }, [node?.id]);

  /**
   * 开始编辑名称
   */
  const handleStartEditName = useCallback(() => {
    setTempName(node?.name || '');
    setIsEditingName(true);
  }, [node?.name]);

  /**
   * 保存名称
   */
  const handleSaveName = useCallback(() => {
    if (tempName.trim()) {
      onNameChange(tempName.trim());
    }
    setIsEditingName(false);
  }, [tempName, onNameChange]);

  /**
   * 取消编辑
   */
  const handleCancelEdit = useCallback(() => {
    setTempName(node?.name || '');
    setIsEditingName(false);
  }, [node?.name]);

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveName();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveName, handleCancelEdit],
  );

  /**
   * 操作菜单
   */
  const menuItems: MenuProps['items'] = node
    ? [
        canTestRunNode(node.type) && {
          key: 'testRun',
          icon: <PlayCircleOutlined />,
          label: '试运行',
          onClick: onTestRun,
        },
        {
          key: 'rename',
          icon: <EditOutlined />,
          label: '重命名',
          onClick: handleStartEditName,
        },
        {
          key: 'copy',
          icon: <CopyOutlined />,
          label: '复制',
          onClick: onCopy,
        },
        canDeleteNode(node.type) && {
          type: 'divider',
        },
        canDeleteNode(node.type) && {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '删除',
          danger: true,
          onClick: onDelete,
        },
      ].filter(Boolean) as MenuProps['items']
    : [];

  if (!visible || !node) {
    return null;
  }

  const backgroundColor = getNodeBackgroundColor(node.type);
  const iconUrl = typeof node.icon === 'string' ? node.icon : getNodeIcon(node.type);

  return (
    <div className="node-drawer-v2">
      {/* 头部 */}
      <div
        className="node-drawer-v2-header"
        style={{ backgroundColor }}
      >
        <div className="node-drawer-v2-header-left">
          <img
            src={iconUrl}
            alt=""
            className="node-drawer-v2-icon"
          />
          <div className="node-drawer-v2-info">
            {isEditingName ? (
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                autoFocus
                size="small"
                className="node-drawer-v2-name-input"
              />
            ) : (
              <div className="node-drawer-v2-name" onClick={handleStartEditName}>
                <span>{node.name}</span>
                <EditOutlined className="node-drawer-v2-edit-icon" />
              </div>
            )}
            {node.description && (
              <Tooltip title={node.description}>
                <div className="node-drawer-v2-desc">{node.description}</div>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="node-drawer-v2-header-right">
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </div>
      </div>

      {/* 表单内容 */}
      <div className="node-drawer-v2-body">
        <Form
          form={form}
          layout="vertical"
          onValuesChange={onFormValuesChange}
          className="node-drawer-v2-form"
        >
          {children}
        </Form>
      </div>
    </div>
  );
};

export default NodeDrawerV2;
