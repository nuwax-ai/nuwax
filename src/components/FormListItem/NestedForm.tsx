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
import { Button, Cascader, Checkbox, Input, Popover, Select, Tree } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
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
  notShowTitle,
  showCheck,
}) => {
  // 状态初始化（新增初始化逻辑）
  const [treeData, setTreeData] = useState<TreeNodeConfig[]>(
    (params[inputItemName] as TreeNodeConfig[]) || [],
  );

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // 在组件顶部添加状态管理
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 保持最新 params 引用（新增 ref 逻辑）
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  const { volid } = useModel('workflow');
  // 同步父组件参数变化（新增同步逻辑）
  useEffect(() => {
    if (params[inputItemName]) {
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
      // console.log('123', normalized);
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

    // setTreeData(updateRecursive(treeData));
    handleChangeNodeConfig({
      ...params,
      [inputItemName]: updateRecursive(treeData),
    });
  };

  // 自定义节点渲染
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
            key={nodeData.key} // 确保数据更新时重新渲染
            defaultValue={nodeData.name}
            onBlur={(e) => {
              updateNodeField(nodeData.key, 'name', e.target.value);
            }}
            disabled={nodeData.systemVariable}
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
        <div style={{ width: '80px', position: 'relative' }}>
          <Cascader
            allowClear={false}
            options={dataTypes}
            defaultValue={_dataType}
            onChange={(value) => {
              updateNodeField(nodeData.key!, 'dataType', CascaderChange(value));
            }}
            changeOnSelect={true}
            // expandTrigger="hover" // 改为悬停展开
            className="tree-form-name"
            disabled={nodeData.systemVariable}
            placement={'bottomLeft'}
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

        <div className="flex" style={{ width: showCheck ? 60 : 40 }}>
          <Popover
            content={
              <Input.TextArea
                key={nodeData.key} // 确保数据更新时重新渲染
                defaultValue={nodeData.description || ''}
                onBlur={(e) =>
                  updateNodeField(nodeData.key!, 'description', e.target.value)
                }
                rows={3}
              />
            }
            trigger="click"
          >
            <Button
              type="text"
              className="tree-icon-style"
              disabled={nodeData.systemVariable}
              icon={<FileDoneOutlined className="margin-right" />}
            />
          </Popover>

          {showCheck && (
            <Checkbox
              checked={nodeData.require}
              onChange={(e) =>
                updateNodeField(nodeData.key!, 'require', e.target.checked)
              }
              className="margin-right tree-icon-style"
              disabled={nodeData.systemVariable}
            />
          )}
          {canAddChild && (
            <Button
              type="text"
              disabled={nodeData.systemVariable}
              className="tree-icon-style"
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                addChildNode(nodeData.key!);
              }}
              icon={<ICON_ASSOCIATION />}
            />
          )}
          <Button
            type="text"
            disabled={nodeData.systemVariable}
            className="tree-icon-style"
            onClick={() => deleteNode(nodeData.key!)}
            icon={<DeleteOutlined />}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (volid) {
      const newErrors: Record<string, string> = {};

      treeData.forEach((node) => {
        console.log(node);
        // 校验节点名称
        if (!node.name?.trim()) {
          newErrors[`${node.key}-name`] = '请输入变量名称';
        }
        // 校验数据类型
        if (!node.dataType) {
          newErrors[`${node.key}-type`] = '请选择';
        }
      });

      setErrors(newErrors);
    }
  }, [volid, treeData]);
  return (
    <div>
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">
          <span>{title}</span>
        </span>
        <div>
          {notShowTitle && (
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
              defaultValue={params.outputType || 'JSON'}
              options={[
                { label: '文本', value: 'Text' },
                { label: 'Markdown', value: 'Markdown' },
                { label: 'JSON', value: 'JSON' },
              ]}
              onChange={(value: string) =>
                handleChangeNodeConfig({ ...params, outputType: value })
              }
              style={{ width: 160 }}
            ></Select>
          )}
          {(!notShowTitle || params.outputType === 'JSON') && (
            <Button
              icon={<PlusOutlined />}
              size={'small'}
              onClick={addRootNode}
              className="ml-10"
            ></Button>
          )}
        </div>
      </div>

      {treeData && treeData.length > 0 && (
        <div
          className={`${
            treeData.find((item) => item.subArgs && item.subArgs.length > 0)
              ? 'ml-34'
              : 'ml-10'
          } dis-left font-12 mb-6`}
        >
          <span>变量名</span>
          <span
            style={{
              marginLeft: `${
                treeData.find((item) => item.subArgs && item.subArgs.length > 0)
                  ? '38%'
                  : '42%'
              }`,
            }}
          >
            变量类型
          </span>
        </div>
      )}

      <Tree<TreeNodeConfig>
        treeData={treeData}
        showLine
        switcherIcon={<DownOutlined />}
        defaultExpandAll
        fieldNames={{ title: 'name', key: 'key', children: 'subArgs' }}
        titleRender={renderTitle}
        selectedKeys={selectedKey ? [selectedKey] : []}
        onSelect={(keys) => setSelectedKey(keys[0] as string)}
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
