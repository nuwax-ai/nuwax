import CustomFormModal from '@/components/CustomFormModal';
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
      message.success('删除成功');
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
      title="删除团队"
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
          请谨慎删除，删除后，团队内的所有数据都将丢失。
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
            label="请输入需要删除的团队名称"
            rules={[
              { message: '请输入需要删除的团队名称' },
              {
                validator: (_, value) => {
                  if (value === name) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('输入的团队名称与要删除的团队名称不匹配'),
                  );
                },
              },
            ]}
          >
            <Input placeholder="请输入团队名称" showCount maxLength={50} />
          </Form.Item>
        </Form>
      </>
    </CustomFormModal>
  );
};

export default RemoveSpace;
