/**
 * V2 键值对编辑器
 * 用于编辑 HTTP 请求头、参数等键值对
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

import VariableSelectorV2 from './VariableSelectorV2';
import type { NodePreviousAndArgMapV2 } from '../../types';

import './KeyValueEditorV2.less';

// ==================== 类型定义 ====================

export interface KeyValueItem {
  key: string;
  name: string;
  value: string;
  valueType?: 'Input' | 'Reference';
}

export interface KeyValueEditorV2Props {
  /** 键值对列表 */
  value?: KeyValueItem[];
  /** 变更回调 */
  onChange?: (value: KeyValueItem[]) => void;
  /** 变量引用数据 */
  referenceData?: NodePreviousAndArgMapV2;
  /** 是否支持变量引用 */
  supportReference?: boolean;
  /** 键占位符 */
  keyPlaceholder?: string;
  /** 值占位符 */
  valuePlaceholder?: string;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否禁用添加 */
  disabledAdd?: boolean;
  /** 标题 */
  title?: string;
}

// ==================== 组件实现 ====================

const KeyValueEditorV2: React.FC<KeyValueEditorV2Props> = ({
  value = [],
  onChange,
  referenceData,
  supportReference = true,
  keyPlaceholder = '键名',
  valuePlaceholder = '键值',
  readOnly = false,
  disabledAdd = false,
  title,
}) => {
  // 添加键值对
  const handleAdd = () => {
    if (readOnly || disabledAdd) return;
    const newItem: KeyValueItem = {
      key: uuidv4(),
      name: '',
      value: '',
      valueType: 'Input',
    };
    onChange?.([...value, newItem]);
  };

  // 删除键值对
  const handleRemove = (key: string) => {
    if (readOnly) return;
    onChange?.(value.filter((item) => item.key !== key));
  };

  // 更新键
  const handleKeyChange = (key: string, name: string) => {
    if (readOnly) return;
    onChange?.(
      value.map((item) => (item.key === key ? { ...item, name } : item))
    );
  };

  // 更新值
  const handleValueChange = (key: string, val: string) => {
    if (readOnly) return;
    onChange?.(
      value.map((item) =>
        item.key === key ? { ...item, value: val, valueType: 'Input' } : item
      )
    );
  };

  // 处理变量引用
  const handleReferenceSelect = (key: string, refKey: string) => {
    if (readOnly) return;
    onChange?.(
      value.map((item) =>
        item.key === key
          ? { ...item, value: refKey, valueType: 'Reference' as const }
          : item
      )
    );
  };

  // 清除引用
  const handleClearReference = (key: string) => {
    if (readOnly) return;
    onChange?.(
      value.map((item) =>
        item.key === key
          ? { ...item, value: '', valueType: 'Input' as const }
          : item
      )
    );
  };

  return (
    <div className="key-value-editor-v2">
      {/* 头部 */}
      <div className="key-value-editor-v2-header">
        {title && <span className="key-value-editor-v2-title">{title}</span>}
        {!disabledAdd && !readOnly && (
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          />
        )}
      </div>

      {/* 列表 */}
      {value.length > 0 && (
        <div className="key-value-editor-v2-list">
          {/* 表头 */}
          <div className="key-value-editor-v2-row key-value-editor-v2-row-header">
            <span className="key-value-editor-v2-col-key">键名</span>
            <span className="key-value-editor-v2-col-value">键值</span>
            <span className="key-value-editor-v2-col-actions" />
          </div>

          {/* 键值对项 */}
          {value.map((item) => (
            <div key={item.key} className="key-value-editor-v2-row">
              {/* 键名 */}
              <div className="key-value-editor-v2-col-key">
                <Input
                  size="small"
                  value={item.name}
                  placeholder={keyPlaceholder}
                  disabled={readOnly}
                  onChange={(e) => handleKeyChange(item.key, e.target.value)}
                />
              </div>

              {/* 键值 */}
              <div className="key-value-editor-v2-col-value">
                {supportReference ? (
                  <VariableSelectorV2
                    value={item.value}
                    valueType={item.valueType}
                    referenceData={referenceData}
                    disabled={readOnly}
                    placeholder={valuePlaceholder}
                    onChange={(val) => handleValueChange(item.key, val)}
                    onReferenceSelect={(refKey) =>
                      handleReferenceSelect(item.key, refKey)
                    }
                    onClearReference={() => handleClearReference(item.key)}
                  />
                ) : (
                  <Input
                    size="small"
                    value={item.value}
                    placeholder={valuePlaceholder}
                    disabled={readOnly}
                    onChange={(e) => handleValueChange(item.key, e.target.value)}
                  />
                )}
              </div>

              {/* 操作 */}
              <div className="key-value-editor-v2-col-actions">
                {!readOnly && (
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(item.key)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {value.length === 0 && (
        <div className="key-value-editor-v2-empty">
          暂无数据，点击上方 + 按钮添加
        </div>
      )}
    </div>
  );
};

export default KeyValueEditorV2;
