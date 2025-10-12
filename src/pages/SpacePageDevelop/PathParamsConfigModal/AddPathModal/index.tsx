import CustomFormModal from '@/components/CustomFormModal';
import { apiPageAddPath, apiPageUpdatePath } from '@/services/pageDev';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  AddPathModalProps,
  PageAddPathParams,
} from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

/**
 * 添加（修改）路径参数弹窗
 */
const AddPathModal: React.FC<AddPathModalProps> = ({
  projectId,
  mode = CreateUpdateModeEnum.Create,
  editPathInfo,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

  const title = mode === CreateUpdateModeEnum.Create ? '添加路径' : '修改路径';

  useEffect(() => {
    if (open && editPathInfo) {
      form.setFieldsValue({
        name: editPathInfo.name,
        pageUri: editPathInfo.pageUri,
        description: editPathInfo.description,
      });
    } else {
      form.resetFields();
    }
  }, [open, editPathInfo]);

  const handleSuccess = (info: PageAddPathParams) => {
    message.success(`${title}成功`);
    setLoading(false);
    onConfirm(info, editPathInfo);
  };

  // 添加路径配置
  const { run: runAddPath } = useRequest(apiPageAddPath, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_: null, params: PageAddPathParams[]) => {
      const info = params[0];
      handleSuccess(info);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 编辑路径配置
  const { run: runUpdatePath } = useRequest(apiPageUpdatePath, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_: null, params: PageAddPathParams[]) => {
      const info = params[0];
      handleSuccess(info);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 提交表单
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    setLoading(true);
    const params = {
      projectId,
      ...values,
    };
    if (mode === CreateUpdateModeEnum.Create) {
      runAddPath(params);
    } else {
      runUpdatePath(params);
    }
  };

  const handlerConfirm = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title={title}
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
