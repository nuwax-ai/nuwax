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

interface TreeInputAndOutConfig extends InputAndOutConfig {
  key: string;
  subArgs: TreeInputAndOutConfig[];
}
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
          onChange={(e) =>
            handleOnchange({ ...inputArgs, name: e.target.value })
          }
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
  const [inputArgs, setInputArgs] = useState<TreeInputAndOutConfig[]>(
    params.inputArgs || [],
  );

  // 制作一个函数，便利inputArgs，如果存在subArgs，递归遍历赋予key
  const updateKey = (arr: InputAndOutConfig[]) => {
    arr.forEach((item) => {
      if (item.subArgs && item.subArgs.length > 0) {
        updateKey(item.subArgs || []);
      }
      item.key = `${Date.now()}`;
    });
    return arr;
  };

  const updateParams = () => {
    handleChangeNodeConfig({
      ...params,
      inputArgs,
    });
  };
  useEffect(() => {
    // 当params.inputArgs变化时更新本地状态
    const _newArr = updateKey(params.inputArgs || []);
    if (!inputArgs.length) {
      setInputArgs(_newArr);
    }
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

  // 修改后的递归更新逻辑
  const handleOnchange = (
    targetKey: string,
    modifiedData: TreeInputAndOutConfig,
  ) => {
    const recursiveUpdate = (
      items: TreeInputAndOutConfig[],
    ): TreeInputAndOutConfig[] =>
      items.map((item) => {
        if (item.key === targetKey) {
          return { ...item, ...modifiedData };
        }
        if (item.subArgs?.length) {
          return {
            ...item,
            subArgs: recursiveUpdate(item.subArgs),
          };
        }
        return item;
      });

    setInputArgs((prev) => recursiveUpdate(prev));
    updateParams();
  };

  // 增强版的删除逻辑
  const handleDelete = (targetKey: string) => {
    const recursiveDelete = (
      items: TreeInputAndOutConfig[],
    ): TreeInputAndOutConfig[] =>
      items.filter((item) => {
        if (item.key === targetKey) return false;
        if (item.subArgs?.length) {
          item.subArgs = recursiveDelete(item.subArgs);
        }
        return true;
      });

    setInputArgs((prev) => recursiveDelete(prev));
    updateParams();
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
      <Tree<TreeInputAndOutConfig>
        showLine
        defaultExpandAll
        switcherIcon={<DownOutlined />}
        fieldNames={{ title: 'name', key: 'key', children: 'subArgs' }}
        treeData={inputArgs}
        titleRender={(nodeData) => {
          console.log(nodeData);
          return (
            <TitleRender
              inputArgs={nodeData}
              handleOnchange={(data) =>
                handleOnchange(nodeData.key as string, data)
              }
              handleDelete={() => handleDelete(nodeData.key as string)}
            />
          );
        }}
      />
    </>
  );
};

export default TreeForm;
