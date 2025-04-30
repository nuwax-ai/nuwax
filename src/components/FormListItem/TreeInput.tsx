import { InputAndOutConfig } from '@/types/interfaces/node';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Popover, Tag, Tree } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import InputOrReferenceFormTree from './InputOrReferenceFormTree';
import { TreeInputProps } from './type';

const TreeInput: React.FC<TreeInputProps> = ({
  form,
  title,
  params,
  options,
  showAdd,
}) => {
  const [treeData, setTreeData] = useState<InputAndOutConfig[]>(params || []);
  const { setIsModified } = useModel('workflow');

  useEffect(() => {
    if (params && !_.isEqual(params, treeData)) {
      setTreeData(params);
    }
  }, [params]);

  const updateTreeData = (newData: InputAndOutConfig[]) => {
    setTreeData(newData);
    form.setFieldValue('inputArgs', newData);
    setIsModified(true);
  };
  const updateNodeField = (
    key: string,
    value: string,
    type: 'Input' | 'Reference',
  ) => {
    const updateRecursive = (data: InputAndOutConfig[]): InputAndOutConfig[] =>
      data.map((node) => {
        if (node.key === key) {
          return { ...node, bindValue: value, bindValueType: type };
        }
        if (node.subArgs) {
          return { ...node, subArgs: updateRecursive(node.subArgs) };
        }
        return node;
      });

    const newData = updateRecursive(treeData);
    updateTreeData(newData);
  };

  // 新增子节点
  const addOptions = (val: InputAndOutConfig) => {
    setTreeData((prevData) => {
      const newData = [...prevData, val];
      updateTreeData(newData);
      return newData;
    });
  };

  // 被添加的数据样式
  const content = (
    <>
      {options
        ?.filter(
          (option) =>
            !treeData.some((item) => item.name === option.key) &&
            !option.systemVariable,
        )
        .map((item) => {
          return (
            <div
              className="dis-sb cursor-pointer mb-6"
              key={item.key}
              onClick={() => addOptions(item)}
              style={{ width: 220 }}
            >
              <span>{item.name}</span>
              <Tag color="#C9CDD4">{item.dataType}</Tag>
            </div>
          );
        })}
    </>
  );

  const renderTitle = (nodeData: InputAndOutConfig) => {
    return (
      <div className="dis-sb" style={{ width: '100%' }}>
        <div className="flex-1">
          <span className="margin-right-6 font-12 ">{nodeData.name}</span>
          <Popover
            styles={{
              body: {
                width: '300px',
              },
            }}
            content={nodeData.description || '暂无描述'}
          >
            <InfoCircleOutlined className="margin-right-6 font-12" />
          </Popover>
        </div>

        <div style={{ width: '175px' }}>
          <InputOrReferenceFormTree
            referenceType={nodeData.bindValueType || 'Input'}
            onChange={(value, type) => {
              updateNodeField(nodeData.key!, value, type);
            }}
            value={nodeData.bindValue}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">{title}</span>
        {showAdd && (
          <Popover content={content} trigger="click">
            <Button type="text" size={'small'} icon={<PlusOutlined />} />
          </Popover>
        )}
      </div>
      {treeData && treeData.length > 0 && (
        <div className={'dis-left font-12 mb-6 font-color-gray07'}>
          <span
            style={{
              marginLeft: `1%`,
            }}
          >
            变量名
          </span>
          <span
            style={{
              marginLeft: `35%`,
            }}
          >
            变量类型
          </span>
        </div>
      )}
      <Tree<InputAndOutConfig>
        treeData={treeData}
        defaultExpandAll
        fieldNames={{ title: 'name', key: 'key', children: 'subArgs' }}
        titleRender={renderTitle}
        switcherIcon={null}
        showIcon={false}
        className="tree-input-style"
      />
    </div>
  );
};

export default TreeInput;
