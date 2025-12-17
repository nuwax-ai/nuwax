import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { useWorkflowModel } from '@/hooks/useWorkflowModel';
import { dataTypes } from '@/pages/Antv-X6/params';
import { DataTypeEnum } from '@/types/enums/common';
import { CascaderChange, CascaderValue } from '@/utils';
import { DeleteOutlined, FileDoneOutlined } from '@ant-design/icons';
import { Button, Cascader, Checkbox, Input, Popover, Tooltip } from 'antd';
import React, { memo } from 'react';
import InputOrReferenceFormTree from '../InputOrReferenceFormTree';
import { TreeNodeConfig } from '../hooks/useTreeData';

/**
 * Body类型树节点标题组件的Props接口
 */
interface TreeNodeTitleBodyProps {
  /** 节点数据 */
  nodeData: TreeNodeConfig;
  /** 是否显示必填复选框 */
  showCheck?: boolean;
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
 * Body类型树节点标题组件
 * 专门处理Body类型节点的特殊逻辑和渲染
 *
 * 特殊逻辑：
 * - 数据类型选择器被禁用
 * - 包含输入或引用组件
 * - 当选择引用类型且为Object时，不显示添加子节点按钮
 * - 宽度计算包含额外的输入引用区域
 */
const TreeNodeTitleBody: React.FC<TreeNodeTitleBodyProps> = memo(
  ({
    nodeData,
    showCheck,
    onUpdateField,
    onAddChild,
    onDelete,
    onUpdateRequire,
  }) => {
    // 判断是否可以添加子节点
    const canAddChild =
      [DataTypeEnum.Object, DataTypeEnum.Array_Object].includes(
        nodeData.dataType!,
      ) &&
      nodeData.bindValueType === 'Input' &&
      !nodeData.bindValue;

    // 获取数据类型的级联值
    const _dataType = CascaderValue(nodeData.dataType || undefined);
    const { referenceList } = useWorkflowModel();
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

        {/* 数据类型选择器 - Body场景下宽度较小且被禁用 */}
        <div style={{ width: '40px', position: 'relative' }}>
          <Cascader
            allowClear={false}
            options={dataTypes}
            value={_dataType}
            onChange={(value) => {
              onUpdateField(nodeData.key!, 'dataType', CascaderChange(value));
            }}
            changeOnSelect={true}
            placement={'bottomRight'}
            placeholder="请选择数据类型"
            style={{
              width: '100%',
              backgroundColor: '#f5f5f5', // 禁用状态的背景色
            }}
            className="tree-form-name is-body-cascader"
            size="small"
          />
        </div>

        {/* Body类型专属：输入或引用组件 */}
        <div
          style={{ width: '100px', marginLeft: '6px', position: 'relative' }}
        >
          <InputOrReferenceFormTree
            referenceType={nodeData.bindValueType}
            data={referenceList}
            value={nodeData.bindValue}
            onChange={(value, type) => {
              onUpdateField(nodeData.key!, 'bindValue', value, type);
            }}
          />
        </div>

        {/* 操作按钮区域 - 宽度包含Body场景的额外空间 */}
        <div
          className="nested-form-icon-button"
          style={{ width: showCheck ? 60 : 48 }}
        >
          {/* 添加子节点按钮 - Body场景下的特殊逻辑 */}
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
    // 自定义比较函数，Body场景下需要额外比较bindValueType
    if (nextProps.nodeData.subArgs?.length === 0) {
      return false;
    }
    return (
      prevProps.nodeData.key === nextProps.nodeData.key &&
      prevProps.nodeData.name === nextProps.nodeData.name &&
      prevProps.nodeData.dataType === nextProps.nodeData.dataType &&
      prevProps.nodeData.require === nextProps.nodeData.require &&
      prevProps.nodeData.systemVariable === nextProps.nodeData.systemVariable &&
      prevProps.nodeData.bindValue === nextProps.nodeData.bindValue &&
      prevProps.nodeData.bindValueType === nextProps.nodeData.bindValueType &&
      prevProps.nodeData.description === nextProps.nodeData.description &&
      prevProps.nodeData.subArgs === nextProps.nodeData.subArgs &&
      prevProps.showCheck === nextProps.showCheck
    );
  },
);

// 设置displayName便于调试
TreeNodeTitleBody.displayName = 'TreeNodeTitleBody';

export default TreeNodeTitleBody;
