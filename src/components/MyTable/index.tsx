// 可以编辑的表格
import type { MyTableProp } from '@/types/interfaces/table';
import { Button, Checkbox, Space, Table } from 'antd';
import React from 'react';
import './index.less';
const MyTable: React.FC<MyTableProp> = ({
  columns,
  tableData,
  actionColumn,
  actionColumnFixed,
  scrollHeight,
  showIndex,
  rowKey = 'id',
  actionColumnWidth = 160,
  showPagination,
  pagination,
  onPageChange,
}) => {
  return (
    <div
      className="dis-col height-100"
      style={{ maxHeight: scrollHeight, overflow: 'hidden' }}
    >
      <Table
        dataSource={tableData}
        rowKey={rowKey}
        scroll={{
          x: true,
          y:
            (pagination?.pageSize || 10) * 54 > scrollHeight - 114
              ? scrollHeight - 114
              : undefined,
        }}
        pagination={
          showPagination
            ? {
                ...pagination,
                onChange: onPageChange,
                showTotal: (total) => `共 ${total} 条`,
                showSizeChanger: true,
              }
            : false
        }
      >
        {/* 序号列 */}
        {showIndex && (
          <Table.Column
            title={'序号'}
            dataIndex="serial"
            render={(_, __, index) => {
              const current = pagination?.current || 1;
              const pageSize = pagination?.pageSize || 10;
              return (current - 1) * pageSize + index + 1;
            }}
          ></Table.Column>
        )}
        {/* 显示的列 */}

        {columns.map((item) => (
          <Table.Column
            key={item.dataIndex}
            title={item.title}
            dataIndex={item.dataIndex}
            render={(value, record) => {
              switch (item.type) {
                case 'checkbox':
                  return <Checkbox checked={value} disabled={!record.isNew} />;
                case 'time':
                  return new Date(value).toLocaleString('zh-CN', {
                    hour12: false,
                  }); // 转换为 '2024-08-07 16:24:27' 格式
                default:
                  return value; // 其他类型的单元格直接返回原始值，不做任何处理
              }
            }}
          />
        ))}
        {/* 操作列 */}
        {actionColumn && (
          <Table.Column
            title={'操作'}
            dataIndex="action"
            width={actionColumnWidth}
            fixed={actionColumnFixed ? 'right' : undefined} // 设置为固定列
            render={(_, record) => {
              return (
                <Space>
                  {actionColumn.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Button
                        icon={<IconComponent />}
                        key={item.name}
                        onClick={() => item.func(record)}
                        title={item.description}
                        type={'text'}
                      />
                    );
                  })}
                </Space>
              );
            }}
          ></Table.Column>
        )}
      </Table>
    </div>
  );
};

export default MyTable;
