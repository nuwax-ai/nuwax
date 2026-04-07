import CustomFormModal from '@/components/CustomFormModal';
import { USER_INFO } from '@/constants/home.constants';
import { dict } from '@/services/i18nRuntime';
import { apiGetSpaceUserList, apiTransferSpace } from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import type { SpaceUserInfo } from '@/types/interfaces/teamSetting';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { Form, FormProps, Select, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

const cx = classNames.bind(styles);

export interface RemoveSpaceProps {
  spaceId: number;
  open: boolean;
  onCancel: () => void;
  onConfirmTransfer?: () => void;
}

const TransferSpace: React.FC<RemoveSpaceProps> = ({
  spaceId,
  open,
  onCancel,
  onConfirmTransfer,
}) => {
  const [form] = Form.useForm();
  const userInfo = JSON.parse(localStorage.getItem(USER_INFO));
  const [selectOptions, setSelectOptions] = useState<
    {
      label: string;
      value: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const handlerSubmit = () => {
    form.submit();
  };

  const { run } = useRequest(apiGetSpaceUserList, {
    manual: true,
    onSuccess: (res: SpaceUserInfo[]) => {
      // 当前空间团队成员，过滤掉本人
      const filterOwner =
        res?.filter((item) => item.userId !== userInfo?.id) || [];
      setSelectOptions(
        filterOwner.map((item) => {
          return {
            label: item.nickName,
            value: item.userId,
          };
        }),
      );
    },
  });

  const { run: runTransfer } = useRequest(apiTransferSpace, {
    manual: true,
    onBefore: () => {
      setLoading(true);
    },
    onSuccess: () => {
      message.success(
        dict('PC.Pages.TeamSetting.TransferSpace.transferSuccess'),
      );
      onConfirmTransfer?.();
    },
    onFinally: () => {
      setLoading(false);
    },
  });

  const onFinish: FormProps['onFinish'] = (values) => {
    runTransfer({
      ...values,
      spaceId,
    });
  };

  const cancelModal = () => {
    form.resetFields();
    onCancel();
  };

  useEffect(() => {
    if (open && spaceId) {
      run({
        spaceId,
        kw: '',
        role: undefined,
      });
    }
  }, [open, spaceId]);

  return (
    <CustomFormModal
      form={form}
      title={dict('PC.Pages.TeamSetting.TransferSpace.transferOwnershipTitle')}
      open={open}
      loading={loading}
      onCancel={cancelModal}
      onConfirm={handlerSubmit}
    >
      <>
        <p className={cx(styles['team-setting-modal-description'])}>
          {dict('PC.Pages.TeamSetting.TransferSpace.transferDescription')}
        </p>
        <Form
          form={form}
          requiredMark={customizeRequiredNoStarMark}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="targetUserId"
            label={dict('PC.Pages.TeamSetting.TransferSpace.transferToLabel')}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.TeamSetting.TransferSpace.selectTeamMember',
                ),
              },
            ]}
          >
            <Select
              options={selectOptions}
              placeholder={dict(
                'PC.Pages.TeamSetting.TransferSpace.selectTeamMember',
              )}
            ></Select>
          </Form.Item>
        </Form>
      </>
    </CustomFormModal>
  );
};

export default TransferSpace;
