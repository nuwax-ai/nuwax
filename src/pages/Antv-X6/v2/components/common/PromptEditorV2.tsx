/**
 * V2 Prompt 编辑器
 * 支持变量引用的富文本编辑器
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input, Dropdown, Tree, Tag, Popover, Empty, Button } from 'antd';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';

import type { NodePreviousAndArgMapV2, OutputArgV2 } from '../../types';
import { getNodeTypeIconV2 } from '../../constants/stencilConfigV2';

import './PromptEditorV2.less';

const { TextArea } = Input;

// ==================== 类型定义 ====================

export interface PromptEditorV2Props {
  /** 当前值 */
  value?: string;
  /** 变更回调 */
  onChange?: (value: string) => void;
  /** 变量引用数据 */
  referenceData?: NodePreviousAndArgMapV2;
  /** 是否循环内部引用 */
  isLoop?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 最小行数 */
  minRows?: number;
  /** 最大行数 */
  maxRows?: number;
  /** 是否只读 */
  readOnly?: boolean;
}

// ==================== 组件实现 ====================

const PromptEditorV2: React.FC<PromptEditorV2Props> = ({
  value = '',
  onChange,
  referenceData,
  isLoop = false,
  disabled = false,
  placeholder = '请输入提示词，使用 {{ 变量名 }} 引用变量',
  minRows = 4,
  maxRows = 12,
  readOnly = false,
}) => {
  const textAreaRef = useRef<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // 获取节点列表
  const nodeList = React.useMemo(() => {
    if (!referenceData) return [];
    return isLoop
      ? referenceData.innerPreviousNodes || []
      : referenceData.previousNodes || [];
  }, [referenceData, isLoop]);

  // 处理文本变更
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  // 记录光标位置
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart || 0);
  };

  // 插入变量引用
  const insertVariable = (variableKey: string) => {
    if (readOnly || disabled) return;

    const argInfo = referenceData?.argMap?.[variableKey];
    if (!argInfo) return;

    // 构建变量引用格式
    const variableRef = `{{${variableKey}}}`;

    // 在光标位置插入
    const before = value.slice(0, cursorPosition);
    const after = value.slice(cursorPosition);
    const newValue = before + variableRef + after;

    onChange?.(newValue);
    setDropdownOpen(false);

    // 更新光标位置
    setTimeout(() => {
      if (textAreaRef.current?.resizableTextArea?.textArea) {
        const newPosition = cursorPosition + variableRef.length;
        textAreaRef.current.resizableTextArea.textArea.setSelectionRange(
          newPosition,
          newPosition
        );
        textAreaRef.current.resizableTextArea.textArea.focus();
      }
    }, 0);
  };

  // 渲染树节点标题
  const renderTreeTitle = (nodeData: OutputArgV2) => {
    return (
      <div className="prompt-editor-v2-tree-title">
        <span className="prompt-editor-v2-tree-name">{nodeData.name}</span>
        {nodeData.description && (
          <Popover content={nodeData.description}>
            <InfoCircleOutlined className="prompt-editor-v2-tree-info" />
          </Popover>
        )}
        <Tag color="#C9CDD4" className="prompt-editor-v2-tree-tag">
          {nodeData.dataType}
        </Tag>
      </div>
    );
  };

  // 处理树选择
  const handleTreeSelect = (keys: React.Key[]) => {
    if (keys.length > 0) {
      insertVariable(keys[0] as string);
    }
  };

  // 构建下拉菜单
  const dropdownItems = React.useMemo(() => {
    if (!nodeList.length) {
      return [
        {
          key: 'empty',
          label: (
            <div className="prompt-editor-v2-empty">
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
        label: node.name.length > 16 ? node.name.slice(0, 16) + '...' : node.name,
        icon: (
          <img
            src={getNodeTypeIconV2(node.type)}
            alt=""
            style={{ width: 16, height: 16 }}
          />
        ),
        popupClassName: 'prompt-editor-v2-popup',
        children: node.outputArgs
          ? [
              {
                key: `${node.id}-tree`,
                label: (
                  <div
                    className="prompt-editor-v2-tree-wrapper"
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
                      onSelect={handleTreeSelect}
                      className={`prompt-editor-v2-tree ${
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
  }, [nodeList, cursorPosition]);

  return (
    <div className="prompt-editor-v2">
      {/* 工具栏 */}
      <div className="prompt-editor-v2-toolbar">
        <Dropdown
          menu={{ items: dropdownItems }}
          trigger={['click']}
          open={dropdownOpen}
          onOpenChange={setDropdownOpen}
          placement="bottomLeft"
          overlayStyle={{ minWidth: 200 }}
          disabled={disabled || readOnly}
        >
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            disabled={disabled || readOnly}
          >
            插入变量
          </Button>
        </Dropdown>
      </div>

      {/* 编辑区 */}
      <TextArea
        ref={textAreaRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onClick={handleSelect}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        autoSize={{ minRows, maxRows }}
        className="prompt-editor-v2-textarea"
      />

      {/* 提示 */}
      <div className="prompt-editor-v2-hint">
        使用 <code>{`{{变量key}}`}</code> 格式引用变量
      </div>
    </div>
  );
};

export default PromptEditorV2;
