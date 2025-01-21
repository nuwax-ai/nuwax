import {
  ParamsSettingDefaultOptions,
  VARIABLE_TYPE_LIST,
} from '@/constants/common.constants';
import { VariableTypeEnum } from '@/types/enums/common';
import type { TableColumnsType } from 'antd';
import { Input, Select, Space, Switch, Table, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DataType {
  key: React.Key;
  paramsName: {
    name: string;
    text: string;
  };
  type: VariableTypeEnum;
  required: boolean;
  open: boolean;
}

const ParamsSetting: React.FC = () => {
  const handlerChange = (checked: boolean) => {
    console.log(checked);
  };

  const columns: TableColumnsType<DataType>['columns'] = [
    {
      title: '参数名称',
      dataIndex: 'paramsName',
      key: 'paramsName',
      width: 230,
      render: (value) => (
        <div className={cx('flex', 'flex-col', styles['params-td'])}>
          <span className={cx(styles['params-name'])}>{value.name}</span>
          <Tooltip
            title={value.text?.length > 10 ? value.text : ''}
            placement={'top'}
          >
            <span className={cx('text-ellipsis', styles['desc'])}>
              {value.text}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '参数类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value) => (
        <div>
          {VARIABLE_TYPE_LIST.find((item) => item.value === value)?.label}
        </div>
      ),
    },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
      width: 80,
      render: (value) => <span>{value ? '必填' : '非必填'}</span>,
    },
    {
      title: '默认值',
      key: 'default',
      render: () => (
        <>
          <Space.Compact block>
            <Select
              rootClassName={cx(styles['select'])}
              options={ParamsSettingDefaultOptions}
            />
            <Input placeholder="请输入" />
          </Space.Compact>
        </>
      ),
    },
    {
      title: '开启',
      key: 'open',
      width: 80,
      dataIndex: 'open',
      render: (_, record) => (
        <Switch defaultChecked={record.open} onChange={handlerChange} />
      ),
    },
  ];

  const dataSource: DataType[] = [
    {
      key: '1',
      paramsName: {
        name: 'count',
        text: '响应中返回的搜索结果数量。默认为10，最大值为50。实际返回结果的数量可能会少于请求的数量',
      },
      type: VariableTypeEnum.Integer,
      required: false,
      open: true,
    },
    {
      key: '2',
      paramsName: {
        name: 'offset',
        text: '从返回结果前要跳过的基于零的偏移量。默认为0。',
      },
      type: VariableTypeEnum.Integer,
      required: false,
      open: true,
    },
    {
      key: '3',
      paramsName: {
        name: 'query',
        text: '查询关键词',
      },
      type: VariableTypeEnum.Integer,
      required: true,
      open: true,
    },
  ];

  return (
    <div className={cx(styles.container)}>
      <Table<DataType>
        columns={columns}
        dataSource={dataSource}
        pagination={false}
      />
    </div>
  );
};

export default ParamsSetting;
