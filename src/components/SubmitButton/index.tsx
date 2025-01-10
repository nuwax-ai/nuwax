import React from 'react';
import { Button, Form, FormInstance } from 'antd';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SubmitButtonProps {
  form?: FormInstance;
  loading: boolean;
  // 确定按钮前缀icon
  okPrefixIcon?: React.ReactNode;
  // 确定按钮文本
  okText?: string;
  onConfirm: () => void;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ form, loading, okPrefixIcon, okText, onConfirm }) => {
  const [submittable, setSubmittable] = React.useState<boolean>(false);

  // Watch all values
  const values = Form.useWatch([], form);

  React.useEffect(() => {
    form?.validateFields({ validateOnly: true })
      .then(() => setSubmittable(true))
      .catch(() => setSubmittable(false));
  }, [form, values]);

  return (
    <Button
      type="primary"
      icon={okPrefixIcon}
      loading={loading}
      onClick={onConfirm}
      className={cx(!submittable && styles['confirm-btn'], styles.btn)}
      disabled={!submittable}
    >
      {okText || '确定'}
    </Button>
  );
};

export default SubmitButton;