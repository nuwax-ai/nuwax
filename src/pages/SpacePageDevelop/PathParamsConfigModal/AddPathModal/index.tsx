import CustomFormModal from '@/components/CustomFormModal';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { AddPathModalProps } from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input } from 'antd';
import React from 'react';

/**
 * 添加（修改）路径参数弹窗
 */
const AddPathModal: React.FC<AddPathModalProps> = ({
  mode = CreateUpdateModeEnum.Create,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();

  // 创建、更新定时任务
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    console.log(values);
    onConfirm();
  };

  const handlerConfirm = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title={mode === CreateUpdateModeEnum.Create ? '添加路径' : '修改路径'}
      onCancel={onCancel}
      onConfirm={handlerConfirm}
    >
      <Form
        form={form}
        preserve={false}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="路径名称"
          rules={[{ required: true, message: '请输入路径名称' }]}
        >
          <Input
            placeholder="路径名称，例如 /detail/view"
            showCount
            maxLength={50}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label="路径功能描述"
          rules={[{ required: true, message: '请输入路径功能描述信息' }]}
        >
          <Input.TextArea
            placeholder="路径功能描述信息，例如 获取详情信息"
            autoSize={{ minRows: 4, maxRows: 6 }}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default AddPathModal;
