import { Checkbox, DatePicker, Form, Input, Tag } from 'antd';
import React from 'react';

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  record: any;
  children: React.ReactNode;
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  record,
  children,
  ...restProps
}) => {
  const renderNormalCell = () => {
    if (!record) return children;
    switch (record.type) {
      case 'checkbox':
        return <Checkbox checked={record[dataIndex]} />;
      case 'tag':
        return <Tag>{record[dataIndex]}</Tag>;
      default:
        return children;
    }
  };

  const inputNode = () => {
    switch (record.type) {
      case 'checkbox':
        console.log('checkbox', record[dataIndex]);
        return <Checkbox />;
      case 'date':
        return <DatePicker />;
      default:
        return <Input />;
    }
  };

  return (
    <td {...restProps} className={editing ? 'editing-cell' : ''}>
      {editing ? (
        <Form.Item
          className="editable-cell-form-item"
          name={dataIndex}
          valuePropName={record.type === 'checkbox' ? 'checked' : 'value'}
        >
          {inputNode()}
        </Form.Item>
      ) : (
        renderNormalCell()
      )}
    </td>
  );
};

export default EditableCell;
