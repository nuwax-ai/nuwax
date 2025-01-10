import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';
import type { CustomFormModalProps } from '@/types/interfaces/common';
import SubmitButton from '@/components/SubmitButton';

const cx = classNames.bind(styles);

const CustomFormModal: React.FC<PropsWithChildren<CustomFormModalProps>> = ({
  form,
  title,
  open,
  loading,
  okPrefixIcon,
  okText,
  onCancel,
  onConfirm,
  children,
}) => {
  return (
    <Modal
      title={title}
      open={open}
      classNames={styles.container}
      destroyOnClose
      footer={
        <>
          <Button className={cx(styles.btn)} type="default" onClick={onCancel}>
            取消
          </Button>
          <SubmitButton okPrefixIcon={okPrefixIcon} loading={loading} onConfirm={onConfirm} form={form} okText={okText}  />
        </>
      }
      onCancel={onCancel}
    >
      {children}
    </Modal>
  );
};

export default CustomFormModal;
