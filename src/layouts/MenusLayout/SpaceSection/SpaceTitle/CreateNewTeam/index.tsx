import teamImage from '@/assets/images/team_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SPACE_ID } from '@/constants/home.constants';
import { apiCreateSpaceTeam } from '@/services/workspace';
import type { CreateNewTeamProps } from '@/types/interfaces/layouts';
import type { CreateSpaceTeamParams } from '@/types/interfaces/workspace';
import { customizeRequiredMark } from '@/utils/form';
import { history, useLocation } from '@@/exports';
import { Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建新团队组件
 */
const CreateNewTeam: React.FC<CreateNewTeamProps> = ({ open, onCancel }) => {
  const location = useLocation();
  const { pathname } = location;

  const [imageUrl, setImageUrl] = useState<string>('');
  const [form] = Form.useForm();
  const { runSpace } = useModel('spaceModel');

  // 创建工作空间新团队
  const { run, loading } = useRequest(apiCreateSpaceTeam, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (res: number) => {
      message.success('新建成功');
      setImageUrl('');
      // 关闭弹窗
      onCancel();
      // 更新空间列表
      runSpace();
      if (res) {
        const spaceId = res;
        localStorage.setItem(SPACE_ID, spaceId.toString());
        // 路由跳转
        if (pathname.includes('develop')) {
          history.push(`/space/${spaceId}/develop`);
        }
        if (pathname.includes('library')) {
          history.push(`/space/${spaceId}/library`);
        }
        if (pathname.includes('team')) {
          history.push(`/space/${spaceId}/team`);
        }
      }
    },
  });

  const onFinish: FormProps<CreateSpaceTeamParams>['onFinish'] = (values) => {
    run({
      icon: imageUrl,
      name: values?.name,
      description: values?.description,
    });
  };

  const handleOk = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      title="创建新团队"
      open={open}
      onCancel={onCancel}
      loading={loading}
      onConfirm={handleOk}
    >
      <div className={cx('flex', 'flex-col', 'items-center', 'py-16')}>
        <p className={cx(styles['create-team-tips'])}>
          通过创建团队，将支持项目、智能体、插件、工作流和知识库在团队内进行协作和共享。
        </p>
        <UploadAvatar
          className={styles['upload-box']}
          onUploadSuccess={setImageUrl}
          imageUrl={imageUrl}
          defaultImage={teamImage as string}
        />
        <Form
          form={form}
          preserve={false}
          requiredMark={customizeRequiredMark}
          layout="vertical"
          onFinish={onFinish}
          rootClassName={cx('w-full')}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="团队名称"
            rules={[{ required: true, message: '请输入团队名称' }]}
          >
            <Input placeholder="请输入团队名称" showCount maxLength={50} />
          </Form.Item>
          <OverrideTextArea name="description" label="描述" />
        </Form>
      </div>
    </CustomFormModal>
  );
};

export default CreateNewTeam;
