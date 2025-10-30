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
        allowAccessWithoutLogin: !pageInfo.needLogin,
      });
    }
  }, [open, pageInfo]);

  // 上传前端项目压缩包并启动开发服务器
  const { run: runUpdatePage } = useRequest(apiPageUpdateProject, {
    manual: true,
    onSuccess: (_: null, params: PageUpdateParams[]) => {
      setLoading(false);
      const { projectId, needLogin } = params[0];
      onConfirm(projectId, needLogin);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 创建页面
  const onFinish: FormProps<any>['onFinish'] = async (values) => {
    // 是否允许免登录访问
    const { allowAccessWithoutLogin } = values;
    // 是否需要登录 = 是否允许免登录访问的取反
    const needLogin = !allowAccessWithoutLogin;
    // 页面ID和页面名称
    const { projectId, name: projectName } = pageInfo || {};
    if (!projectId) {
      message.error('页面ID不存在');
      return;
    }
    setLoading(true);
    // 调用编辑页面接口
    const data = {
      needLogin,
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
        <Form.Item name="allowAccessWithoutLogin" label="免登录访问">
          <Switch />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default AuthConfigModal;
