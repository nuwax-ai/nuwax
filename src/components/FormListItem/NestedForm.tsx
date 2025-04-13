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
}) => {
  const [treeData, setTreeData] = useState<TreeNodeConfig[]>(params || []);

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { volid, setIsModified } = useModel('workflow');

  useEffect(() => {
    if (params && !_.isEqual(params, treeData)) {
      setTreeData(params);
    }
  }, [params]);

  const updateTreeData = (newData: TreeNodeConfig[]) => {
    setTreeData(newData);
    console.log(newData, 'newData');
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
      dataType: null,
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
      dataType: null,
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

    const newData = updateRecursive(treeData);
    updateTreeData(newData);
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
              borderColor: errors[`${nodeData.key}-name`]
                ? '#ff4d4f'
                : undefined,
              backgroundColor: nodeData.systemVariable ? '#f5f5f5' : undefined,
            }}
          />
          {errors[`${nodeData.key}-name`] && (
            <div style={{ color: '#ff4d4f', fontSize: 12 }}>
              {errors[`${nodeData.key}-name`]}
            </div>
          )}
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
              borderColor: errors[`${nodeData.key}-type`]
                ? '#ff4d4f'
                : undefined,
              backgroundColor: nodeData.systemVariable ? '#f5f5f5' : undefined,
            }}
          />
          {errors[`${nodeData.key}-type`] && (
            <div style={{ color: '#ff4d4f', fontSize: 12 }}>
              {errors[`${nodeData.key}-type`]}
            </div>
          )}
        </div>
        {isBody && (
          <div
            style={{ width: '100px', marginLeft: '6px', position: 'relative' }}
          >
            <InputOrReferenceFormTree
              referenceType={nodeData.bindValueType}
              value={nodeData.bindValue}
              onChange={(value, type) => {
                updateNodeField(nodeData.key!, 'bindValueType', type);
                updateNodeField(nodeData.key!, 'bindValue', value);
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
                disabled={nodeData.systemVariable}
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
                  updateNodeField(nodeData.key!, 'require', e.target.checked)
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

  useEffect(() => {
    if (volid) {
      const newErrors: Record<string, string> = {};
      treeData.forEach((node) => {
        if (!node.name?.trim()) {
          newErrors[`${node.key}-name`] = '请输入变量名称';
        }
        if (!node.dataType) {
          newErrors[`${node.key}-type`] = '请选择';
        }
      });
      setErrors(newErrors);
    }
  }, [volid, treeData]);

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
          {(!notShowTitle || form.getFieldValue('outputType') === 'JSON') && (
            <Button
              icon={<PlusOutlined />}
              size={'small'}
              onClick={addRootNode}
              className="ml-10"
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
