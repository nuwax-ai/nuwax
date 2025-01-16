import CustomFormModal from '@/components/CustomFormModal';
import type { PublishAgentProps } from '@/types/interfaces/space';
import { Checkbox, Form, Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 发布智能体弹窗组件
 */
const PublishAgent: React.FC<PublishAgentProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const [form] = Form.useForm();

  const handlerConfirm = () => {
    form.submit();
    onConfirm();
  };

  return (
    <CustomFormModal
      form={form}
      classNames={{
        content: styles['modal-content'],
        header: styles['modal-content'],
      }}
      loading={false}
      title="发布智能体"
      open={open}
      onConfirm={handlerConfirm}
      onCancel={onCancel}
    >
      <Form form={form} layout={'vertical'}>
        <Form.Item label="发布渠道">
          <Checkbox>广场</Checkbox>
        </Form.Item>
        <Form.Item label="发布记录">
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
