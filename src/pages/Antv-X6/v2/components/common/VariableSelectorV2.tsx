/**
 * V2 变量选择器
 * 支持输入值或选择变量引用
 * 完全独立，不依赖 v1 任何代码
 */

import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Dropdown, Empty, Input, Popover, Tag, Tree } from 'antd';
import React, { useMemo, useState } from 'react';

import { getNodeTypeIconV2 } from '../../constants/stencilConfigV2';
import type { InputAndOutConfigV2, NodePreviousAndArgMapV2 } from '../../types';

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
  /** 过滤数据类型 */
  filterType?: string[];
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 值变更 */
  onChange?: (value: string) => void;
  /** 引用选择 */
  onReferenceSelect?: (refKey: string) => void;
  /** 清除引用 */
  onClearReference?: () => void;
}

// ==================== 工具函数 ====================

/**
 * 递归查找参数
 */
const findArgByKey = (
  arg: InputAndOutConfigV2,
  key: string,
): InputAndOutConfigV2 | null => {
  if (arg.key === key) return arg;
  const children = arg.children || arg.subArgs;
  if (children) {
    for (const child of children) {
      const found = findArgByKey(child, key);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 获取变量显示名称
 */
const getDisplayValue = (
  value: string,
  referenceData?: NodePreviousAndArgMapV2,
  isLoop?: boolean,
): string => {
  if (!value || !referenceData?.argMap?.[value]) return '';

  const argInfo = referenceData.argMap[value];
  const nodeList = isLoop
    ? referenceData.innerPreviousNodes
    : referenceData.previousNodes;

  // 找到所属节点
  const node = nodeList?.find((n) =>
    n.outputArgs?.some((arg) => findArgByKey(arg, value)),
  );

  if (node) {
    return `${node.name}.${argInfo.name}`;
  }
  return argInfo.name;
};

/**
 * 转换参数数据为 Tree 可用的格式
 * 处理 subArgs/children 字段名不一致的问题
 */
const convertArgsToTreeData = (
  args: InputAndOutConfigV2[],
): InputAndOutConfigV2[] => {
  return args.map((arg) => {
    const children = arg.children || arg.subArgs;
    return {
      ...arg,
      children: children ? convertArgsToTreeData(children) : undefined,
    };
  });
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
  filterType,
  style,
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

  // 获取节点列表（支持类型过滤）
  const nodeList = useMemo(() => {
    if (!referenceData) return [];
    const list = isLoop
      ? referenceData.innerPreviousNodes || []
      : referenceData.previousNodes || [];

    // 如果没有指定过滤类型，返回全部
    if (!filterType || filterType.length === 0) return list;

    // 过滤节点的输出参数，只保留匹配类型的参数
    return list
      .map((node) => ({
        ...node,
        outputArgs:
          node.outputArgs?.filter((arg) =>
            filterType.some((type) => arg.dataType?.includes(type)),
          ) || [],
      }))
      .filter((node) => node.outputArgs.length > 0);
  }, [referenceData, isLoop, filterType]);

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
  const renderTreeTitle = (nodeData: InputAndOutConfigV2) => {
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
      const treeData = node.outputArgs
        ? convertArgsToTreeData(node.outputArgs)
        : [];
      const hasChildren = treeData.some(
        (arg) => arg.children && arg.children.length > 0,
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
        children:
          treeData.length > 0
            ? [
                {
                  key: `${node.id}-tree`,
                  label: (
                    <div
                      className="variable-selector-v2-tree-wrapper"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tree
                        treeData={treeData}
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
    <div className="variable-selector-v2" style={style}>
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
            <span className="variable-selector-v2-tag-text">
              {displayValue}
            </span>
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
