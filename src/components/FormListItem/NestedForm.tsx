import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { dataTypes } from '@/pages/Antv-X6/params';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import {
  DeleteOutlined,
  DownOutlined,
  FileDoneOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Cascader, Checkbox, Input, Popover, Tree } from 'antd';
import React, { useEffect, useState } from 'react';
import './index.less';
import { TreeFormProps } from './type';
const TitleRender = ({
  inputArgs,
  handleOnchange,
  handleDelete,
}: {
  inputArgs: InputAndOutConfig;
  handleOnchange: (inputArgs: InputAndOutConfig) => void;
  handleDelete: (inputArgs: InputAndOutConfig) => void;
}) => {
  return (
    <>
      <div className="dis-left">
        <Input
          className="flex-1 tree-form-name"
          value={inputArgs.name}
          onBlur={(e) => handleOnchange({ ...inputArgs, name: e.target.value })}
          disabled={inputArgs.systemVariable}
        />
        <Cascader
          options={dataTypes}
          style={{ width: 90 }}
          className="tree-form-name"
          value={
            typeof inputArgs.dataType === 'string'
              ? [inputArgs.dataType]
              : inputArgs.dataType
          }
          onChange={(e: string[]) =>
            handleOnchange({
              ...inputArgs,
              dataType: (e[e.length - 1] as DataTypeEnum | null) || null,
            })
          }
          disabled={inputArgs.systemVariable}
        />
        <div className="dis-left" style={{ width: 70 }}>
          <Popover
            content={
              <Input.TextArea
                onChange={(e) =>
                  handleOnchange({ ...inputArgs, description: e.target.value })
                }
              />
            }
            trigger="click"
          >
            <FileDoneOutlined className="margin-right cursor-pointer" />
          </Popover>
          <Checkbox
            className="margin-right"
            onChange={(e) =>
              handleOnchange({ ...inputArgs, require: e.target.value })
            }
          />
          {(inputArgs.dataType === DataTypeEnum.Object ||
            inputArgs.dataType === DataTypeEnum.Array_Object) && (
            <ICON_ASSOCIATION
              className="cursor-pointer margin-right"
              onClick={() => {
                const newSubArgs = [
                  ...(inputArgs.subArgs || []),
                  {
                    name: '',
                    dataType: null,
                    bindValue: '',
                    key: `${Date.now()}`, // 使用时间戳作为唯一键
                    description: '',
                    require: false,
                    systemVariable: false,
                    bindValueType: '',
                    subArgs: [],
                  },
                ];
                handleOnchange({ ...inputArgs, subArgs: newSubArgs });
              }}
            />
          )}
          <DeleteOutlined
            className="cursor-pointer"
            onClick={() => handleDelete(inputArgs)}
          />
        </div>
      </div>
    </>
  );
};

const TreeForm: React.FC<TreeFormProps> = ({
  params,
  handleChangeNodeConfig,
  title,
}) => {
  const [inputArgs, setInputArgs] = useState<InputAndOutConfig[]>(
    params.inputArgs || [],
  );

  // 制作一个函数，便利inputArgs，如果存在subArgs，递归遍历赋予key
  const updateKey = (arr: InputAndOutConfig[]) => {
    arr.forEach((item) => {
      if (item.subArgs && item.subArgs.length > 0) {
        updateKey(item.subArgs);
      }
      item.key = `${Date.now()}`;
    });
    return arr;
  };

  const updateParams = () => {
    handleChangeNodeConfig({
      ...params,
      inputArgs: inputArgs,
    });
  };
  useEffect(() => {
    return () => {
      // 组件销毁时,提交数据
      updateParams();
    };
  }, []);
  useEffect(() => {
    // 当params.inputArgs变化时更新本地状态
    const _newArr = updateKey(params.inputArgs || []);

    setInputArgs(_newArr);
  }, [params.inputArgs]);

  function addNodeItem() {
    const newNode: InputAndOutConfig = {
      name: '',
      dataType: null,
      bindValue: '',
      key: `${Date.now()}`, // 使用时间戳作为唯一键
      description: '',
      require: false,
      systemVariable: false,
      bindValueType: '',
      subArgs: [],
    };
    setInputArgs((prev) => [...prev, newNode]);
  }

  const handleOnchange = (nodeData: InputAndOutConfig) => {
    console.log(nodeData);
    setInputArgs((prev) =>
      prev.map((item) =>
        item.key === nodeData.key ? { ...item, ...nodeData } : item,
      ),
    );
  };

  const handleDelete = (nodeData: InputAndOutConfig) => {
    setInputArgs((prev) => prev.filter((item) => item.key !== nodeData.key));
  };

  return (
    <>
      {/* 标题和按钮部分保持不变 */}
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">
          <span>{title}</span>
        </span>
        <Button
          icon={<PlusOutlined />}
          size={'small'}
          onClick={() => addNodeItem()}
        ></Button>
      </div>
      <div className="dis-left margin-bottom">
        <span className="tree-name-style">参数名</span>
        <span className="tree-data-type-style">参数值</span>
        <span>描述</span>
      </div>
      <Tree
        showLine
        defaultExpandAll
        switcherIcon={<DownOutlined />}
        fieldNames={{ title: 'name', key: 'key', children: 'subArgs' }}
        treeData={inputArgs}
        titleRender={(nodeData) => {
          return (
            <TitleRender
              inputArgs={nodeData as InputAndOutConfig}
              handleOnchange={handleOnchange}
              handleDelete={handleDelete}
            />
          );
        }}
      />
    </>
  );
};

export default TreeForm;
