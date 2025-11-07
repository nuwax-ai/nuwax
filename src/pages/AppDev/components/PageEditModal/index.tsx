import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { apiPageUpdateProject } from '@/services/pageDev';
import { PageEditModalProps } from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 页面编辑弹窗
 */
const PageEditModal: React.FC<PageEditModalProps> = ({
  open,
  projectInfo,
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
      setLoading(false);
    },
  });

  useEffect(() => {
    if (open && projectInfo) {
      const { name, description, icon } = projectInfo;
      form.setFieldsValue({
        projectName: name,
        projectDesc: description,
        icon: icon || '',
      });

      setImageUrl(icon);
    }
  }, [open, projectInfo]);

  // 编辑页面
  const onFinish: FormProps<any>['onFinish'] = async (values) => {
    setLoading(true);
    // 调用编辑页面接口
    const data = {
      ...values,
      projectId: projectInfo?.projectId,
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
        <OverrideTextArea
          name="projectDesc"
          label="描述"
          placeholder="请输入描述"
          maxLength={10000}
        />
        <Form.Item
          name="icon"
          label={
            <div className={cx('flex', 'gap-10', 'items-center')}>
              <span>图标</span>
              <span className={cx(styles['text-tip'])}>
                建议尺寸356px * 200px, 比例16:9
              </span>
            </div>
          }
        >
          <UploadAvatar
            className={cx(styles['upload-avatar'])}
            onUploadSuccess={uploadIconSuccess}
            imageUrl={imageUrl}
            svgIconName="icons-common-upload"
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default PageEditModal;
