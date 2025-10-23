import CustomFormModal from '@/components/CustomFormModal';
import { apiPageUpdateProject } from '@/services/pageDev';
import {
  AuthConfigModalProps,
  PageUpdateParams,
} from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, message, Switch } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

/**
 * 认证配置弹窗
 */
const AuthConfigModal: React.FC<AuthConfigModalProps> = ({
  open,
  pageInfo,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  // 图标
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open && pageInfo) {
      form.setFieldsValue({
        needLogin: pageInfo.needLogin || false,
      });
    }
  }, [open, pageInfo]);

  // 上传前端项目压缩包并启动开发服务器
  const { run: runUpdatePage } = useRequest(apiPageUpdateProject, {
    manual: true,
    onSuccess: (_: null, params: PageUpdateParams[]) => {
      setLoading(false);
      const { projectId, needLogin } = params[0];
      message.success('编辑成功');
      onConfirm(projectId, needLogin || false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 创建页面
  const onFinish: FormProps<any>['onFinish'] = async (values) => {
    const { projectId, name: projectName } = pageInfo || {};
    if (!projectId) {
      message.error('页面ID不存在');
      return;
    }
    setLoading(true);
    // 调用编辑页面接口
    const data = {
      ...values,
      projectId,
      projectName,
    };
    runUpdatePage(data);
  };

  const handlerConfirm = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title="认证配置"
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerConfirm}
    >
      <Form
        form={form}
        preserve={false}
        layout="horizontal"
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item name="needLogin" label="是否免登录访问">
          <Switch />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default AuthConfigModal;
