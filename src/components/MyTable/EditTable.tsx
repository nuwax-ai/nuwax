// 可以编辑的表格
import type { MyTableProp } from '@/types/interfaces/table';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Select, Table } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import React, { useEffect, useState } from 'react';
import './index.less';
export interface EditTableRef {
  submit: () => void;
  handleAddRow: (obj?: AnyObject) => void;
}

const MyTable: React.FC<MyTableProp> = ({
  columns,
  tableData,
  showIndex,
  rowKey = 'id',
  actionColumnWidth = 160,
  pagination,
  dataEmptyFlag,
  onDataSourceChange,
  formRef,
  scrollHeight,
}) => {
  // 使用外部传入的 tableData 作为表格的初始值
  const [dataSource, setDataSource] = useState(tableData);
  //
  const [form] = Form.useForm();

  //   新增行
  const handleAddRow = (obj?: AnyObject) => {
    let newRow: Record<string, any> = {
      [rowKey]: `newRow${dataSource.length + 1}`,
      isNew: true, // 标记为新增行
      systemFieldFlag: false,
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
    newRow = { ...newRow, ...obj };
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
    const newArr = dataSource.filter(
      (record) => record[rowKey] !== key[rowKey],
    );
    setDataSource(newArr);
  };

  // 提交表单数据
  const onFinish = (values: AnyObject) => {
    if (onDataSourceChange) {
      // 合并表单数据和dataSource
      const mergedData = dataSource.map((item, index) => ({
        ...item,
        ...values.tableData?.[index],
      }));
      mergedData.forEach((item, index) => {
        item.sortIndex = index;
      });
      onDataSourceChange(mergedData);
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
          type: col.type,
          isNew: record.isNew || false,
        },
        dataIndex: col.dataIndex,
        title: col.title,
        editing: dataEmptyFlag ? record.isNew : true,
      }),
    };
  });

  const getItemType = (
    type: string,
    name: string,
    options?: SelectOptions[],
  ) => {
    switch (type) {
      case 'checkbox':
        return <Checkbox />;
      case 'select':
        return <Select options={options} />;
      default:
        return <Input placeholder={`请输入${name}`} />;
    }
  };

  useEffect(() => {
    // 处理传入的tableData，添加row_key_chao字段
    const processedTableData = tableData.map((item) => ({
      ...item,
      [rowKey]: item.id,
    }));
    setDataSource(processedTableData);
  }, [tableData]);

  // 暴露form给父组件
  React.useImperativeHandle(formRef, () => ({
    submit: () => form.submit(),
    handleAddRow,
  }));
  return (
    <div className="dis-col edit-table">
      <div
        className="flex-1"
        style={{ maxHeight: scrollHeight, overflow: 'hidden' }}
      >
        <Form form={form} onFinish={onFinish} component={false}>
          <Form.List name="tableData">
            {() => (
              <Table
                dataSource={dataSource}
                rowKey={rowKey}
                pagination={false}
                scroll={{
                  x: true,
                  y:
                    dataSource.length * 54 > scrollHeight - 124
                      ? scrollHeight - 124
                      : undefined,
                }}
              >
                {/* 序号列 */}
                {showIndex && (
                  <Table.Column
                    title={'序号'}
                    width={70}
                    dataIndex="serial"
                    render={(_, __, index) => {
                      const current = pagination?.current || 1;
                      const pageSize = pagination?.pageSize || 10;
                      return (current - 1) * pageSize + index + 1;
                    }}
                  />
                )}
                {/* 显示的列 */}
                {mergedColumns.map((item) => (
                  <Table.Column
                    width={item.width}
                    key={item.dataIndex}
                    title={item.title}
                    dataIndex={item.dataIndex}
                    render={(value, record, index) => {
                      const shouldEdit =
                        (item.edit || !dataEmptyFlag || record?.isNew) &&
                        !record?.systemFieldFlag;

                      if (shouldEdit) {
                        return (
                          <Form.Item
                            name={[index, item.dataIndex]}
                            style={{ margin: 0 }}
                            valuePropName={
                              item.type === 'checkbox' ? 'checked' : 'value'
                            }
                            initialValue={record[item.dataIndex]}
                          >
                            {getItemType(item.type, item.title, item.options)}
                          </Form.Item>
                        );
                      }
                      return item.type === 'checkbox' ? (
                        <Checkbox checked={value} disabled />
                      ) : (
                        <span>
                          {item.map
                            ? item.map[value]
                            : value ||
                              (!value && record?.systemFieldFlag
                                ? item.defaultValue
                                : '')}
                        </span>
                      );
                    }}
                  />
                ))}
                {/* 操作列 */}
                <Table.Column
                  title={'操作'}
                  dataIndex="action"
                  width={actionColumnWidth}
                  render={(_, record) => (
                    <Button
                      type="text"
                      disabled={
                        dataEmptyFlag ? !record.isNew : record?.systemFieldFlag
                      }
                      onClick={() => handleDeleteRow(record)}
                      title={'删除'}
                      icon={<DeleteOutlined />}
                    ></Button>
                  )}
                ></Table.Column>
              </Table>
            )}
          </Form.List>
        </Form>
      </div>
    </div>
  );
};

export default MyTable;
