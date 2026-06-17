import teamImage from '@/assets/images/team_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiUpdateSpaceTeam } from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import type {
  TeamDetailInfo,
  UpdateSpaceTeamParams,
} from '@/types/interfaces/teamSetting';
import { customizeRequiredMark } from '@/utils/form';
import { useRequest } from 'ahooks';
import { Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';

const cx = classNames.bind(styles);

export interface EditSpaceProps {
  spaceId: number;
  spaceData: TeamDetailInfo | undefined;
  open: boolean;
  onCancel: () => void;
  onConfirmEdit?: () => void;
}

const ModifyTeam: React.FC<EditSpaceProps> = ({
  spaceId,
  spaceData,
  open,
  onCancel,
  onConfirmEdit,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { runSpace, setSpaceList } = useModel('spaceModel');

  useEffect(() => {
    if (open && spaceData) {
      form.setFieldsValue({
        name: spaceData.name,
        description: spaceData.description,
      });
      setImageUrl(spaceData.icon);
    } else {
      form.resetFields();
    }
  }, [open, spaceData, form]);

  const handlerSubmit = () => {
    form.submit();
  };

  const cancelModal = () => {
    onCancel();
  };

  const { run: runEdit } = useRequest(apiUpdateSpaceTeam, {
    manual: true,
    onSuccess: async () => {
      message.success(dict('PC.Toast.Global.modifiedSuccessfully'));
      onConfirmEdit?.();
      setLoading(false);
      // 更新空间列表
      const { code, data } = await runSpace();
      if (code === SUCCESS_CODE) {
        setSpaceList(data || []);
      }
    },
    onError: () => {
      setLoading(false);
    },
  });

  const onFinish: FormProps<UpdateSpaceTeamParams>['onFinish'] = (values) => {
    setLoading(true);
    runEdit({
      ...values,
      id: spaceId,
      icon: imageUrl,
    });
  };

  return (
    <CustomFormModal
      form={form}
      title={dict('PC.Pages.TeamSetting.ModifyTeam.editTeamProfile')}
      open={open}
      loading={loading}
      onCancel={cancelModal}
      onConfirm={handlerSubmit}
    >
      <>
        <p className={cx(styles['team-setting-modal-description'])}>
          {dict('PC.Pages.TeamSetting.ModifyTeam.teamDescription')}
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
              defaultImage={teamImage}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label={dict('PC.Pages.TeamSetting.ModifyTeam.teamNameLabel')}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.TeamSetting.ModifyTeam.teamNameRequired',
                ),
              },
            ]}
          >
            <Input
              placeholder={dict(
                'PC.Pages.TeamSetting.ModifyTeam.teamNameRequired',
              )}
              showCount
              maxLength={50}
            />
          </Form.Item>
          <OverrideTextArea
            name="description"
            label={dict('PC.Pages.TeamSetting.ModifyTeam.descriptionLabel')}
            initialValue={spaceData?.description}
            placeholder={dict(
              'PC.Pages.TeamSetting.ModifyTeam.descriptionPlaceholder',
            )}
            maxLength={2000}
          />
        </Form>
      </>
    </CustomFormModal>
  );
};

export default ModifyTeam;
