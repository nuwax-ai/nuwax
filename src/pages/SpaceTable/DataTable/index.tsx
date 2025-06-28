import { TableFieldTypeEnum } from '@/types/enums/dataTable';
import { TableFieldInfo } from '@/types/interfaces/dataTable';
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Popover, Space, Table } from 'antd';
import React from 'react';
import './index.less';

export interface DataTableProp {
  // 表头
  columns: TableFieldInfo[];
  // 表数据
  tableData: any[];
  // 表格的滚动高度
  scrollHeight: number;
  // 分页的数据
  pagination?: {
    current: number; // 当前页码
    pageSize: number; // 每页显示条数
    total: number; // 总条数
  };
  // 分页或者排序发生变更，重新获取数据
  onPageChange?: (page: number, pageSize: number) => void;
  onEdit: (data: any) => void;
  onDel: (data: any) => void;
}

const DataTable: React.FC<DataTableProp> = ({
  columns,
  tableData,
  scrollHeight,
  pagination,
  onPageChange,
  onEdit,
  onDel,
}) => {
  return (
    <div
      className="dis-col height-100"
      style={{ maxHeight: scrollHeight, overflow: 'hidden' }}
    >
      <Table
        className="my-table-style"
        dataSource={tableData}
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
        {columns.map((item, index) => (
          <Table.Column
            key={item.fieldName}
            title={
              <div className="dis-left">
                <span>{item.fieldName}</span>
                {item.fieldDescription && (
                  <Popover
                    content={<p>{item.fieldDescription}</p>}
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
            fixed={index === 0 ? 'left' : undefined} // 设置为固定列
            // width={item.width}
            dataIndex={item.fieldName}
            // onCell={() => ({
            //   style: {
            //     // maxWidth: item.width,
            //     overflow: 'hidden',
            //     textOverflow: 'ellipsis',
            //     whiteSpace: 'nowrap',
            //   },
            // })}
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
          title={<span style={{ marginLeft: '10px' }}>操作</span>}
          dataIndex="action"
          width={160}
          className={'table-action-column-fiexd'}
          fixed="right"
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
