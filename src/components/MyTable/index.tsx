// 可以编辑的表格
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { PaginationProps } from 'antd';
import { Button, Flex, Form, Pagination, Space, Table } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import React, { useState } from 'react';
import EditableCell from './EditableCell';
import './index.less';
import type { MyTableProp } from './type';
const MyTable: React.FC<MyTableProp> = ({
  columns,
  tableData,
  actionColumn,
  scrollHeight,
  showEditRow,
  showIndex,
  showAddRow,
  rowKey = 'id',
  actionColumnWidth = 160,
  pagination,
  onPageChange,
  onRowChange,
}) => {
  // 当前正在修改的行
  const [editingKey, setEditingKey] = useState<string | null>(null);
  //   判断当前行是否正在编辑
  const isEditing = (record: AnyObject) => record[rowKey] === editingKey;
  // 使用外部传入的 tableData 作为表格的初始值
  const [dataSource, setDataSource] = useState(tableData);
  //
  const [form] = Form.useForm();

  //   新增行
  const handleAddRow = () => {
    const newRow: Record<string, any> = {
      [rowKey]: `newRow${tableData.length + 1}`,
    };
    columns.forEach((column) => {
      switch (column.type) {
        case 'checkbox':
          newRow[column.dataIndex] = false;
          break;
        case 'tag':
        case 'text':
        case 'date':
          newRow[column.dataIndex] = '';
          break;
        default:
          newRow[column.dataIndex] = '';
      }
    });
    setEditingKey(newRow[rowKey]);
    setDataSource([...dataSource, newRow]);
    // 滚动到表格底部
    setTimeout(() => {
      const tableBody = document.querySelector('.ant-table-body');
      if (tableBody) {
        tableBody.scrollTop = tableBody.scrollHeight;
      }
    }, 0);
  };
  // 删除行
  const handleDeleteRow = (key: AnyObject) => {
    console.log(key);
  };
  //   编辑行
  const handleEdit = (record: AnyObject) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record[rowKey]);
  };
  //   保存当前编辑的行
  const handleSave = async (key: string) => {
    try {
      const row = await form.validateFields();
      console.log(row);
      const newData = [...dataSource];
      const index = newData.findIndex((item) => item[rowKey] === key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setDataSource(newData);
        setEditingKey(null);
        if (onRowChange) {
          onRowChange(newData);
        }
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };
  //   取消编辑
  const handleCancel = (record: AnyObject) => {
    console.log(record);
    setEditingKey(null);
  };

  // 改变分页
  const changePagination: PaginationProps['onChange'] = (page, pageSize) => {
    console.log(page, pageSize);
    if (onPageChange) {
      onPageChange(page, pageSize);
    }
  };

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: AnyObject) => ({
        record: {
          ...record,
          type: col.type, // 确保将列类型传递给record
        },
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <div className="dis-col height-100">
      <div
        className="flex-1"
        style={{ maxHeight: scrollHeight, overflow: 'hidden' }}
      >
        <Form form={form} component={false} style={{ height: '100%' }}>
          <Table
            dataSource={dataSource}
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            rowKey={rowKey}
            pagination={false}
            style={{ height: '100%' }}
            scroll={{ x: true, y: scrollHeight - 84 }}
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

            {mergedColumns.map((item) => (
              <Table.Column
                key={item.dataIndex}
                title={item.title}
                dataIndex={item.dataIndex}
                onCell={item.onCell}
              />
            ))}
            {/* 操作列 */}

            <Table.Column
              title={'操作'}
              dataIndex="action"
              width={actionColumnWidth}
              render={(_, record) => {
                const editable = isEditing(record);

                return (
                  <Space>
                    {editable ? (
                      <>
                        <span title={'保存'}>
                          <CheckCircleOutlined
                            onClick={() => handleSave(record[rowKey])}
                          />
                        </span>
                        <span title={'取消'}>
                          <CloseCircleOutlined
                            onClick={() => handleCancel(record)}
                          />
                        </span>
                      </>
                    ) : (
                      <>
                        {showEditRow && (
                          <span
                            title={'编辑'}
                            onClick={() => handleEdit(record)}
                          >
                            <EditOutlined />
                          </span>
                        )}
                        {actionColumn &&
                          actionColumn.map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <span
                                key={item.name}
                                onClick={() => item.func(record)}
                                title={item.description}
                              >
                                <IconComponent />
                              </span>
                            );
                          })}
                        <span
                          title={'删除'}
                          onClick={() => handleDeleteRow(record)}
                        >
                          <DeleteOutlined />
                        </span>
                      </>
                    )}
                  </Space>
                );
              }}
            ></Table.Column>
          </Table>
        </Form>
      </div>
      <Flex justify="space-between" className="pagination-style">
        {showAddRow ? (
          <Button
            className="add-button-style"
            onClick={handleAddRow}
            icon={<PlusOutlined />}
          >
            新增
          </Button>
        ) : (
          <span></span>
        )}
        {pagination && (
          <Pagination
            showSizeChanger
            current={pagination?.current}
            total={pagination?.total}
            onChange={changePagination}
            showTotal={(e) => `共${e}条`}
          />
        )}
      </Flex>
    </div>
  );
};

export default MyTable;
