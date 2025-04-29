// 可以编辑的表格
import type { MyTableProp } from '@/types/interfaces/table';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Popover, Space, Table } from 'antd';
import React from 'react';
import './index.less';
const MyTable: React.FC<MyTableProp> = ({
  columns,
  tableData,
  actionColumn,
  actionColumnFixed,
  showDescription,
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
          x: 'max-content',
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
                locale: {
                  items_per_page: '条 / 页',
                },
              }
            : false
        }
      >
        {/* 序号列 */}
        {showIndex && (
          <Table.Column
            title={'序号'}
            dataIndex="serial"
            width={70}
            render={(_, __, index) => {
              const current = pagination?.current || 1;
              const pageSize = pagination?.pageSize || 10;
              return (current - 1) * pageSize + index + 1;
            }}
          ></Table.Column>
        )}
        {/* 显示的列 */}

        {columns.map((item, index) => (
          <Table.Column
            key={item.dataIndex}
            title={
              <div className="dis-left">
                <span>{item.title}</span>
                {showDescription && item.description && (
                  <Popover
                    content={<p>{item.description}</p>}
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
            fixed={actionColumnFixed && index === 0 ? 'left' : undefined} // 设置为固定列
            width={item.title.length * 20} // 假设每个字符宽度为 16px
            dataIndex={item.dataIndex}
            render={(value) => {
              console.log('item.type', item.type);
              switch (item.type) {
                case 'checkbox':
                  return <Checkbox checked={value} />;
                case 'time':
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
        {actionColumn && (
          <Table.Column
            title={<span style={{ marginLeft: '10px' }}>操作</span>}
            dataIndex="action"
            width={actionColumnWidth}
            className={'table-action-column-fiexd'}
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
            onCell={() => ({ style: { zIndex: 100 } })}
          ></Table.Column>
        )}
      </Table>
    </div>
  );
};

export default MyTable;
