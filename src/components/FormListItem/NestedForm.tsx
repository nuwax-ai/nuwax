import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { dataTypes } from '@/pages/Antv-X6/params';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { CascaderChange, CascaderValue } from '@/utils';
import {
  DeleteOutlined,
  FileDoneOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Cascader, Checkbox, Input, Popover, Tree } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { TreeFormProps } from './type';

interface TreeNodeConfig extends InputAndOutConfig {
  key: string;
  subArgs?: TreeNodeConfig[];
}
const CustomTree: React.FC<TreeFormProps> = ({
  params,
  handleChangeNodeConfig,
  title,
  inputItemName = 'inputArgs',
}) => {
  // 状态初始化（新增初始化逻辑）
  const [treeData, setTreeData] = useState<TreeNodeConfig[]>(
    (params[inputItemName] as TreeNodeConfig[]) || [],
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // 保持最新 params 引用（新增 ref 逻辑）
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // 同步父组件参数变化（新增同步逻辑）
  useEffect(() => {
    if (!treeData.length && params[inputItemName]) {
      const normalized = (params[inputItemName] as TreeNodeConfig[]).map(
        (item) => ({
          ...item,
          // 转换遗留的 File 类型为 File_Default
          dataType:
            item.dataType === DataTypeEnum.File
              ? DataTypeEnum.File_Default
              : item.dataType,
        }),
      );
      setTreeData(normalized);
    }
  }, [params[inputItemName]]);

  // 递归计算节点深度
  const getNodeDepth = (
    data: TreeNodeConfig[],
    key: string,
    depth = 1,
  ): number => {
    for (const node of data) {
      if (node.key === key) return depth;
      if (node.subArgs) {
        const found = getNodeDepth(node.subArgs, key, depth + 1);
        if (found) return found;
      }
    }
    return 0;
  };

  // 添加根节点
  const addRootNode = () => {
    const newNode: TreeNodeConfig = {
      key: `node-${Date.now()}`,
      name: '',
      description: '',
      dataType: null,
      require: false,
      systemVariable: false,
      bindValueType: null,
      bindValue: '',
    };
    setTreeData([...treeData, newNode]);
    handleChangeNodeConfig({
      ...params,
      [inputItemName]: [...treeData, newNode],
    });
  };

  // 更新节点字段
  const updateNodeField = (key: string, field: string, value: any) => {
    const updateRecursive = (data: TreeNodeConfig[]): TreeNodeConfig[] =>
      data.map((node) => {
        if (node.key === key) {
          return { ...node, [field]: value };
        }
        if (node.subArgs) {
          return { ...node, subArgs: updateRecursive(node.subArgs) };
        }
        return node;
      });

    setTreeData(updateRecursive(treeData));
    handleChangeNodeConfig({
      ...params,
      [inputItemName]: updateRecursive(treeData),
    });
  };

  // 添加子节点
  const addChildNode = (parentKey: string) => {
    const depth = getNodeDepth(treeData, parentKey);
    if (depth >= 4) return;

    const newNode: TreeNodeConfig = {
      key: `node-${Date.now()}`,
      name: '',
      description: null,
      dataType: null,
      require: false,
      systemVariable: false,
      bindValueType: null,
      bindValue: '',
    };

    const updateRecursive = (data: TreeNodeConfig[]): TreeNodeConfig[] =>
      data.map((node) => {
        if (node.key === parentKey) {
          return {
            ...node,
            subArgs: [...(node.subArgs || []), newNode],
          };
        }
        if (node.subArgs) {
          return { ...node, subArgs: updateRecursive(node.subArgs) };
        }
        return node;
      });

    setTreeData(updateRecursive(treeData));
    handleChangeNodeConfig({
      ...params,
      [inputItemName]: updateRecursive(treeData),
    });
  };

  // 删除节点
  const deleteNode = (key: string) => {
    const filterRecursive = (data: TreeNodeConfig[]): TreeNodeConfig[] =>
      data.filter((node) => {
        if (node.key === key) return false;
        if (node.subArgs) node.subArgs = filterRecursive(node.subArgs);
        return true;
      });

    setTreeData(filterRecursive(treeData));
    handleChangeNodeConfig({
      ...params,
      [inputItemName]: filterRecursive(treeData),
    });
  };

  // 自定义节点渲染
  const renderTitle = (nodeData: TreeNodeConfig) => {
    const canAddChild = [
      DataTypeEnum.Object,
      DataTypeEnum.Array_Object,
    ].includes(nodeData.dataType!);

    return (
      <div className="dis-left">
        <Input
          value={nodeData.name}
          onChange={(e) =>
            updateNodeField(nodeData.key!, 'name', e.target.value)
          }
          className="flex-1 tree-form-name"
          disabled={nodeData.systemVariable}
        />
        <Cascader
          allowClear={false}
          options={dataTypes}
          style={{ width: 90 }}
          value={CascaderValue(nodeData.dataType ?? undefined)}
          onChange={(value) => {
            updateNodeField(nodeData.key!, 'dataType', CascaderChange(value));
          }}
          changeOnSelect={false}
          expandTrigger="hover" // 改为悬停展开
          className="tree-form-name"
          disabled={nodeData.systemVariable}
          placement={'bottomLeft'}
        />

        <div className="dis-left" style={{ width: 70 }}>
          <Popover
            content={
              <Input.TextArea
                value={nodeData.description || ''}
                onChange={(e) =>
                  updateNodeField(nodeData.key!, 'description', e.target.value)
                }
                rows={3}
              />
            }
            trigger="click"
          >
            <FileDoneOutlined className="margin-right cursor-pointer" />
          </Popover>

          <Checkbox
            checked={nodeData.require}
            onChange={(e) =>
              updateNodeField(nodeData.key!, 'require', e.target.checked)
            }
            className="margin-right"
          />

          {canAddChild && (
            <ICON_ASSOCIATION
              onClick={() => addChildNode(nodeData.key!)}
              className="cursor-pointer margin-right"
            />
          )}

          <DeleteOutlined
            className="cursor-pointer"
            onClick={() => deleteNode(nodeData.key!)}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">
          <span>{title}</span>
        </span>
        <Button
          icon={<PlusOutlined />}
          size={'small'}
          onClick={addRootNode}
        ></Button>
      </div>
      <Tree
        treeData={treeData}
        showLine
        defaultExpandAll
        fieldNames={{ title: 'name', key: 'key', children: 'subArgs' }}
        titleRender={renderTitle}
        selectedKeys={selectedKey ? [selectedKey] : []}
        onSelect={(keys) => setSelectedKey(keys[0] as string)}
      />
    </div>
  );
};

export default CustomTree;
