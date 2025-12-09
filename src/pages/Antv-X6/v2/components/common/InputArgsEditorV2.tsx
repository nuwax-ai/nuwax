/**
 * V2 输入参数编辑器
 * 用于编辑节点的输入参数列表
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Button, Input, Select, Form, Popover, Space } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

import { DataTypeEnumV2 } from '../../types';
import VariableSelectorV2 from './VariableSelectorV2';
import type { NodePreviousAndArgMapV2 } from '../../types';

import './InputArgsEditorV2.less';

// ==================== 类型定义 ====================

export interface InputArgItem {
  key: string;
  name: string;
  dataType: DataTypeEnumV2;
  bindValue: string;
  bindValueType: 'Input' | 'Reference';
  description?: string;
  required?: boolean;
}

export interface InputArgsEditorV2Props {
  /** 参数列表 */
  value?: InputArgItem[];
  /** 变更回调 */
  onChange?: (value: InputArgItem[]) => void;
  /** 变量引用数据 */
  referenceData?: NodePreviousAndArgMapV2;
  /** 占位符文字 */
  placeholder?: string;
  /** 是否允许添加系统变量 */
  allowSystemVariable?: boolean;
  /** 是否禁用添加 */
  disabledAdd?: boolean;
  /** 是否禁用删除 */
  disabledDelete?: boolean;
  /** 是否禁用输入 */
  disabledInput?: boolean;
  /** 是否显示描述按钮 */
  showDescription?: boolean;
  /** 是否循环内部引用 */
  isLoop?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
}

// 数据类型选项
const DATA_TYPE_OPTIONS = [
  { label: '字符串', value: DataTypeEnumV2.String },
  { label: '数字', value: DataTypeEnumV2.Number },
  { label: '布尔', value: DataTypeEnumV2.Boolean },
  { label: '对象', value: DataTypeEnumV2.Object },
  { label: '数组', value: DataTypeEnumV2.Array },
  { label: '文件', value: DataTypeEnumV2.File },
];

// ==================== 组件实现 ====================

const InputArgsEditorV2: React.FC<InputArgsEditorV2Props> = ({
  value = [],
  onChange,
  referenceData,
  placeholder = '请输入参数名',
  disabledAdd = false,
  disabledDelete = false,
  disabledInput = false,
  showDescription = true,
  isLoop = false,
  readOnly = false,
}) => {
  // 添加参数
  const handleAdd = () => {
    if (readOnly || disabledAdd) return;
    const newItem: InputArgItem = {
      key: uuidv4(),
      name: '',
      dataType: DataTypeEnumV2.String,
      bindValue: '',
      bindValueType: 'Input',
      description: '',
      required: false,
    };
    onChange?.([...value, newItem]);
  };

  // 删除参数
  const handleRemove = (key: string) => {
    if (readOnly || disabledDelete) return;
    onChange?.(value.filter((item) => item.key !== key));
  };

  // 更新参数
  const handleItemChange = (key: string, field: string, fieldValue: any) => {
    if (readOnly) return;
    onChange?.(
      value.map((item) =>
        item.key === key ? { ...item, [field]: fieldValue } : item
      )
    );
  };

  // 处理变量引用选择
  const handleReferenceSelect = (key: string, refKey: string) => {
    if (readOnly) return;
    const argInfo = referenceData?.argMap?.[refKey];
    onChange?.(
      value.map((item) =>
        item.key === key
          ? {
              ...item,
              bindValue: refKey,
              bindValueType: 'Reference' as const,
              dataType: argInfo?.dataType || item.dataType,
              name: item.name || argInfo?.name || '',
            }
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
          ? {
              ...item,
              bindValue: '',
              bindValueType: 'Input' as const,
            }
          : item
      )
    );
  };

  return (
    <div className="input-args-editor-v2">
      {/* 头部 */}
      <div className="input-args-editor-v2-header">
        <span className="input-args-editor-v2-title">输入参数</span>
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
        <div className="input-args-editor-v2-list">
          {/* 表头 */}
          <div className="input-args-editor-v2-row input-args-editor-v2-row-header">
            <span className="input-args-editor-v2-col-name">参数名</span>
            <span className="input-args-editor-v2-col-value">变量值</span>
          </div>

          {/* 参数项 */}
          {value.map((item) => (
            <div key={item.key} className="input-args-editor-v2-row">
              {/* 参数名 */}
              <div className="input-args-editor-v2-col-name">
                <Input
                  size="small"
                  value={item.name}
                  placeholder={placeholder}
                  disabled={disabledInput || readOnly}
                  onChange={(e) =>
                    handleItemChange(item.key, 'name', e.target.value)
                  }
                />
              </div>

              {/* 变量值 */}
              <div className="input-args-editor-v2-col-value">
                <VariableSelectorV2
                  value={item.bindValue}
                  valueType={item.bindValueType}
                  referenceData={referenceData}
                  isLoop={isLoop}
                  disabled={readOnly}
                  onChange={(val) =>
                    handleItemChange(item.key, 'bindValue', val)
                  }
                  onReferenceSelect={(refKey) =>
                    handleReferenceSelect(item.key, refKey)
                  }
                  onClearReference={() => handleClearReference(item.key)}
                />
              </div>

              {/* 操作按钮 */}
              <div className="input-args-editor-v2-col-actions">
                {showDescription && (
                  <Popover
                    content={
                      <Input.TextArea
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(
                            item.key,
                            'description',
                            e.target.value
                          )
                        }
                        placeholder="请输入参数描述"
                        autoSize={{ minRows: 3, maxRows: 5 }}
                        disabled={readOnly}
                      />
                    }
                    trigger="click"
                    title="参数描述"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<FileTextOutlined />}
                    />
                  </Popover>
                )}
                {!disabledDelete && !readOnly && (
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
        <div className="input-args-editor-v2-empty">
          暂无参数，点击上方 + 按钮添加
        </div>
      )}
    </div>
  );
};

export default InputArgsEditorV2;
