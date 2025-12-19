// 变量选择器组件
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig, PreviousList } from '@/types/interfaces/node';
import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Popover, Tag, Tree } from 'antd';
import React, { useRef, useState } from 'react';
import { returnImg } from '../../utils/workflowV3';
import './index.less';

// 扩展类型，添加 disabled 和 originalKey 属性
type FilteredArg = InputAndOutConfig & {
  disabled?: boolean;
  originalKey?: string;
};

interface VariableSelectorProps {
  displayValue: string;
  allowedType: DataTypeEnum | undefined;
  selectedKeys: Set<string>;
  previousNodes: PreviousList[];
  onSelect: (selectedKey: string) => void;
  onClear: () => void;
}

/**
 * 变量选择器组件
 * 用于选择上级节点的输出变量
 */
const VariableSelector: React.FC<VariableSelectorProps> = ({
  displayValue,
  allowedType,
  selectedKeys,
  previousNodes,
  onSelect,
  onClear,
}) => {
  // 使用 useRef 持久化计数器，确保跨渲染唯一
  const keyCounterRef = useRef(0);
  // 控制下拉菜单显示状态
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 过滤变量树，添加节点前缀确保不同节点的树有不同的 key
  const filterOutputArgs = (
    outputArgs: InputAndOutConfig[],
    allowedType: DataTypeEnum | undefined,
    selectedKeys: Set<string>,
    nodePrefix: string,
  ): FilteredArg[] => {
    return outputArgs
      .map((arg): FilteredArg => {
        const originalKey = arg.key || '';
        const isDisabled =
          selectedKeys.has(originalKey) ||
          (allowedType && arg.dataType !== allowedType);

        const filteredChildren = arg.children
          ? filterOutputArgs(
              arg.children,
              allowedType,
              selectedKeys,
              nodePrefix,
            )
          : undefined;

        // 生成唯一 key：节点前缀 + 原始key + 递增计数器
        const uniqueKey = `${nodePrefix}_${originalKey}__${keyCounterRef.current++}`;

        return {
          ...arg,
          key: uniqueKey,
          originalKey: originalKey,
          disabled: isDisabled,
          children: filteredChildren,
        };
      })
      .filter((arg) => !selectedKeys.has(arg.originalKey || ''));
  };

  // 渲染树节点标题
  const renderTitle = (nodeData: FilteredArg) => {
    const isDisabled = nodeData.disabled;
    return (
      <div
        className={`tree-custom-title-style tree-title-container ${
          isDisabled ? 'disabled' : ''
        }`}
      >
        <span>{nodeData.name}</span>
        <Popover content={nodeData.description || '暂无描述'}>
          <span className="info-icon">?</span>
        </Popover>
        <Tag color="#C9CDD4" className="data-type-tag">
          {nodeData.dataType}
        </Tag>
      </div>
    );
  };

  // 生成下拉菜单
  const getMenu = (nodes: PreviousList[]) => {
    if (!nodes?.length) {
      return [
        {
          key: 'no-data',
          label: (
            <div className="no-data-tip">
              未添加上级节点连线或上级节点无参数
            </div>
          ),
          disabled: true,
        },
      ];
    }

    return nodes.map((node) => {
      const filteredOutputArgs = filterOutputArgs(
        node.outputArgs || [],
        allowedType,
        selectedKeys,
        String(node.id), // 添加节点ID作为前缀确保唯一性
      );

      return {
        key: node.id,
        label:
          node.name.length > 12 ? node.name.slice(0, 12) + '...' : node.name,
        icon: returnImg(node.type),
        popupClassName: 'inputOrReferencePopup',
        children: [
          {
            key: `${node.id}-tree`,
            label: (
              <div
                className="tree-container"
                onClick={(e) => e.stopPropagation()}
              >
                <Tree
                  onSelect={(_, info) => {
                    const nodeData = info.node as unknown as FilteredArg;
                    if (nodeData.originalKey) {
                      onSelect(nodeData.originalKey);
                      setDropdownOpen(false); // 选中后关闭下拉菜单
                    }
                  }}
                  defaultExpandAll
                  treeData={filteredOutputArgs}
                  fieldNames={{
                    title: 'name',
                    key: 'key',
                    children: 'children',
                  }}
                  titleRender={renderTitle}
                  blockNode
                  className="custom-tree-style custom-tree"
                />
              </div>
            ),
          },
        ],
      };
    });
  };

  return (
    <div className="dis-sb variable-selector-container">
      {displayValue ? (
        <Tag
          closable
          onClose={onClear}
          className="input-or-reference-tag text-ellipsis variable-tag"
          color="#C9CDD4"
        >
          {displayValue.length > 15 ? (
            <Popover content={displayValue} placement="topRight">
              <span className="tag-text-style">{displayValue}</span>
            </Popover>
          ) : (
            <span className="tag-text-style">{displayValue}</span>
          )}
        </Tag>
      ) : (
        <span className="placeholder-text">选择变量</span>
      )}
      <Dropdown
        menu={{ items: getMenu(previousNodes) }}
        trigger={['click']}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        overlayStyle={{ minWidth: 200 }}
        placement="bottomRight"
      >
        <SettingOutlined
          style={{ cursor: 'pointer' }}
          className="input-reference-icon-style"
        />
      </Dropdown>
    </div>
  );
};

export default VariableSelector;
