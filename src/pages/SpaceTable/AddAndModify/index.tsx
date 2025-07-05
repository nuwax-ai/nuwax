import { EllipsisTooltip } from '@/components/EllipsisTooltip';
import { BOOLEAN_LIST } from '@/constants/dataTable.constants';
import { TableFieldTypeEnum } from '@/types/enums/dataTable';
import {
  AddAndModifyProps,
  TableFieldInfo,
  TableRowData,
} from '@/types/interfaces/dataTable';
import { formatterNumber, parserNumber } from '@/utils/ant-custom';
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
    const { fieldType, fieldName } = item;
    switch (fieldType) {
      case TableFieldTypeEnum.Date:
        return <DatePicker showTime placeholder="请选择时间" />;
      case TableFieldTypeEnum.String:
        return (
          <Input placeholder={`请输入${fieldName}`} showCount maxLength={255} />
        );
      case TableFieldTypeEnum.MEDIUMTEXT:
        return (
          <Input.TextArea
            placeholder={`请输入${fieldName}`}
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
            ? `数值范围：[-2147483648, 2147483648]`
            : `精度20位,整数部分最多14位,小数部分最多6位`;
        return <InputNumber {...props} placeholder={placeholder} />;
      }

      default:
        return (
          <Input placeholder={`请输入${fieldName}`} showCount maxLength={255} />
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
              label={<EllipsisTooltip text={item.fieldDescription} />}
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
