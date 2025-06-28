// 可以编辑的表格
import LabelStar from '@/components/LabelStar';
import {
  MEDIUM_TEXT_STRING,
  SHORT_TEXT_STRING,
  TABLE_FIELD_STRING_LIST,
  TABLE_FIELD_TYPE_LIST,
} from '@/constants/dataTable.constants';
import { TableFieldTypeEnum } from '@/types/enums/dataTable';
import type { TableFieldInfo } from '@/types/interfaces/dataTable';
import { DeleteOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Table,
  TableColumnsType,
} from 'antd';
import React from 'react';
import './index.less';

export interface StructureTableProps {
  tableData: TableFieldInfo[]; // 表格数据
  scrollHeight: number; // 表格高度
}

const StructureTable: React.FC<StructureTableProps> = ({
  tableData,
  scrollHeight,
}) => {
  // 获取字段类型
  const getFieldType = (fieldType: TableFieldTypeEnum) => {
    switch (fieldType) {
      case TableFieldTypeEnum.String:
      case TableFieldTypeEnum.MEDIUMTEXT:
        return 'String';
      case TableFieldTypeEnum.Integer:
      case TableFieldTypeEnum.PrimaryKey:
        return 'Integer';
      case TableFieldTypeEnum.Number:
        return 'Number';
      case TableFieldTypeEnum.Boolean:
        return 'Boolean';
      case TableFieldTypeEnum.Date:
        return 'Date';
      default:
        return '--';
    }
  };

  // 获取数据长度
  const getStringLength = (fieldType: TableFieldTypeEnum) => {
    switch (fieldType) {
      case TableFieldTypeEnum.String:
        return SHORT_TEXT_STRING;
      case TableFieldTypeEnum.MEDIUMTEXT:
        return MEDIUM_TEXT_STRING;
      default:
        return '--';
    }
  };

  // 获取默认值
  const getDefaultValue = (record: TableFieldInfo) => {
    const { fieldType, systemFieldFlag, defaultValue } = record;
    if (systemFieldFlag) {
      return '系统变量';
    } else {
      switch (fieldType) {
        case TableFieldTypeEnum.String:
        case TableFieldTypeEnum.MEDIUMTEXT:
          return <Input placeholder="请输入" defaultValue={defaultValue} />;
        case TableFieldTypeEnum.Integer:
        case TableFieldTypeEnum.Number:
        case TableFieldTypeEnum.PrimaryKey:
          return (
            <InputNumber placeholder="请输入" defaultValue={defaultValue} />
          );
        case TableFieldTypeEnum.Boolean:
          return <Checkbox />;
        case TableFieldTypeEnum.Date:
          return (
            <DatePicker placeholder="请选择时间" defaultValue={defaultValue} />
          );
        default:
          return defaultValue || '--';
      }
    }
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<TableFieldInfo> = [
    {
      title: '序号',
      dataIndex: 'serial',
      render: (_, __, index) => <span>{index + 1}</span>,
    },
    {
      title: <LabelStar label="字段名" />,
      dataIndex: 'fieldName',
      render: (value, record) => (
        <>
          {!record.isNew ? (
            <span>{value}</span>
          ) : (
            <Input
              placeholder="请输入字段名"
              // value={value}
              // onChange={(e) =>
              //   handleInputValue(record.key, 'description', e.target.value)
              // }
            />
          )}
        </>
      ),
    },
    {
      title: '字段详细描述',
      dataIndex: 'fieldDescription',
      render: (value, record) =>
        record.systemFieldFlag ? (
          <span>{value}</span>
        ) : (
          <Input
            placeholder="请输入字段详细描述"
            // value={value}
            // onChange={(e) =>
            //   handleInputValue(record.key, 'description', e.target.value)
            // }
          />
        ),
    },
    {
      title: '参数类型',
      dataIndex: 'fieldType',
      render: (value, record) =>
        !record.isNew ? (
          <span>{getFieldType(value)}</span>
        ) : (
          <Select options={TABLE_FIELD_TYPE_LIST} />
        ),
    },
    {
      title: '数据长度',
      dataIndex: 'dataLength',
      key: 'dataLength',
      render: (_, record) =>
        !record.isNew ? (
          <span>{getStringLength(record.fieldType)}</span>
        ) : (
          <Select options={TABLE_FIELD_STRING_LIST} />
        ),
    },
    {
      title: '是否必须',
      dataIndex: 'nullableFlag',
      key: 'nullableFlag',
      align: 'center',
      render: (_, record) => <Checkbox disabled={record.systemFieldFlag} />,
    },
    {
      title: '是否唯一',
      dataIndex: 'uniqueFlag',
      key: 'uniqueFlag',
      align: 'center',
      render: (value, record) => <Checkbox disabled={record.systemFieldFlag} />,
    },
    {
      title: '是否启用',
      dataIndex: 'enabledFlag',
      key: 'enabledFlag',
      align: 'center',
      render: (value, record) => <Checkbox disabled={record.systemFieldFlag} />,
    },
    {
      title: '默认值',
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      render: (_, record) => getDefaultValue(record),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        // <DeleteOutlined />
        <Button
          type="text"
          disabled={!record.isNew}
          // onClick={() => handleDeleteRow(record[rowKey])}
          icon={<DeleteOutlined />}
        ></Button>
      ),
    },
  ];

  return (
    <div className="dis-col edit-table">
      <div
        className="flex-1"
        style={{ maxHeight: scrollHeight, overflow: 'hidden' }}
      >
        <Table
          dataSource={tableData}
          columns={inputColumns}
          rowKey={'id'}
          pagination={false}
          scroll={{
            x: true,
            y:
              tableData.length * 54 > scrollHeight - 124
                ? scrollHeight - 124
                : undefined,
          }}
        />
      </div>
    </div>
  );
};

export default StructureTable;
