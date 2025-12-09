/**
 * V2 变量选择器
 * 支持输入值或选择变量引用
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useState, useMemo } from 'react';
import { Input, Dropdown, Tree, Tag, Popover, Empty } from 'antd';
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';

import type { NodePreviousAndArgMapV2, OutputArgV2 } from '../../types';
import { getNodeTypeIconV2 } from '../../constants/stencilConfigV2';

import './VariableSelectorV2.less';

// ==================== 类型定义 ====================

export interface VariableSelectorV2Props {
  /** 当前值 */
  value?: string;
  /** 值类型 */
  valueType?: 'Input' | 'Reference';
  /** 变量引用数据 */
  referenceData?: NodePreviousAndArgMapV2;
  /** 是否循环内部引用 */
  isLoop?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 值变更 */
  onChange?: (value: string) => void;
  /** 引用选择 */
  onReferenceSelect?: (refKey: string) => void;
  /** 清除引用 */
  onClearReference?: () => void;
}

// ==================== 工具函数 ====================

/**
 * 获取变量显示名称
 */
const getDisplayValue = (
  value: string,
  referenceData?: NodePreviousAndArgMapV2,
  isLoop?: boolean
): string => {
  if (!value || !referenceData?.argMap?.[value]) return '';

  const argInfo = referenceData.argMap[value];
  const nodeList = isLoop
    ? referenceData.innerPreviousNodes
    : referenceData.previousNodes;

  // 找到所属节点
  const node = nodeList?.find((n) =>
    n.outputArgs?.some((arg) => findArgByKey(arg, value))
  );

  if (node) {
    return `${node.name}.${argInfo.name}`;
  }
  return argInfo.name;
};

/**
 * 递归查找参数
 */
const findArgByKey = (arg: OutputArgV2, key: string): OutputArgV2 | null => {
  if (arg.key === key) return arg;
  if (arg.children) {
    for (const child of arg.children) {
      const found = findArgByKey(child, key);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 截取显示文本
 */
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// ==================== 组件实现 ====================

const VariableSelectorV2: React.FC<VariableSelectorV2Props> = ({
  value = '',
  valueType = 'Input',
  referenceData,
  isLoop = false,
  disabled = false,
  placeholder = '请输入或引用参数',
  onChange,
  onReferenceSelect,
  onClearReference,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 获取显示值
  const displayValue = useMemo(() => {
    if (valueType === 'Reference' && value) {
      return getDisplayValue(value, referenceData, isLoop);
    }
    return '';
  }, [value, valueType, referenceData, isLoop]);

  // 获取节点列表
  const nodeList = useMemo(() => {
    if (!referenceData) return [];
    return isLoop
      ? referenceData.innerPreviousNodes || []
      : referenceData.previousNodes || [];
  }, [referenceData, isLoop]);

  // 处理输入变更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  // 处理引用选择
  const handleSelect = (keys: React.Key[]) => {
    if (keys.length > 0) {
      const key = keys[0] as string;
      onReferenceSelect?.(key);
      setDropdownOpen(false);
    }
  };

  // 处理清除
  const handleTagClose = () => {
    onClearReference?.();
  };

  // 渲染树节点标题
  const renderTreeTitle = (nodeData: OutputArgV2) => {
    return (
      <div className="variable-selector-v2-tree-title">
        <span className="variable-selector-v2-tree-name">{nodeData.name}</span>
        {nodeData.description && (
          <Popover content={nodeData.description}>
            <InfoCircleOutlined className="variable-selector-v2-tree-info" />
          </Popover>
        )}
        <Tag color="#C9CDD4" className="variable-selector-v2-tree-tag">
          {nodeData.dataType}
        </Tag>
      </div>
    );
  };

  // 构建下拉菜单
  const dropdownItems = useMemo(() => {
    if (!nodeList.length) {
      return [
        {
          key: 'empty',
          label: (
            <div className="variable-selector-v2-empty">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无可引用的变量"
              />
            </div>
          ),
          disabled: true,
        },
      ];
    }

    return nodeList.map((node) => {
      const hasChildren = node.outputArgs?.some(
        (arg) => arg.children && arg.children.length > 0
      );

      return {
        key: node.id,
        label: truncateText(node.name, 16),
        icon: (
          <img
            src={getNodeTypeIconV2(node.type)}
            alt=""
            style={{ width: 16, height: 16 }}
          />
        ),
        popupClassName: 'variable-selector-v2-popup',
        children: node.outputArgs
          ? [
              {
                key: `${node.id}-tree`,
                label: (
                  <div
                    className="variable-selector-v2-tree-wrapper"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tree
                      treeData={node.outputArgs}
                      fieldNames={{
                        title: 'name',
                        key: 'key',
                        children: 'children',
                      }}
                      titleRender={renderTreeTitle}
                      defaultExpandAll
                      blockNode
                      onSelect={handleSelect}
                      className={`variable-selector-v2-tree ${
                        hasChildren ? '' : 'no-children'
                      }`}
                    />
                  </div>
                ),
              },
            ]
          : undefined,
      };
    });
  }, [nodeList]);

  return (
    <div className="variable-selector-v2">
      {/* 引用模式显示 Tag */}
      {valueType === 'Reference' && displayValue ? (
        <Tag
          closable={!disabled}
          onClose={handleTagClose}
          className="variable-selector-v2-tag"
          color="#C9CDD4"
        >
          {displayValue.length > 15 ? (
            <Popover content={displayValue} placement="topRight">
              <span className="variable-selector-v2-tag-text">
                {truncateText(displayValue, 15)}
              </span>
            </Popover>
          ) : (
            <span className="variable-selector-v2-tag-text">{displayValue}</span>
          )}
        </Tag>
      ) : (
        <Input
          size="small"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInputChange}
          className="variable-selector-v2-input"
        />
      )}

      {/* 引用选择器 */}
      <Dropdown
        menu={{ items: dropdownItems }}
        trigger={['click']}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        placement="bottomRight"
        overlayStyle={{ minWidth: 200 }}
        disabled={disabled}
      >
        <SettingOutlined className="variable-selector-v2-icon" />
      </Dropdown>
    </div>
  );
};

export default VariableSelectorV2;
