import SubmitButton from '@/components/SubmitButton';
import type { CustomFormModalProps } from '@/types/interfaces/common';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 自定义表单弹窗组件
 * 监控表单必填项状态，并根据状态显示不同状态的按钮
 */
const CustomFormModal: React.FC<PropsWithChildren<CustomFormModalProps>> = ({
  form,
  classNames,
  title,
  open,
  loading,
  okPrefixIcon,
  okText,
  centered = false,
  onCancel,
  onConfirm,
  children,
  footerExtra,
}) => {
  return (
    <Modal
      title={title}
      open={open}
      centered={centered}
      classNames={classNames}
      destroyOnHidden
      footer={
        <>
          <Button className={cx(styles.btn)} type="default" onClick={onCancel}>
            取消
          </Button>
          {footerExtra}
          <SubmitButton
            okPrefixIcon={okPrefixIcon}
            loading={loading}
            onConfirm={onConfirm}
            form={form}
            okText={okText}
          />
        </>
      }
      onCancel={onCancel}
    >
      {children}
    </Modal>
  );
};

export default CustomFormModal;
