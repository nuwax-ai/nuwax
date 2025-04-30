import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { dataTypes } from '@/pages/Antv-X6/params';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { CascaderChange, CascaderValue } from '@/utils';
import {
  DeleteOutlined,
  DownOutlined,
  FileDoneOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Cascader,
  Checkbox,
  Form,
  Input,
  Popover,
  Select,
  Tooltip,
  Tree,
} from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import InputOrReferenceFormTree from './InputOrReferenceFormTree';
import { TreeFormProps } from './type';
interface TreeNodeConfig extends InputAndOutConfig {
  key: string;
  subArgs?: TreeNodeConfig[];
}

const CustomTree: React.FC<TreeFormProps> = ({
  params,
  form,
  title,
  inputItemName = 'inputArgs',
  notShowTitle,
  showCheck,
  isBody,
  isNotAdd,
}) => {
  const [treeData, setTreeData] = useState<TreeNodeConfig[]>(params || []);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  // const [errors, setErrors] = useState<Record<string, string>>({});
  const { setIsModified } = useModel('workflow');
  // const { volid, setIsModified } = useModel('workflow');

  useEffect(() => {
    if (params && !_.isEqual(params, treeData)) {
      setTreeData(params);
    }
  }, [params]);

  const updateTreeData = (newData: TreeNodeConfig[]) => {
    setTreeData(newData);
    form.setFieldValue(inputItemName, newData);
    setIsModified(true);
  };

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

  const getAllParentKeys = (data: TreeNodeConfig[]): React.Key[] => {
    const keys: React.Key[] = [];
    data.forEach((node) => {
      if (node.subArgs && node.subArgs.length > 0) {
        keys.push(node.key);
        keys.push(...getAllParentKeys(node.subArgs));
      }
    });
    return keys;
  };

  const addRootNode = () => {
    const newNode: TreeNodeConfig = {
      key: uuidv4(),
      name: '',
      description: '',
      dataType: DataTypeEnum.String,
      require: false,
      systemVariable: false,
      bindValueType: 'Input',
      bindValue: '',
    };
    updateTreeData([...treeData, newNode]);
  };

  const addChildNode = (parentKey: string) => {
    const depth = getNodeDepth(treeData, parentKey);
    if (depth >= 4) return;

    const newNode: TreeNodeConfig = {
      key: uuidv4(),
      name: '',
      description: null,
      dataType: DataTypeEnum.String,
      require: false,
      systemVariable: false,
      bindValueType: 'Input',
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

    const newData = updateRecursive(treeData);
    updateTreeData(newData);
    setExpandedKeys(Array.from(new Set([...expandedKeys, parentKey])));
  };

  const deleteNode = (key: string) => {
    const filterRecursive = (data: TreeNodeConfig[]): TreeNodeConfig[] =>
      data.filter((node) => {
        if (node.key === key) return false;
        if (node.subArgs) node.subArgs = filterRecursive(node.subArgs);
        return true;
      });

    const newData = filterRecursive(treeData);
    updateTreeData(newData);
  };

  const updateNodeField = (
    key: string,
    field: string,
    value: any,
    type?: 'Input' | 'Reference',
  ) => {
    const updateRecursive = (data: TreeNodeConfig[]): TreeNodeConfig[] =>
      data.map((node) => {
        if (node.key === key) {
          const newObj = {
            ...node,
            [field]: value,
            bindValueType: type || node.bindValueType,
          };
          return newObj;
        }
        if (node.subArgs) {
          return { ...node, subArgs: updateRecursive(node.subArgs) };
        }
        return node;
      });

    const newData = updateRecursive(treeData);
    updateTreeData(newData);
  };

  const updateRequireStatus = async (
    nodeData: TreeNodeConfig,
    checked: boolean,
  ) => {
    // 更新当前节点的 require 状态

    // 如果当前节点被选中，递归更新所有父节点的 require 状态
    if (checked) {
      // 查找目标节点的所有父节点路径
      const findPathToNode = (
        tree: TreeNodeConfig[],
        targetKey: string,
        path: TreeNodeConfig[] = [],
      ): TreeNodeConfig[] | null => {
        for (const node of tree) {
          const currentPath = [...path, node];

          if (node.key === targetKey) {
            return currentPath; // 找到目标节点，返回路径
          }

          if (node.subArgs) {
            const result = findPathToNode(node.subArgs, targetKey, currentPath);
            if (result) {
              return result; // 如果子节点中找到目标节点，返回路径
            }
          }
        }

        return null; // 没有找到目标节点
      };
      // 查找目标节点的路径
      const path = findPathToNode(treeData, nodeData.key!);
      if (!path) {
        return; // 如果没有找到目标节点，直接返回
      }
      // 递归treeData，更新路径上的所有节点的require状态为true
      const updatePath = (
        tree: TreeNodeConfig[],
        path: TreeNodeConfig[],
        level: number,
      ): TreeNodeConfig[] => {
        if (level > path.length) return tree;
        return tree.map((item) => {
          if (item.key === path[level].key) {
            const updatedItem = { ...item, require: true };
            if (level < path.length - 1 && item.subArgs) {
              return {
                ...updatedItem,
                subArgs: updatePath(item.subArgs, path, level + 1),
              };
            }
            return updatedItem;
          }
          return item;
        });
      };

      const newData = updatePath(treeData, path, 0);
      setTreeData(newData);
      form.setFieldValue(inputItemName, newData); // 更新表单数据
    } else {
      // 递归获取更改当前数据require和所有子节点的require状态
      const updateNode = (data: TreeNodeConfig): TreeNodeConfig => {
        const updatedData = { ...data, require: false };
        if (data.subArgs) {
          updatedData.subArgs = data.subArgs.map((item) => updateNode(item));
        }
        return updatedData;
      };

      const newNodeData = await updateNode(nodeData);

      const updateTree = (data: TreeNodeConfig[]): TreeNodeConfig[] =>
        data.map((node) => {
          if (node.key === newNodeData.key) {
            return newNodeData; // 返回更新后的节点
          }
          if (node.subArgs) {
            return { ...node, subArgs: updateTree(node.subArgs) };
          }
          return node;
        });

      const newData = updateTree(treeData);

      setTreeData(newData); // 更新 treeData
      form.setFieldValue(inputItemName, newData); // 更新表单数据
    }
    setIsModified(true); // 标记为已修改
  };

  const renderTitle = (nodeData: TreeNodeConfig) => {
    const canAddChild = [
      DataTypeEnum.Object,
      DataTypeEnum.Array_Object,
    ].includes(nodeData.dataType!);

    const _dataType = CascaderValue(nodeData.dataType || undefined);

    return (
      <div className="dis-left" style={{ width: '100%' }}>
        <div
          className="flex-1"
          style={{ position: 'relative', marginRight: '6px' }}
        >
          <Input
            key={nodeData.key}
            defaultValue={nodeData.name}
            onBlur={(e) =>
              updateNodeField(nodeData.key, 'name', e.target.value)
            }
            disabled={nodeData.systemVariable}
            placeholder="请输入参数名称"
            className="tree-form-name flex-1"
            style={{
              // borderColor: errors[`${nodeData.key}-name`]
              //   ? '#ff4d4f'
              //   : undefined,
              backgroundColor: nodeData.systemVariable ? '#f5f5f5' : undefined,
            }}
          />
          {/* {errors[`${nodeData.key}-name`] && (
            <div style={{ color: '#ff4d4f', fontSize: 12 }}>
              {errors[`${nodeData.key}-name`]}
            </div>
          )} */}
        </div>
        <div style={{ width: isBody ? '40px' : '80px', position: 'relative' }}>
          <Cascader
            allowClear={false}
            options={dataTypes}
            defaultValue={_dataType}
            onChange={(value) => {
              updateNodeField(nodeData.key!, 'dataType', CascaderChange(value));
            }}
            changeOnSelect={true}
            className="tree-form-name"
            disabled={nodeData.systemVariable}
            placement={'bottomLeft'}
            placeholder="请选择数据类型"
            style={{
              width: '100%',
              // borderColor: errors[`${nodeData.key}-type`]
              //   ? '#ff4d4f'
              //   : undefined,
              backgroundColor: nodeData.systemVariable ? '#f5f5f5' : undefined,
            }}
          />
          {/* {errors[`${nodeData.key}-type`] && (
            <div style={{ color: '#ff4d4f', fontSize: 12 }}>
              {errors[`${nodeData.key}-type`]}
            </div>
          )} */}
        </div>
        {isBody && (
          <div
            style={{ width: '100px', marginLeft: '6px', position: 'relative' }}
          >
            <InputOrReferenceFormTree
              referenceType={nodeData.bindValueType}
              value={nodeData.bindValue}
              onChange={(value, type) => {
                updateNodeField(nodeData.key!, 'bindValue', value, type);
              }}
            />
          </div>
        )}

        <div
          className="nested-form-icon-button"
          style={{ width: showCheck ? 60 : 48 }}
        >
          {canAddChild && (
            <Tooltip title="新增子节点">
              <Button
                type="text"
                // disabled={nodeData.systemVariable}
                className="tree-icon-style"
                onClick={(e) => {
                  e.stopPropagation();
                  addChildNode(nodeData.key!);
                }}
                icon={<ICON_ASSOCIATION />}
              />
            </Tooltip>
          )}
          <Popover
            content={
              <Input.TextArea
                key={nodeData.key}
                defaultValue={nodeData.description || ''}
                onBlur={(e) =>
                  updateNodeField(nodeData.key!, 'description', e.target.value)
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

          {showCheck && (
            <Tooltip title="是否必须">
              <Checkbox
                checked={nodeData.require}
                onChange={(e) =>
                  updateRequireStatus(nodeData, e.target.checked)
                }
                disabled={nodeData.systemVariable}
              />
            </Tooltip>
          )}

          <Tooltip title="删除">
            <Button
              type="text"
              disabled={nodeData.systemVariable}
              className="tree-icon-style"
              onClick={() => deleteNode(nodeData.key!)}
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </div>
      </div>
    );
  };

  // useEffect(() => {
  //   if (volid) {
  //     const newErrors: Record<string, string> = {};
  //     treeData.forEach((node) => {
  //       if (!node.name?.trim()) {
  //         newErrors[`${node.key}-name`] = '请输入变量名称';
  //       }
  //       if (!node.dataType) {
  //         newErrors[`${node.key}-type`] = '请选择';
  //       }
  //     });
  //     setErrors(newErrors);
  //   }
  // }, [volid, treeData]);

  useEffect(() => {
    const parentKeys = getAllParentKeys(treeData);
    setExpandedKeys(parentKeys);
  }, [treeData]);

  return (
    <div>
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">
          <span>{title}</span>
        </span>
        <div>
          {notShowTitle && (
            <Form.Item name="outputType" noStyle>
              <Select
                prefix={
                  <Popover
                    content={
                      <ul>
                        <li>文本: 使用普通文本格式回复</li>
                        <li>Markdown: 将引导模型使用 Markdown 格式输出回复</li>
                        <li>JSON: 将引导模型使用 JSON 格式输出</li>
                      </ul>
                    }
                  >
                    <div className="dis-left">
                      <InfoCircleOutlined />
                      <span className="ml-10">输出格式</span>
                    </div>
                  </Popover>
                }
                options={[
                  { label: '文本', value: 'Text' },
                  { label: 'Markdown', value: 'Markdown' },
                  { label: 'JSON', value: 'JSON' },
                ]}
                style={{ width: 160 }}
              />
            </Form.Item>
          )}
          {!isNotAdd &&
            (!notShowTitle || form.getFieldValue('outputType') === 'JSON') && (
              <Button
                icon={<PlusOutlined />}
                size={'small'}
                onClick={addRootNode}
                className="ml-10"
                type="text"
              />
            )}
        </div>
      </div>

      {treeData && treeData.length > 0 && (
        <div className={'dis-left font-12 mb-6 font-color-gray07'}>
          <span className="flex-1 ">变量名</span>
          <span
            style={{
              width: 80 + (showCheck ? 60 : 50) + (isBody ? 62 : 0),
            }}
          >
            变量类型
          </span>
        </div>
      )}

      <Tree<TreeNodeConfig>
        treeData={treeData}
        // showLine
        switcherIcon={<DownOutlined />}
        defaultExpandAll
        fieldNames={{ title: 'name', key: 'key', children: 'subArgs' }}
        titleRender={renderTitle}
        defaultExpandParent
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        className={`${
          treeData.find((item) => item.subArgs && item.subArgs.length > 0)
            ? 'tree-form-style'
            : 'tree-form-style-no-child'
        }`}
      />
    </div>
  );
};

export default CustomTree;
