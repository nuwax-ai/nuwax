import TooltipIcon from '@/components/TooltipIcon';
import { dataTypes } from '@/pages/Antv-X6/params';
import { DataTypeEnum } from '@/types/enums/common';
import type { TriggerRequireInputType } from '@/types/interfaces/agentConfig';
import { CascaderChange, CascaderValue } from '@/utils';
import {
  DownOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Cascader, Input, Space, Table } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 请求参数
 */
const RequireParams: React.FC = forwardRef((_, ref) => {
  // 请求参数 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [inputData, setInputData] = useState<TriggerRequireInputType[]>([
    {
      key: uuidv4(),
      name: '',
      dataType: DataTypeEnum.String,
      description: '',
    },
  ]);

  useImperativeHandle(ref, () => ({
    argBindConfigs: inputData,
  }));

  // 删除行
  const handleReduce = (index: number, record: TriggerRequireInputType) => {
    const _inputData = cloneDeep(inputData);
    // 第一级
    if (_inputData[index]?.key === record.key) {
      _inputData.splice(index, 1);
    } else {
      // 子级
      const f_index = _inputData.findIndex((item) => {
        const childIndex = item.children?.findIndex(
          (childItem) => childItem?.key === record.key,
        );
        return childIndex > -1;
      });
      _inputData[f_index].children.splice(index, 1);
    }
    setInputData(_inputData);
  };

  const handleInputValue = (
    index: number,
    record: TriggerRequireInputType,
    attr: string,
    value: string | boolean,
  ) => {
    const _inputData = cloneDeep(inputData);
    // 第一级
    if (_inputData[index]?.key === record.key) {
      _inputData[index][attr] = value;
    } else {
      // 子级
      const f_index = _inputData.findIndex((item) => {
        const childIndex = item.children?.findIndex(
          (childItem) => childItem?.key === record.key,
        );
        return childIndex > -1;
      });
      _inputData[f_index].children[index][attr] = value;
    }
    setInputData(_inputData);
  };

  const handleAddChildren = (index) => {
    const _inputData = cloneDeep(inputData);
    if (!_inputData[index].children) {
      _inputData[index].children = [];
    }
    const _key = index + uuidv4();
    const newData: TriggerRequireInputType = {
      key: _key,
      name: '',
      dataType: DataTypeEnum.String,
      description: '',
    };

    _inputData[index].children = [..._inputData[index].children, newData];
    setInputData(_inputData);
    // 设置默认展开行
    const _expandedRowKeys = [...expandedRowKeys];
    if (!_expandedRowKeys.includes(_inputData[index].key)) {
      _expandedRowKeys.push(_inputData[index].key as string);
      setExpandedRowKeys(_expandedRowKeys);
    }
  };

  // Just show the latest item.
  const displayRender = (labels: string[]) => labels[labels.length - 1];

  // 入参配置columns
  const inputColumns: TableColumnsType<TriggerRequireInputType>['columns'] = [
    {
      title: '变量名',
      dataIndex: 'name',
      key: 'name',
      className: 'flex',
      width: 200,
      render: (_, record, index) => (
        <Input
          placeholder="请输入变量名"
          onChange={(e) =>
            handleInputValue(index, record, 'name', e.target.value)
          }
        />
      ),
    },
    {
      title: '变量类型',
      dataIndex: 'dataType',
      key: 'dataType',
      render: (value, record, index) => (
        <Cascader
          allowClear={false}
          options={dataTypes}
          expandTrigger="hover"
          displayRender={displayRender}
          defaultValue={CascaderValue(value)}
          onChange={(value) => {
            handleInputValue(index, record, 'dataType', CascaderChange(value));
          }}
          placeholder="请选择变量类型"
        />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 160,
      render: (_, record, index) => (
        <Input
          placeholder="请描述变量用途"
          onChange={(e) =>
            handleInputValue(index, record, 'description', e.target.value)
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 50,
      render: (_, record, index) => (
        <Space className={cx('flex', 'content-between')}>
          <MinusCircleOutlined
            onClick={() => handleReduce(index, record)}
            className={cx('cursor-pointer', styles['reduce-icon'])}
          />
          {record.dataType === DataTypeEnum.Object && (
            <span
              className={cx('hover-box')}
              onClick={() => handleAddChildren(index)}
            >
              <PlusOutlined />
            </span>
          )}
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    const newInputData = cloneDeep(inputData);
    const keyList = newInputData?.map((item) => item.key);
    // 新key值：取table数据最大key值 + 1
    const _key = keyList?.length > 0 ? Math.max(...keyList) + 1 : 1;
    const newData: TriggerRequireInputType = {
      key: _key,
      name: '',
      dataType: DataTypeEnum.String,
      description: '',
    };
    setInputData([...newInputData, newData]);
  };

  return (
    <div className={cx(styles['require-params'], 'radius-6')}>
      <div className={cx('flex', styles['r-header'])}>
        <DownOutlined />
        <span>请求参数</span>
        <TooltipIcon
          title="用于其他系统对Webhook URL发出的POST请求中RequestBody需遵循的JSON格式，触发任务将基于该消息格式执行后续动作"
          icon={<InfoCircleOutlined />}
        />
        <span
          className={cx(
            'hover-box',
            'cursor-pointer',
            'flex',
            'items-center',
            'content-center',
            styles['plus-icon'],
          )}
          onClick={handleAdd}
        >
          <PlusOutlined />
        </span>
      </div>
      <Table<TriggerRequireInputType>
        className={cx(styles['table-container'], 'overflow-hide')}
        columns={inputColumns}
        dataSource={inputData}
        pagination={false}
        expandable={{
          defaultExpandAllRows: true,
          expandedRowKeys: expandedRowKeys,
          expandIcon: () => null,
        }}
      />
    </div>
  );
});

export default RequireParams;
