import TooltipIcon from '@/components/TooltipIcon';
import { VARIABLE_TYPE_LIST } from '@/constants/common.constants';
import { DataTypeEnum } from '@/types/enums/common';
import type { TriggerRequireInputType } from '@/types/interfaces/agentConfig';
import {
  DownOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Input, Select, Space, Table, TableColumnsType } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 请求参数
 */
const RequireParams: React.FC = () => {
  const [inputData, setInputData] = useState<TriggerRequireInputType[]>([
    {
      key: 1,
      name: '',
      dataType: DataTypeEnum.String,
      description: '',
    },
  ]);

  const handleReduce = (record: TriggerRequireInputType) => {
    const newData = inputData.filter((item) => item.key !== record.key);
    setInputData(newData);
  };

  // 输入变量名
  const handleChange = (e, record, index) => {
    const newInputData = cloneDeep(inputData);
    // 第一层
    if (newInputData[index]?.key === record.key) {
      newInputData[index].name = e.target.value;
      setInputData(newInputData);
    } else {
      const _newInputData = newInputData.map((item) => {
        if (item.children?.[index]?.key === record.key) {
          item.children[index].name = e.target.value;
        }
        return item;
      });
      setInputData(_newInputData);
    }
  };

  // 切换变量类型
  const handleChangeSelect = (value, record, index) => {
    const newInputData = cloneDeep(inputData);
    // 第一层
    if (newInputData[index]?.key === record.key) {
      newInputData[index].dataType = value;
      newInputData[index].children = [];
      setInputData(newInputData);
    } else {
      const _newInputData = newInputData.map((item) => {
        if (item.children?.[index]?.key === record.key) {
          item.children[index].dataType = value;
        }
        return item;
      });
      setInputData(_newInputData);
    }
  };

  const handleAddChildren = (index) => {
    const newInputData = cloneDeep(inputData);
    if (!newInputData[index].children) {
      newInputData[index].children = [];
    }
    const _key = index + Math.random();
    const newData: TriggerRequireInputType = {
      key: _key,
      name: '',
      dataType: DataTypeEnum.String,
      description: '',
    };

    newInputData[index].children = [...newInputData[index].children, newData];
    setInputData(newInputData);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<TriggerRequireInputType>['columns'] = [
    {
      title: '变量名',
      dataIndex: 'name',
      key: 'name',
      className: 'flex',
      render: (_, record, index) => (
        <Input
          placeholder="请输入变量名"
          onChange={(e) => handleChange(e, record, index)}
        />
      ),
    },
    {
      title: '变量类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (_, record, index) => (
        <Select
          options={VARIABLE_TYPE_LIST}
          placeholder="请选择变量类型"
          onChange={(value) => handleChangeSelect(value, record, index)}
        />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 120,
      render: () => <Input placeholder="请描述变量用途" />,
    },
    {
      title: '操作',
      key: 'action',
      width: 50,
      render: (_, record, index) => (
        <Space>
          <span>{record.dataType}</span>
          <MinusCircleOutlined
            onClick={() => handleReduce(record)}
            className={cx('cursor-pointer', styles['reduce-icon'])}
          />
          {record.dataType === DataTypeEnum.Object && (
            <span onClick={() => handleAddChildren(index)}>
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
          expandIcon: () => null,
        }}
      />
    </div>
  );
};

export default RequireParams;
