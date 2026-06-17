import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { apiRemoveSpace } from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import { customizeRequiredMark } from '@/utils/form';
import { useRequest } from 'ahooks';
import { Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';

const cx = classNames.bind(styles);

export interface RemoveSpaceProps {
  spaceId: number;
  name: string | undefined;
  open: boolean;
  onCancel: () => void;
  onConfirmRemove?: () => void;
}

const RemoveSpace: React.FC<RemoveSpaceProps> = ({
  spaceId,
  name,
  open,
  onCancel,
  onConfirmRemove,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handlerSubmit = () => {
    form.submit();
  };

  const { run: runRemove } = useRequest(apiRemoveSpace, {
    manual: true,
    onBefore: () => {
      setLoading(true);
    },
    onSuccess: () => {
      message.success(dict('PC.Toast.Global.deletedSuccessfully'));
      onConfirmRemove?.();
    },
    onFinally: () => {
      setLoading(false);
    },
  });

  const onFinish: FormProps['onFinish'] = () => {
    runRemove({
      spaceId,
    });
  };

  const cancelModal = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <CustomFormModal
      loading={loading}
      form={form}
      title={dict('PC.Pages.TeamSetting.RemoveSpace.deleteTeamTitle')}
      open={open}
      classNames={{
        footer: cx('team-setting-remove-modal-footer'),
      }}
      onCancel={cancelModal}
      onConfirm={handlerSubmit}
    >
      <>
        <p
          className={cx(
            styles['team-setting-modal-description'],
            styles['team-setting-modal-warning'],
          )}
        >
          {dict('PC.Pages.TeamSetting.RemoveSpace.deleteWarning')}
        </p>
        <Form
          form={form}
          requiredMark={customizeRequiredMark}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label={dict('PC.Pages.TeamSetting.RemoveSpace.enterTeamNameLabel')}
            rules={[
              {
                message: dict(
                  'PC.Pages.TeamSetting.RemoveSpace.enterTeamNameRequired',
                ),
              },
              {
                validator: (_, value) => {
                  if (value === name) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(
                      dict('PC.Pages.TeamSetting.RemoveSpace.teamNameMismatch'),
                    ),
                  );
                },
              },
            ]}
          >
            <Input
              placeholder={dict(
                'PC.Pages.TeamSetting.RemoveSpace.teamNamePlaceholder',
              )}
              showCount
              maxLength={50}
            />
          </Form.Item>
        </Form>
      </>
    </CustomFormModal>
  );
};

export default RemoveSpace;
