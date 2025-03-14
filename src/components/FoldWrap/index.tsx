import type { FoldWrapType } from '@/types/interfaces/common';
import { CloseOutlined } from '@ant-design/icons';
import { Empty, Form, Input, InputRef } from 'antd';
import classNames from 'classnames';
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 折叠容器组件
 */
const FoldWrap: React.FC<PropsWithChildren<FoldWrapType>> = (props) => {
  const {
    className,
    icon,
    title,
    description,
    visible,
    otherAction,
    onClose,
    lineMargin,
    children,
    changeFoldWrap,
    showNameInput,
  } = props;

  const styleHide = !visible ? styles.hidden : '';
  const styleMargin = lineMargin ? styles.margin : '';
  const iconMargin = icon ? styles['icon-margin'] : '';

  const [isEdit, setIsEdit] = useState(false);
  const [isEditDesc, setIsEditDesc] = useState(false);
  const [form] = Form.useForm();
  // 创建 ref 引用
  const inputRef = useRef<InputRef>(null);
  const textareaRef = useRef<InputRef>(null);

  useEffect(() => {
    form.setFieldsValue({ name: title, description });
  }, [title, description]); // 同时监听两个依赖项

  // 监听编辑状态变化
  useEffect(() => {
    if (isEdit && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEdit]);
  // 监听编辑状态变化
  useEffect(() => {
    if (isEditDesc && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditDesc]);

  useEffect(() => {
    if (showNameInput) {
      setIsEdit(true);
    }
  }, [showNameInput]);
  interface Values {
    name: string;
    description: string;
  }

  // 提交当前编辑后的数据
  const submitForm = () => {
    const values: Values = form.getFieldsValue();
    changeFoldWrap?.(values);
  };

  return (
    <div
      className={cx(
        'flex flex-col',
        styles['show-stand'],
        styleHide,
        className,
      )}
    >
      <div className={cx(styles['stand-header'], 'flex', 'items-center')}>
        <Form form={form} className={styles['form-style']}>
          <Form.Item name="name" className={styles['form-item-style']}>
            {isEdit ? (
              <Input
                ref={inputRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitForm();
                    setIsEdit(false);
                  }
                }}
                onBlur={() => {
                  submitForm();
                  setIsEdit(false);
                }}
              />
            ) : (
              <div className="dis-sb">
                <div className="dis-sa" onDoubleClick={() => setIsEdit(true)}>
                  {icon}
                  <span className={cx('flex-1 text-ellipsis', iconMargin)}>
                    {title}
                  </span>
                </div>
                <div className="dis-left">
                  {otherAction}
                  <CloseOutlined
                    className={cx(styles.close, 'cursor-pointer')}
                    onClick={onClose}
                  />
                </div>
              </div>
            )}
          </Form.Item>
          <Form.Item name="description" className={styles['form-item-style']}>
            {isEditDesc ? (
              <Input.TextArea
                ref={textareaRef}
                value={description}
                placeholder={description}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitForm();
                    setIsEditDesc(false);
                  }
                }}
                onBlur={() => {
                  submitForm();
                  setIsEditDesc(false);
                }}
                rows={2}
                style={{ marginTop: '10px' }}
              />
            ) : (
              <div
                onDoubleClick={() => setIsEditDesc(true)}
                className={`text-ellipsis ${styles['desc']}`}
              >
                {description}
              </div>
            )}
          </Form.Item>
        </Form>
      </div>

      <div className={cx(styles['divider-horizontal'], styleMargin)} />
      <div className={'flex-1 overflow-y'}>
        {children || (
          <Empty className={cx(styles.empty)} description="暂无内容" />
        )}
      </div>
    </div>
  );
};

export default FoldWrap;
