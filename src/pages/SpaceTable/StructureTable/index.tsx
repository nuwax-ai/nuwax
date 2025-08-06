// 可以编辑的表格
import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import LabelStar from '@/components/LabelStar';
import {
  MEDIUM_TEXT_STRING,
  SHORT_TEXT_STRING,
  TABLE_FIELD_STRING_LIST,
  TABLE_FIELD_TYPE_LIST,
} from '@/constants/dataTable.constants';
import { TableFieldTypeEnum } from '@/types/enums/dataTable';
import type {
  StructureTableProps,
  TableFieldInfo,
} from '@/types/interfaces/dataTable';
import { formatterNumber, parserNumber } from '@/utils/ant-custom';
import { DeleteOutlined, DownOutlined } from '@ant-design/icons';
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
import classNames from 'classnames';
import dayjs, { Dayjs } from 'dayjs';
import React from 'react';
import ClearDataTooltip from './ClearDataTooltip';
import styles from './index.less';

const cx = classNames.bind(styles);

// 数据表字段结构
const StructureTable: React.FC<StructureTableProps> = ({
  existTableDataFlag,
  tableData,
  loading,
  scrollHeight,
  onChangeValue,
  onDeleteField,
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
    const {
      id,
      fieldType,
      fieldName,
      systemFieldFlag,
      defaultValue,
      dataLength,
    } = record;
    if (systemFieldFlag) {
      return <span className="flex items-center h-full">系统变量</span>;
    }
    // disabled: 新增成功的字段,不允许修改默认值; 除非用户清空所有的业务数据,然后再修改数据表的默认值
    switch (fieldType) {
      case TableFieldTypeEnum.String:
      case TableFieldTypeEnum.MEDIUMTEXT: {
        const maxLength =
          fieldType === TableFieldTypeEnum.String ? 255 : undefined;
        return (
          <Input
            placeholder={`请输入${fieldName}默认值`}
            // 这里没有使用defaultValue,是因为需要做清空操作
            value={defaultValue}
            maxLength={maxLength}
            showCount={dataLength === TableFieldTypeEnum.String}
            // 长文本: 禁止添加默认值;
            disabled={dataLength === TableFieldTypeEnum.MEDIUMTEXT}
            onChange={(e) => onChangeValue(id, 'defaultValue', e.target.value)}
          />
        );
      }
      case TableFieldTypeEnum.Integer:
      case TableFieldTypeEnum.Number:
      case TableFieldTypeEnum.PrimaryKey: {
        // 默认值的范围,如果字段类型是 int,范围限制在: [-2147483648,2147483647] 区间
        // NUMBER,对应类型是: DECIMAL(20,6) ,限制小数点最多 6位,整数最多:14 位,
        const props =
          fieldType === TableFieldTypeEnum.Integer
            ? { min: -2147483648, max: 2147483647, precision: 0 }
            : {
                precision: 6,
                min: '-99999999999999.999999',
                max: '99999999999999.999999',
                stringMode: true,
                formatter: formatterNumber,
                parser: parserNumber,
              };
        const placeholder =
          fieldType === TableFieldTypeEnum.Integer
            ? `数值范围：[-2147483648, 2147483647]`
            : `精度20位,整数部分最多14位,小数部分最多6位`;
        return (
          <InputNumber
            {...props}
            placeholder={placeholder}
            className={cx('w-full')}
            value={defaultValue}
            onChange={(value) => onChangeValue(id, 'defaultValue', value)}
          />
        );
      }
      case TableFieldTypeEnum.Boolean: {
        // 字符串时根据字符串的值,判断是否选中; boolean 时,直接使用值;
        const checked =
          typeof defaultValue === 'string'
            ? defaultValue === 'true'
            : defaultValue;
        return (
          <Checkbox
            checked={checked}
            onChange={(e) =>
              onChangeValue(id, 'defaultValue', e.target.checked)
            }
          />
        );
      }
      case TableFieldTypeEnum.Date:
        return (
          <DatePicker
            placeholder="请选择时间"
            showTime
            className={cx('w-full')}
            defaultValue={defaultValue ? dayjs(defaultValue) : null}
            disabled
            onChange={(date: Dayjs | (Dayjs | null)[] | null) =>
              onChangeValue(id, 'defaultValue', date as Dayjs)
            }
          />
        );
      default:
        return defaultValue || '--';
    }
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<TableFieldInfo> = [
    {
      title: '序号',
      dataIndex: 'serial',
      width: 80,
      render: (_, __, index) => <span>{index + 1}</span>,
    },
    {
      title: <LabelStar label="字段名" />,
      dataIndex: 'fieldName',
      width: 220,
      render: (value, record) => (
        <>
          {!record.isNew ? (
            <div className="flex items-center h-full">
              <EllipsisTooltip text={value} />
            </div>
          ) : (
            <Input
              placeholder="请输入字段名"
              value={value}
              allowClear
              onChange={(e) =>
                onChangeValue(record.id, 'fieldName', e.target.value)
              }
            />
          )}
        </>
      ),
    },
    {
      title: '字段详细描述',
      dataIndex: 'fieldDescription',
      width: 220,
      render: (value, record) =>
        record.systemFieldFlag ? (
          <span className="flex items-center h-full">{value}</span>
        ) : (
          <Input
            placeholder="请输入字段详细描述"
            value={value}
            allowClear
            disabled={record?.systemFieldFlag}
            onChange={(e) =>
              onChangeValue(record.id, 'fieldDescription', e.target.value)
            }
          />
        ),
    },
    {
      title: '字段类型',
      dataIndex: 'fieldType',
      width: 140,
      render: (value, record) =>
        record.id === 0 ? (
          '--'
        ) : !record.isNew ? (
          <span className="flex items-center h-full">
            {getFieldType(value)}
          </span>
        ) : (
          <Select
            options={TABLE_FIELD_TYPE_LIST}
            style={{ width: '100%' }}
            defaultValue={value}
            onChange={(value) => onChangeValue(record.id, 'fieldType', value)}
          />
        ),
    },
    {
      title: '数据长度',
      dataIndex: 'dataLength',
      width: 140,
      render: (value, record) =>
        record.id === 0 ? (
          '--'
        ) : record.isNew && record.fieldType === TableFieldTypeEnum.String ? (
          <Select
            options={TABLE_FIELD_STRING_LIST}
            style={{ width: '100%' }}
            defaultValue={value}
            onChange={(value) => onChangeValue(record.id, 'dataLength', value)}
          />
        ) : (
          <span className="flex items-center h-full">
            {getStringLength(record.fieldType)}
          </span>
        ),
    },
    // 字段nullableFlag	是否可为空,true:可空;false:非空,此处为'是否必须'，所以取反
    {
      title: '是否必须',
      dataIndex: 'nullableFlag',
      align: 'center',
      width: 90,
      render: (_, record) =>
        record.id === 0 ? (
          '--'
        ) : (
          <div className="flex items-center content-center h-full">
            <Checkbox
              disabled={record?.systemFieldFlag}
              checked={!record.nullableFlag}
              onChange={(e) =>
                onChangeValue(record.id, 'nullableFlag', e.target.checked)
              }
            />
          </div>
        ),
    },
    {
      title: '是否唯一',
      dataIndex: 'uniqueFlag',
      align: 'center',
      width: 90,
      render: (_, record) =>
        record.id === 0 ? (
          '--'
        ) : (
          <div className="flex items-center content-center h-full">
            <ClearDataTooltip
              record={record}
              existTableDataFlag={existTableDataFlag}
            >
              {/* 长文本时,不允许设置唯一索引 */}
              <Checkbox
                disabled={
                  record?.systemFieldFlag ||
                  (!record?.isNew && existTableDataFlag) ||
                  record?.dataLength === TableFieldTypeEnum.MEDIUMTEXT
                }
                checked={record.uniqueFlag}
                onChange={(e) =>
                  onChangeValue(record.id, 'uniqueFlag', e.target.checked)
                }
              />
            </ClearDataTooltip>
          </div>
        ),
    },
    {
      title: '是否启用',
      dataIndex: 'enabledFlag',
      align: 'center',
      width: 90,
      render: (_, record) =>
        record.id === 0 ? (
          '--'
        ) : (
          <div className="flex items-center content-center h-full">
            <Checkbox
              disabled={record.systemFieldFlag}
              checked={record.enabledFlag}
              onChange={(e) =>
                onChangeValue(record.id, 'enabledFlag', e.target.checked)
              }
            />
          </div>
        ),
    },
    {
      title: '默认值',
      dataIndex: 'defaultValue',
      width: 220,
      render: (_, record) =>
        record.id === 0 ? (
          '--'
        ) : (
          <div className="flex items-center h-full">
            {getDefaultValue(record)}
          </div>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) =>
        record.id === 0 ? (
          '--'
        ) : (
          <Button
            type="text"
            disabled={
              record?.systemFieldFlag || (!record?.isNew && existTableDataFlag)
            }
            onClick={() => onDeleteField(record.id)}
            icon={<DeleteOutlined />}
          ></Button>
        ),
    },
  ];

  return (
    <Table<TableFieldInfo>
      rootClassName={cx(styles['table-container'])}
      rowClassName={cx(styles['table-row'])}
      dataSource={tableData}
      columns={inputColumns}
      loading={loading}
      rowKey={'id'}
      pagination={false}
      virtual
      scroll={{
        x: 'max-content',
        y: scrollHeight - 100,
      }}
      expandable={{
        expandIcon: ({ expanded, onExpand, record }) =>
          record.children ? (
            <DownOutlined
              className={cx(styles.icon, { [styles['rotate-0']]: expanded })}
              onClick={(e) => onExpand(record, e)}
            />
          ) : (
            <DownOutlined className={cx(styles.icon, styles['icon-hidden'])} />
          ),
      }}
    />
  );
};

export default StructureTable;
