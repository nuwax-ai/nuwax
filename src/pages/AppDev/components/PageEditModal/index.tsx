import workflowIcon from '@/assets/images/agent_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import { apiPageUpdateProject } from '@/services/pageDev';
import { PageEditModalProps } from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

/**
 * 页面编辑弹窗
 */
const PageEditModal: React.FC<PageEditModalProps> = ({
  open,
  currentPageInfo,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  // 图标
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 上传前端项目压缩包并启动开发服务器
  const { run: runUpdatePage } = useRequest(apiPageUpdateProject, {
    manual: true,
    onSuccess: () => {
      message.success('编辑成功');
      onConfirm();
      setLoading(false);
    },
    onError: () => {
      message.error('编辑失败');
      setLoading(false);
    },
  });

  useEffect(() => {
    if (open && currentPageInfo) {
      const { name, description, icon } = currentPageInfo;
      form.setFieldsValue({
        projectName: name,
        projectDesc: description,
        icon: icon || '',
      });

      setImageUrl(icon);
    }
  }, [open, currentPageInfo]);

  // 编辑页面
  const onFinish: FormProps<any>['onFinish'] = async (values) => {
    setLoading(true);
    // 调用编辑页面接口
    const data = {
      ...values,
      projectId: currentPageInfo.projectId,
    };
    runUpdatePage(data);
  };

  const handlerConfirm = () => {
    form.submit();
  };

  const handleCancel = () => {
    onCancel();
    setImageUrl('');
  };

  // 上传图标成功
  const uploadIconSuccess = (url: string) => {
    setImageUrl(url);
    form.setFieldValue('icon', url);
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title="编辑页面"
      loading={loading}
      onCancel={handleCancel}
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
          name="projectName"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="请输入名称" showCount maxLength={50} />
        </Form.Item>
        <Form.Item name="projectDesc" label="描述">
          <Input.TextArea
            placeholder="请输入描述"
            autoSize={{ minRows: 4, maxRows: 6 }}
          />
        </Form.Item>
        <Form.Item name="icon" label="图标">
          <UploadAvatar
            onUploadSuccess={uploadIconSuccess}
            imageUrl={imageUrl}
            defaultImage={workflowIcon}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default PageEditModal;
