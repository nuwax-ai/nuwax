import CustomFormModal from '@/components/CustomFormModal';
import { apiPageAddPath } from '@/services/pageDev';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  AddPathModalProps,
  PageAddPathParams,
} from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import React, { useState } from 'react';
import { useRequest } from 'umi';

/**
 * 添加（修改）路径参数弹窗
 */
const AddPathModal: React.FC<AddPathModalProps> = ({
  projectId,
  mode = CreateUpdateModeEnum.Create,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

  // 添加路径配置
  const { run: runAddPath } = useRequest(apiPageAddPath, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: PageAddPathParams[]) => {
      message.success('添加路径成功');
      setLoading(false);
      const info = params[0];
      onConfirm(info);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 提交表单
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    setLoading(true);
    runAddPath({
      projectId,
      ...values,
    });
  };

  const handlerConfirm = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title={mode === CreateUpdateModeEnum.Create ? '添加路径' : '修改路径'}
      loading={loading}
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
          label="路径名"
          rules={[{ required: true, message: '请输入路径名' }]}
        >
          <Input placeholder="请输入路径名" showCount maxLength={50} />
        </Form.Item>
        <Form.Item
          name="pageUri"
          label="路径名称"
          rules={[{ required: true, message: '请输入路径名称' }]}
        >
          <Input
            placeholder="路径名称，例如 /detail/view"
            showCount
            maxLength={50}
          />
        </Form.Item>
        <Form.Item name="description" label="路径功能描述">
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
