/**
 * V2 输出参数编辑器
 * 用于显示和编辑节点的输出参数列表
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Button, Input, Select, Tree, Tag, Typography } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

import { DataTypeEnumV2 } from '../../types';
import type { OutputArgV2 } from '../../types';

import './OutputArgsEditorV2.less';

const { Text } = Typography;

// ==================== 类型定义 ====================

export interface OutputArgItem extends OutputArgV2 {
  // 继承 OutputArgV2 类型
}

export interface OutputArgsEditorV2Props {
  /** 参数列表 */
  value?: OutputArgItem[];
  /** 变更回调 */
  onChange?: (value: OutputArgItem[]) => void;
  /** 是否可编辑 */
  editable?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 标题 */
  title?: string;
  /** 是否显示树形结构 */
  treeMode?: boolean;
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

// 数据类型映射
const DATA_TYPE_MAP: Record<string, string> = {
  [DataTypeEnumV2.String]: '字符串',
  [DataTypeEnumV2.Number]: '数字',
  [DataTypeEnumV2.Boolean]: '布尔',
  [DataTypeEnumV2.Object]: '对象',
  [DataTypeEnumV2.Array]: '数组',
  [DataTypeEnumV2.File]: '文件',
};

// ==================== 组件实现 ====================

const OutputArgsEditorV2: React.FC<OutputArgsEditorV2Props> = ({
  value = [],
  onChange,
  editable = false,
  readOnly = false,
  title = '输出参数',
  treeMode = false,
}) => {
  // 添加参数
  const handleAdd = () => {
    if (readOnly || !editable) return;
    const newItem: OutputArgItem = {
      key: uuidv4(),
      name: '',
      dataType: DataTypeEnumV2.String,
      description: '',
    };
    onChange?.([...value, newItem]);
  };

  // 删除参数
  const handleRemove = (key: string) => {
    if (readOnly || !editable) return;
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

  // 获取所有父节点 key（用于默认展开）
  const getAllParentKeys = (data: OutputArgItem[]): React.Key[] => {
    const keys: React.Key[] = [];
    data.forEach((node) => {
      if (node.children && node.children.length > 0) {
        keys.push(node.key);
        keys.push(...getAllParentKeys(node.children as OutputArgItem[]));
      }
    });
    return keys;
  };

  // 渲染树节点标题
  const renderTreeTitle = (nodeData: OutputArgItem) => {
    return (
      <span className="output-args-editor-v2-tree-title">
        <span className="output-args-editor-v2-tree-name">{nodeData.name}</span>
        <Tag color="#C9CDD4" className="output-args-editor-v2-tree-tag">
          {DATA_TYPE_MAP[nodeData.dataType] || nodeData.dataType}
        </Tag>
      </span>
    );
  };

  // 树形模式渲染
  if (treeMode && value.length > 0) {
    return (
      <div className="output-args-editor-v2">
        <div className="output-args-editor-v2-header">
          <span className="output-args-editor-v2-title">{title}</span>
        </div>
        <Tree
          showLine
          defaultExpandAll
          defaultExpandedKeys={getAllParentKeys(value)}
          switcherIcon={<DownOutlined />}
          treeData={value}
          fieldNames={{
            title: 'name',
            key: 'key',
            children: 'children',
          }}
          titleRender={renderTreeTitle}
          className="output-args-editor-v2-tree"
        />
      </div>
    );
  }

  // 列表模式渲染
  return (
    <div className="output-args-editor-v2">
      {/* 头部 */}
      <div className="output-args-editor-v2-header">
        <span className="output-args-editor-v2-title">{title}</span>
        {editable && !readOnly && (
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
        <div className="output-args-editor-v2-list">
          {/* 表头 */}
          <div className="output-args-editor-v2-row output-args-editor-v2-row-header">
            <span className="output-args-editor-v2-col-name">参数名</span>
            <span className="output-args-editor-v2-col-type">类型</span>
            {editable && <span className="output-args-editor-v2-col-actions" />}
          </div>

          {/* 参数项 */}
          {value.map((item) => (
            <div key={item.key} className="output-args-editor-v2-row">
              {/* 参数名 */}
              <div className="output-args-editor-v2-col-name">
                {editable && !readOnly ? (
                  <Input
                    size="small"
                    value={item.name}
                    placeholder="参数名"
                    onChange={(e) =>
                      handleItemChange(item.key, 'name', e.target.value)
                    }
                  />
                ) : (
                  <Text>{item.name}</Text>
                )}
              </div>

              {/* 类型 */}
              <div className="output-args-editor-v2-col-type">
                {editable && !readOnly ? (
                  <Select
                    size="small"
                    value={item.dataType}
                    options={DATA_TYPE_OPTIONS}
                    style={{ width: '100%' }}
                    onChange={(val) =>
                      handleItemChange(item.key, 'dataType', val)
                    }
                  />
                ) : (
                  <Tag color="#C9CDD4">
                    {DATA_TYPE_MAP[item.dataType] || item.dataType}
                  </Tag>
                )}
              </div>

              {/* 操作 */}
              {editable && !readOnly && (
                <div className="output-args-editor-v2-col-actions">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(item.key)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {value.length === 0 && (
        <div className="output-args-editor-v2-empty">
          {editable ? '暂无参数，点击上方 + 按钮添加' : '暂无输出参数'}
        </div>
      )}
    </div>
  );
};

export default OutputArgsEditorV2;
