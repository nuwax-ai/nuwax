import type { SubmitButtonProps } from '@/types/interfaces/common';
import { Button, Form } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SubmitButton: React.FC<SubmitButtonProps> = ({
  form,
  loading,
  okPrefixIcon,
  okText,
  onConfirm,
}) => {
  const [submittable, setSubmittable] = useState<boolean>(false);

  // Watch all values
  const values = Form.useWatch([], form);

  useEffect(() => {
    form
      ?.validateFields({ validateOnly: true })
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
