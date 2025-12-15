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

import {
  CaretRightFilled,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Form, Input, Popover } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import { ICONS } from '../../constants/stencilConfigV2';
import type { ChildNodeV2, NodeConfigV2 } from '../../types';
import { NodeTypeEnumV2 } from '../../types';
import NodePanelDrawerV2 from './nodeConfig/NodePanelDrawerV2';
// 导入 V1 的 returnImg 用于获取 SVG 图标
import { returnImg } from '@/utils/workflow';

import './NodeDrawerV2.less';
// 导入 V1 样式以确保节点配置组件样式兼容
import '@/pages/Antv-X6/index.less';

// ==================== 类型定义 ====================

export interface NodeDrawerV2Props {
  /** 是否可见 */
  open: boolean;
  /** 当前节点数据 */
  node: ChildNodeV2 | null;
  /** 变量引用数据 */
  referenceData?: any;
  /** 关闭回调 */
  onClose: () => void;
  /** 节点配置变更回调 */
  onNodeConfigChange?: (changedValues: any, allValues: NodeConfigV2) => void;
  /** 节点名称变更回调 */
  onNodeNameChange?: (nodeId: number, name: string) => void;
  /** 节点描述变更回调 */
  onNodeDescChange?: (nodeId: number, description: string) => void;
  /** 删除节点回调 */
  onNodeDelete?: (nodeId: number, node?: ChildNodeV2) => void;
  /** 复制节点回调 */
  onNodeCopy?: (node: ChildNodeV2) => void;
  /** 试运行回调 */
  onTestRun?: () => void;
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
 * 是否可以重命名的节点类型（开始/结束节点不可重命名）
 */
function canRenameNode(type: NodeTypeEnumV2): boolean {
  return type !== NodeTypeEnumV2.Start && type !== NodeTypeEnumV2.End;
}

/**
 * 是否可以复制的节点类型（开始/结束节点不可复制）
 */
function canCopyNode(type: NodeTypeEnumV2): boolean {
  return type !== NodeTypeEnumV2.Start && type !== NodeTypeEnumV2.End;
}

/**
 * 是否支持试运行的节点类型（与 V1 testRunList 保持一致）
 */
function canTestRunNode(type: NodeTypeEnumV2): boolean {
  const testRunTypes = [
    NodeTypeEnumV2.Start,
    NodeTypeEnumV2.LLM,
    NodeTypeEnumV2.Plugin,
    NodeTypeEnumV2.Code,
    NodeTypeEnumV2.HTTPRequest,
    NodeTypeEnumV2.TextProcessing,
    NodeTypeEnumV2.Workflow,
    NodeTypeEnumV2.DocumentExtraction,
    NodeTypeEnumV2.Knowledge,
    NodeTypeEnumV2.TableSQL,
    NodeTypeEnumV2.TableDataQuery,
    NodeTypeEnumV2.TableDataUpdate,
    NodeTypeEnumV2.TableDataDelete,
    NodeTypeEnumV2.TableDataAdd,
  ];
  return testRunTypes.includes(type);
}

// ==================== 组件实现 ====================

const NodeDrawerV2: React.FC<NodeDrawerV2Props> = ({
  open,
  node,
  referenceData,
  onClose,
  onNodeConfigChange,
  onNodeNameChange,
  onNodeDescChange,
  onNodeDelete,
  onNodeCopy,
  onTestRun,
}) => {
  // 内部表单实例
  const [form] = Form.useForm<NodeConfigV2>();

  // 是否编辑名称
  const [isEditingName, setIsEditingName] = useState(false);
  // 临时名称
  const [tempName, setTempName] = useState('');

  // 是否编辑描述
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  // 临时描述
  const [tempDesc, setTempDesc] = useState('');

  // 当节点变化时，重置编辑状态并设置表单值
  useEffect(() => {
    setIsEditingName(false);
    setTempName(node?.name || '');
    setIsEditingDesc(false);
    setTempDesc(node?.description || '');
    if (node?.nodeConfig) {
      form.setFieldsValue(node.nodeConfig);
    }
  }, [node?.id, node?.nodeConfig, form, node?.name, node?.description]);

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
    const newName = tempName.trim();
    if (newName && node && newName !== node.name) {
      onNodeNameChange?.(node.id, newName);
    }
    setIsEditingName(false);
  }, [tempName, node, onNodeNameChange]);

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
   * 开始编辑描述
   */
  const handleStartEditDesc = useCallback(() => {
    setTempDesc(node?.description || '');
    setIsEditingDesc(true);
  }, [node?.description]);

  /**
   * 保存描述
   */
  const handleSaveDesc = useCallback(() => {
    const newDesc = tempDesc.trim();
    if (node && newDesc !== node.description) {
      // 保存描述到节点的 description 属性
      onNodeDescChange?.(node.id, newDesc);
    }
    setIsEditingDesc(false);
  }, [tempDesc, node, onNodeDescChange]);

  /**
   * 描述键盘事件
   */
  const handleDescKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveDesc();
      } else if (e.key === 'Escape') {
        setIsEditingDesc(false);
      }
    },
    [handleSaveDesc],
  );

  /**
   * 表单值变化处理
   */
  const handleFormValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      console.log('[V2 DEBUG] NodeDrawerV2 onValuesChange:', {
        changedValues,
        allValues,
        nodeId: node?.id,
      });
      if (node && onNodeConfigChange) {
        onNodeConfigChange(changedValues, {
          ...node.nodeConfig,
          ...allValues,
        });
      }
    },
    [node, onNodeConfigChange],
  );

  /**
   * 操作菜单
   */
  const menuItems: MenuProps['items'] = node
    ? ([
        canTestRunNode(node.type) &&
          onTestRun && {
            key: 'testRun',
            icon: <CaretRightFilled />,
            label: '试运行',
            onClick: onTestRun,
          },
        canRenameNode(node.type) && {
          key: 'rename',
          icon: <EditOutlined />,
          label: '重命名',
          onClick: handleStartEditName,
        },
        canCopyNode(node.type) &&
          onNodeCopy && {
            key: 'copy',
            icon: <CopyOutlined />,
            label: '复制',
            onClick: () => onNodeCopy(node),
          },
        canDeleteNode(node.type) &&
          onNodeDelete && {
            type: 'divider',
          },
        canDeleteNode(node.type) &&
          onNodeDelete && {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除',
            danger: true,
            onClick: () => onNodeDelete(node.id, node),
          },
      ].filter(Boolean) as MenuProps['items'])
    : [];

  if (!open || !node) {
    return null;
  }

  const backgroundColor = getNodeBackgroundColor(node.type);
  const iconUrl =
    typeof node.icon === 'string' ? node.icon : getNodeIcon(node.type);
  // V1 样式：渐变背景从节点颜色到白色
  const gradientBackground = `linear-gradient(to bottom, ${backgroundColor} 0, white 42px)`;

  return (
    <div
      className="node-drawer-v2 fold-wrap-style"
      style={{ background: gradientBackground, paddingTop: '3px' }}
    >
      {/* 头部 - 对齐 V1 FoldWrap 布局 */}
      <div className="node-drawer-v2-header">
        {/* 第一行：图标 + 标题 + 操作按钮 + 关闭按钮 */}
        <div
          className="node-drawer-v2-header-row1"
          style={{ color: backgroundColor }}
        >
          <div className="node-drawer-v2-header-left">
            {/* 使用 V1 的 returnImg 渲染 SVG 图标 */}
            <div className="node-drawer-v2-icon">
              {returnImg(node.type as any)}
            </div>
            {isEditingName ? (
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                autoFocus
                maxLength={25}
                className="node-drawer-v2-name-input"
              />
            ) : (
              <div
                className="node-drawer-v2-name"
                onDoubleClick={
                  canRenameNode(node.type) ? handleStartEditName : undefined
                }
                style={{
                  cursor: canRenameNode(node.type) ? 'pointer' : 'default',
                }}
              >
                <span>{node.name}</span>
              </div>
            )}
          </div>

          <div className="node-drawer-v2-header-right">
            {/* 试运行按钮 - 仅对支持试运行的节点显示 */}
            {canTestRunNode(node.type) && onTestRun && (
              <Popover placement="top" content={'测试该节点'}>
                <Button
                  type="text"
                  icon={<CaretRightFilled />}
                  size="small"
                  style={{ marginRight: '6px', fontSize: '12px' }}
                  onClick={onTestRun}
                />
              </Popover>
            )}
            {/* 更多操作按钮 - 开始/结束节点不显示 */}
            {canRenameNode(node.type) && (
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            )}
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>
        </div>

        {/* 第二行：节点描述 */}
        {(node.description || isEditingDesc) && (
          <div className="node-drawer-v2-header-row2">
            {isEditingDesc ? (
              <Input.TextArea
                value={tempDesc}
                onChange={(e) => setTempDesc(e.target.value)}
                onBlur={handleSaveDesc}
                onKeyDown={handleDescKeyDown}
                autoFocus
                rows={2}
                style={{ resize: 'none' }}
                className="node-drawer-v2-desc-input"
              />
            ) : (
              <Popover
                title={node.description}
                styles={{ body: { width: '300px' } }}
                trigger="click"
              >
                <div
                  className="node-drawer-v2-desc"
                  onDoubleClick={handleStartEditDesc}
                >
                  {node.description}
                </div>
              </Popover>
            )}
          </div>
        )}
      </div>

      {/* 分割线 - 对齐 V1 divider-horizontal */}
      <div className="node-drawer-v2-divider" />

      {/* 表单内容 */}
      <div className="node-drawer-v2-body dispose-node-style">
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormValuesChange}
          className="node-drawer-v2-form"
        >
          <NodePanelDrawerV2
            node={node}
            form={form}
            referenceData={referenceData}
            onNodeConfigChange={onNodeConfigChange}
          />
        </Form>
      </div>
    </div>
  );
};

export default NodeDrawerV2;
