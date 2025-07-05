import { TableFieldTypeEnum } from '@/types/enums/dataTable';
import { DataTableProp, TableFieldInfo } from '@/types/interfaces/dataTable';
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Popover, Space, Table } from 'antd';
import React, { useMemo } from 'react';
import './index.less';

const DataTable: React.FC<DataTableProp> = ({
  columns,
  tableData,
  loading,
  scrollHeight,
  pagination,
  onPageChange,
  onEdit,
  onDel,
}) => {
  // 排序列表，将非系统字段列放在前面，系统字段列放在后面
  const customColumns = useMemo(() => {
    // 过滤出非系统字段列和系统字段列
    const [_systemFieldList, _customFieldList] = columns.reduce<
      [TableFieldInfo[], TableFieldInfo[]]
    >(
      (acc, item) => {
        acc[item.systemFieldFlag ? 0 : 1].push(item);
        return acc;
      },
      [[], []],
    );
    // 将id列放在前面，其他列保持不变
    const id = _systemFieldList.find((column) => column.fieldName === 'id');
    const idColumn = id ? [id] : [];
    // 将非id列放在后面，其他列保持不变
    const exceptIdColumn = _systemFieldList.filter(
      (column) => column.fieldName !== 'id',
    );
    return [...idColumn, ..._customFieldList, ...exceptIdColumn];
  }, [columns]);
  return (
    <div
      className="dis-col height-100"
      style={{ maxHeight: scrollHeight, overflow: 'hidden' }}
    >
      <Table
        className="my-table-style"
        dataSource={tableData}
        loading={loading}
        rowKey="id"
        scroll={{
          x: 'max-content',
          y:
            (pagination?.pageSize || 10) * 54 > scrollHeight - 114
              ? scrollHeight - 144
              : undefined,
        }}
        pagination={{
          ...pagination,
          onChange: onPageChange,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          locale: {
            items_per_page: '条 / 页',
          },
        }}
      >
        {customColumns.map((item, index) => (
          <Table.Column
            key={item.fieldName}
            title={
              <div className="dis-left">
                <span>{item.fieldName}</span>
                {item.fieldDescription && (
                  <Popover
                    content={item.fieldDescription}
                    trigger="hover"
                    mouseEnterDelay={0.5}
                    placement="top"
                  >
                    <InfoCircleOutlined style={{ marginLeft: '10px' }} />
                  </Popover>
                )}
              </div>
            }
            ellipsis
            className={'table-data-column'}
            fixed={index === 0 ? 'left' : undefined} // 设置为固定列
            dataIndex={item.fieldName}
            render={(value) => {
              switch (item.fieldType) {
                case TableFieldTypeEnum.Boolean:
                  return <Checkbox checked={value} disabled />;
                case TableFieldTypeEnum.Date:
                  return value
                    ? new Date(value).toLocaleString('zh-CN', {
                        hour12: false,
                      })
                    : '--'; // 转换为 '2024-08-07 16:24:27' 格式
                default:
                  return value || '--'; // 其他类型的单元格直接返回原始值，不做任何处理
              }
            }}
          />
        ))}

        {/* 操作列 */}
        <Table.Column
          title="操作"
          dataIndex="action"
          width={100}
          className={'table-action-column-fixed'}
          fixed="right"
          align="center"
          render={(_, record) => (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                title="编辑"
                type="text"
              />
              <Button
                icon={<DeleteOutlined />}
                onClick={() => onDel(record)}
                title="删除"
                type="text"
              />
            </Space>
          )}
        ></Table.Column>
      </Table>
    </div>
  );
};

export default DataTable;
