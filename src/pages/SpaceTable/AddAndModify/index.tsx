import { BOOLEAN_LIST } from '@/constants/dataTable.constants';
import { TableFieldTypeEnum } from '@/types/enums/dataTable';
import {
  AddAndModifyProps,
  TableFieldInfo,
  TableRowData,
} from '@/types/interfaces/dataTable';
import { customizeRequiredMark } from '@/utils/form';
import { DatePicker, Form, Input, InputNumber, Modal, Radio } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect } from 'react';
import './index.less';

// 新增和修改的组件
const AddAndModify: React.FC<AddAndModifyProps> = ({
  open,
  title,
  loading,
  onSubmit,
  initialValues,
  formList,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && initialValues) {
      const _initialValues: {
        [key: string]: string | number | boolean | Dayjs;
      } = { ...initialValues };
      // 根据formList，找出type为DatePicker的字段，将值转换为dayjs对象
      formList.forEach((item) => {
        if (
          item.fieldType === TableFieldTypeEnum.Date &&
          _initialValues[item.fieldName]
        ) {
          _initialValues[item.fieldName] = dayjs(
            _initialValues[item.fieldName].toString(),
          );
        }
      });
      form.setFieldsValue(_initialValues);
    }
  }, [open, initialValues, formList]);

  const inputNode = (item: TableFieldInfo) => {
    switch (item.fieldType) {
      case TableFieldTypeEnum.Date:
        return <DatePicker showTime placeholder="请选择时间" />;
      case TableFieldTypeEnum.String:
        return (
          <Input
            placeholder={`请输入${item.fieldName}`}
            showCount
            maxLength={255}
          />
        );
      case TableFieldTypeEnum.MEDIUMTEXT:
        return (
          <Input.TextArea
            placeholder={`请输入${item.fieldName}`}
            className="dispose-textarea-count"
            showCount
            maxLength={4194304}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        );
      case TableFieldTypeEnum.Boolean:
        return <Radio.Group options={BOOLEAN_LIST} />;
      case TableFieldTypeEnum.Number:
      case TableFieldTypeEnum.Integer:
      case TableFieldTypeEnum.PrimaryKey:
        return <InputNumber />;
      default:
        return (
          <Input
            placeholder={`请输入${item.fieldName}`}
            showCount
            maxLength={255}
          />
        );
    }
  };

  const onFinish = (values: TableRowData) => {
    onSubmit(values);
  };

  return (
    <Modal
      title={title}
      open={open}
      destroyOnClose
      onOk={() => {
        form.submit();
      }}
      onCancel={onCancel}
      okText="提交"
      cancelText="取消"
      confirmLoading={loading}
      className="add-modal-style"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        preserve={false}
        requiredMark={customizeRequiredMark}
        className="add-modify-form"
      >
        {formList.map((item, index) => {
          const inputDesc = [
            TableFieldTypeEnum.Boolean,
            TableFieldTypeEnum.Date,
          ].includes(item.fieldType)
            ? '请选择'
            : '请输入';
          const rules = !item.nullableFlag
            ? [{ required: true, message: `${inputDesc}${item.fieldName}` }]
            : [];
          return (
            <Form.Item
              key={index}
              name={item.fieldName}
              label={item.fieldDescription}
              rules={rules}
            >
              {inputNode(item)}
            </Form.Item>
          );
        })}
      </Form>
    </Modal>
  );
};

export default AddAndModify;
