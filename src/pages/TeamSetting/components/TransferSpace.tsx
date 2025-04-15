import CustomFormModal from '@/components/CustomFormModal';
import { USER_INFO } from '@/constants/home.constants';
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
      message.success('转让成功');
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
      title="转移团队所有权"
      open={open}
      loading={loading}
      onCancel={cancelModal}
      onConfirm={handlerSubmit}
    >
      <>
        <p className={cx(styles['team-setting-modal-description'])}>
          转让所有权后，您的状态将更改为管理员。
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
            label="将所有权转让给"
            rules={[
              {
                required: true,
                message: '请选择团队成员',
              },
            ]}
          >
            <Select
              options={selectOptions}
              placeholder="请选择团队成员"
            ></Select>
          </Form.Item>
        </Form>
      </>
    </CustomFormModal>
  );
};

export default TransferSpace;
