import CustomFormModal from '@/components/CustomFormModal';
import { apiAgentPublishApply } from '@/services/agentConfig';
import type { PublishAgentProps } from '@/types/interfaces/space';
import { Checkbox, Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 发布智能体弹窗组件
 */
const PublishAgent: React.FC<PublishAgentProps> = ({
  agentId,
  open,
  onCancel,
}) => {
  const [form] = Form.useForm();

  // 智能体发布申请
  const { run, loading } = useRequest(apiAgentPublishApply, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: string) => {
      message.success(data || '发布申请已提交，等待审核中');
      onCancel();
    },
  });

  const onFinish: FormProps<{
    channels: string[];
    remark: string;
  }>['onFinish'] = (values) => {
    run({
      agentId,
      ...values,
    });
  };

  const handlerConfirm = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      classNames={{
        content: styles['modal-content'],
        header: styles['modal-content'],
      }}
      loading={loading}
      title="发布智能体"
      open={open}
      onConfirm={handlerConfirm}
      onCancel={onCancel}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          channels: ['Square'],
        }}
        onFinish={onFinish}
      >
        <Form.Item name="channels" label="发布渠道">
          <Checkbox.Group
            options={[
              {
                label: '广场',
                value: 'Square',
              },
            ]}
          />
        </Form.Item>
        <Form.Item name="remark" label="发布记录">
          <Input.TextArea
            rootClassName={cx(styles['input-textarea'])}
            placeholder="这里填写详细的发布记录，如果渠道选择了广场审核通过后将在智能体广场进行展示"
            autoSize={{ minRows: 5, maxRows: 8 }}
          ></Input.TextArea>
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default PublishAgent;
