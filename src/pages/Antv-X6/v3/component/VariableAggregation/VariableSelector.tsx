// Variable selector component.
import { t } from '@/services/i18nRuntime';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig, PreviousList } from '@/types/interfaces/node';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Dropdown, Popover, Tag, Tree } from 'antd';
import React, { useRef, useState } from 'react';
import { returnImg } from '../../utils/workflowV3';
import './index.less';

// Extended arg type with local UI fields.
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
 * Selector for output variables from upstream nodes.
 */
const VariableSelector: React.FC<VariableSelectorProps> = ({
  displayValue,
  allowedType,
  selectedKeys,
  previousNodes,
  onSelect,
  onClear,
}) => {
  // Keep stable incremental suffix across renders.
  const keyCounterRef = useRef(0);
  // Dropdown visibility state.
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Filter and namespace keys per upstream node.
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

        // Unique key: node prefix + original key + local counter.
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

  // Render tree node title.
  const renderTitle = (nodeData: FilteredArg) => {
    const isDisabled = nodeData.disabled;
    return (
      <div
        className={`tree-custom-title-style tree-title-container ${
          isDisabled ? 'disabled' : ''
        }`}
      >
        <span>{nodeData.name}</span>
        <Popover
          content={
            nodeData.description ||
            t('PC.Pages.AntvX6VariableAggregation.noDescription')
          }
        >
          <InfoCircleOutlined
            style={{ marginLeft: '4px', fontSize: 12, cursor: 'help' }}
          />
        </Popover>
        <Tag
          color="#C9CDD4"
          style={{ marginLeft: 8, fontSize: 10, lineHeight: '14px' }}
        >
          {nodeData.dataType}
        </Tag>
      </div>
    );
  };

  // Build dropdown menu.
  const getMenu = (nodes: PreviousList[]) => {
    if (!nodes?.length) {
      return [
        {
          key: 'no-data',
          label: (
            <div className="no-data-tip">
              {t('PC.Pages.AntvX6VariableAggregation.noUpstreamNodeOrParams')}
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
        String(node.id),
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
                      setDropdownOpen(false);
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
        <span className="placeholder-text">
          {t('PC.Pages.AntvX6VariableAggregation.selectVariable')}
        </span>
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
