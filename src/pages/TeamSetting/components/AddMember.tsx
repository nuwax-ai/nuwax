import teamImage from '@/assets/images/team_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { apiUpdateSpace } from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import type { UpdateSpaceParams } from '@/types/interfaces/teamSetting';
import { customizeRequiredMark } from '@/utils/form';
import { useRequest } from 'ahooks';
import { Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';

const cx = classNames.bind(styles);

export interface EditSpaceProps {
  spaceId: number;
  open: boolean;
  onCancel: () => void;
  onConfirmEdit?: () => void;
}

const AddMember: React.FC<EditSpaceProps> = ({
  spaceId,
  open,
  onCancel,
  onConfirmEdit,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');

  const handlerSubmit = () => {
    form.submit();
  };

  const cancelModal = () => {
    onCancel();
  };

  const { run: runEdit } = useRequest(apiUpdateSpace, {
    manual: true,
    onSuccess: () => {
      message.success('修改成功');
      onConfirmEdit?.();
    },
  });

  const onFinish: FormProps<UpdateSpaceParams>['onFinish'] = (values) => {
    runEdit({
      ...values,
      id: spaceId,
      icon: imageUrl,
    });
  };

  return (
    <CustomFormModal
      form={form}
      title="添加新成员"
      open={open}
      onCancel={cancelModal}
      onConfirm={handlerSubmit}
    >
      <>
        <p className={cx(styles['team-setting-modal-description'])}>
          通过创建团队空间，将支持智能体、插件、工作流、大模型和知识库在团队内进行协作和分享。
        </p>
        <Form
          form={form}
          requiredMark={customizeRequiredMark}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item name="icon" label="" className={cx('text-center')}>
            <UploadAvatar
              onUploadSuccess={setImageUrl}
              imageUrl={imageUrl}
              defaultImage={teamImage as string}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="团队名称"
            rules={[{ required: true, message: '请输入团队名称' }]}
          >
            <Input placeholder="请输入团队名称" showCount maxLength={50} />
          </Form.Item>
          <OverrideTextArea
            name="description"
            label="描述"
            placeholder="描述团队"
            maxLength={2000}
          />
        </Form>
      </>
    </CustomFormModal>
  );
};

export default AddMember;
