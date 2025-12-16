// 变量选择器组件
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig, PreviousList } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Popover, Tag, Tree } from 'antd';
import React, { useRef } from 'react';

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
        className="tree-custom-title-style"
        style={{ opacity: isDisabled ? 0.5 : 1 }}
      >
        <span>{nodeData.name}</span>
        <Tag
          color="#C9CDD4"
          style={{ marginLeft: 8, fontSize: 10, lineHeight: '14px' }}
        >
          {nodeData.dataType}
        </Tag>
      </div>
    );
  };

  // 从唯一 key 中提取原始 key
  const extractOriginalKey = (uniqueKey: string): string => {
    const idx = uniqueKey.lastIndexOf('__');
    return idx > 0 ? uniqueKey.substring(0, idx) : uniqueKey;
  };

  // 生成下拉菜单
  const getMenu = (nodes: PreviousList[]) => {
    if (!nodes?.length) {
      return [
        {
          key: 'no-data',
          label: (
            <div style={{ padding: 8, color: 'red' }}>
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
                style={{ padding: '12px 12px 8px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Tree
                  onSelect={(keys) => {
                    if (keys[0]) {
                      const originalKey = extractOriginalKey(keys[0] as string);
                      onSelect(originalKey);
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
                  className="custom-tree-style"
                  style={{ maxHeight: 300, overflow: 'auto' }}
                />
              </div>
            ),
          },
        ],
      };
    });
  };

  return (
    <div className="dis-sb" style={{ flex: 1 }}>
      {displayValue ? (
        <Tag
          closable
          onClose={onClear}
          className="input-or-reference-tag text-ellipsis"
          color="#C9CDD4"
          style={{ maxWidth: '100%', marginRight: 8 }}
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
        <span style={{ color: '#bbb', fontSize: 12, marginRight: 8 }}>
          选择变量
        </span>
      )}
      <Dropdown
        menu={{ items: getMenu(previousNodes) }}
        trigger={['click']}
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
