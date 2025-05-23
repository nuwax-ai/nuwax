import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { dataTypes } from '@/pages/Antv-X6/params';
import { DataTypeEnum } from '@/types/enums/common';
import { CascaderChange, CascaderValue } from '@/utils';
import { DeleteOutlined, FileDoneOutlined } from '@ant-design/icons';
import {
  Button,
  Cascader,
  Checkbox,
  FormInstance,
  Input,
  Popover,
  Tooltip,
} from 'antd';
import React, { memo } from 'react';
import { TreeNodeConfig } from '../hooks/useTreeData';

/**
 * 普通树节点标题组件的Props接口
 */
interface TreeNodeTitleProps {
  /** 节点数据 */
  nodeData: TreeNodeConfig;
  /** 表单实例 */
  form: FormInstance;
  /** 是否显示必填复选框 */
  showCheck?: boolean;
  /** 是否不允许添加 */
  isNotAdd?: boolean;
  /** 更新节点字段的回调 */
  onUpdateField: (
    key: string,
    field: string,
    value: any,
    type?: 'Input' | 'Reference',
    dataType?: DataTypeEnum,
  ) => void;
  /** 添加子节点的回调 */
  onAddChild: (parentKey: string) => void;
  /** 删除节点的回调 */
  onDelete: (key: string) => void;
  /** 更新必填状态的回调 */
  onUpdateRequire: (nodeData: TreeNodeConfig, checked: boolean) => void;
}

/**
 * 普通树节点标题组件
 * 负责渲染普通树节点的标题部分，包括输入框、数据类型选择器、操作按钮等
 *
 * 注意：此组件不处理Body类型的特殊逻辑，Body类型请使用TreeNodeTitleBody组件
 *
 * 使用React.memo优化性能，避免不必要的重渲染
 */
const TreeNodeTitle: React.FC<TreeNodeTitleProps> = memo(
  ({
    nodeData,
    form,
    showCheck,
    isNotAdd,
    onUpdateField,
    onAddChild,
    onDelete,
    onUpdateRequire,
  }) => {
    // 判断是否可以添加子节点
    const canAddChild = [
      DataTypeEnum.Object,
      DataTypeEnum.Array_Object,
    ].includes(nodeData.dataType!);

    // 获取数据类型的级联值
    const _dataType = CascaderValue(nodeData.dataType || undefined);

    return (
      <div className="dis-left" style={{ width: '100%' }}>
        {/* 参数名称输入框 */}
        <div
          className="flex-1"
          style={{ position: 'relative', marginRight: '6px' }}
        >
          <Input
            key={nodeData.key}
            defaultValue={nodeData.name}
            onBlur={(e) => onUpdateField(nodeData.key, 'name', e.target.value)}
            disabled={nodeData.systemVariable}
            placeholder="请输入参数名称"
            className="tree-form-name flex-1"
            style={{
              backgroundColor: nodeData.systemVariable ? '#f5f5f5' : undefined,
            }}
          />
        </div>

        {/* 数据类型选择器 */}
        <div style={{ width: '80px', position: 'relative' }}>
          <Cascader
            allowClear={false}
            options={dataTypes}
            defaultValue={_dataType}
            onChange={(value) => {
              onUpdateField(nodeData.key!, 'dataType', CascaderChange(value));
            }}
            changeOnSelect={true}
            disabled={
              nodeData.systemVariable ||
              (!isNotAdd && form.getFieldValue('outputType') === 'Text') ||
              form.getFieldValue('outputType') === 'Markdown' ||
              (nodeData.subArgs && nodeData.subArgs.length > 0)
            }
            placement={'bottomLeft'}
            placeholder="请选择数据类型"
            style={{
              width: '100%',
              backgroundColor: nodeData.systemVariable ? '#f5f5f5' : undefined,
            }}
            className="tree-form-name"
            size="small"
          />
        </div>

        {/* 操作按钮区域 */}
        <div
          className="nested-form-icon-button"
          style={{ width: showCheck ? 60 : 48 }}
        >
          {/* 添加子节点按钮 */}
          {canAddChild && (
            <Tooltip title="新增子节点">
              <Button
                type="text"
                className="tree-icon-style"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(nodeData.key!);
                }}
                icon={<ICON_ASSOCIATION />}
              />
            </Tooltip>
          )}

          {/* 添加描述按钮 */}
          <Popover
            content={
              <Input.TextArea
                key={nodeData.key}
                defaultValue={nodeData.description || ''}
                onBlur={(e) =>
                  onUpdateField(nodeData.key!, 'description', e.target.value)
                }
                rows={3}
              />
            }
            trigger="click"
          >
            <Tooltip title="添加描述">
              <Button
                type="text"
                className="tree-icon-style"
                disabled={nodeData.systemVariable}
                icon={<FileDoneOutlined />}
              />
            </Tooltip>
          </Popover>

          {/* 必填复选框 */}
          {showCheck && (
            <Tooltip title="是否必须">
              <Checkbox
                checked={nodeData.require}
                onChange={(e) => onUpdateRequire(nodeData, e.target.checked)}
                disabled={nodeData.systemVariable}
              />
            </Tooltip>
          )}

          {/* 删除按钮 */}
          <Tooltip title="删除">
            <Button
              type="text"
              disabled={nodeData.systemVariable}
              className="tree-icon-style"
              onClick={() => onDelete(nodeData.key!)}
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数，只有关键属性变化时才重新渲染
    return (
      prevProps.nodeData.key === nextProps.nodeData.key &&
      prevProps.nodeData.name === nextProps.nodeData.name &&
      prevProps.nodeData.dataType === nextProps.nodeData.dataType &&
      prevProps.nodeData.require === nextProps.nodeData.require &&
      prevProps.nodeData.systemVariable === nextProps.nodeData.systemVariable &&
      prevProps.nodeData.description === nextProps.nodeData.description &&
      prevProps.showCheck === nextProps.showCheck &&
      prevProps.isNotAdd === nextProps.isNotAdd
    );
  },
);

// 设置displayName便于调试
TreeNodeTitle.displayName = 'TreeNodeTitle';

export default TreeNodeTitle;
