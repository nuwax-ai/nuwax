import type { FoldWrapType } from '@/types/interfaces/common';
import { CloseOutlined } from '@ant-design/icons';
import { Empty, Form, Input, InputRef, Popover } from 'antd';
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

  const onFinish = (values: Values) => {
    changeFoldWrap?.(values); // 调用父组件的回调函数并传递新的 title 和 description 值
    setIsEdit(false); // 关闭编辑状态
    setIsEditDesc(false); // 关闭编辑状态
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
      <div
        className={cx(styles['stand-header'], 'flex', 'items-center')}
        style={{ height: isEdit ? '66px' : isEditDesc ? '90px' : '66px' }}
      >
        <Form form={form} onFinish={onFinish} className={styles['form-style']}>
          <Form.Item
            name="name"
            className={styles['form-item-style']}
            rules={[{ required: true, message: '请输入节点名称' }]}
            style={{ height: isEdit ? '32px' : '24px' }}
          >
            {isEdit ? (
              <Input
                value={title}
                ref={inputRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    form.submit();
                    setIsEdit(false);
                  }
                }}
                maxLength={25}
                onBlur={() => {
                  form.submit();
                  setIsEdit(false);
                }}
              />
            ) : (
              <div className="dis-sb">
                <div className="dis-sa" onDoubleClick={() => setIsEdit(true)}>
                  <div className={styles['icon-box-style']}>{icon}</div>
                  <span
                    className={cx(
                      'flex-1 text-ellipsis ',
                      styles['title-style'],
                      iconMargin,
                    )}
                  >
                    {title}
                  </span>
                </div>
                <div className="dis-left fold-action-style">
                  {otherAction}
                  <CloseOutlined
                    className={cx(styles.close, 'cursor-pointer')}
                    onClick={onClose}
                  />
                </div>
              </div>
            )}
          </Form.Item>
          <Form.Item
            name="description"
            className={styles['form-item-style']}
            rules={[{ required: true, message: '请输入节点描述' }]}
          >
            {isEditDesc ? (
              <Input.TextArea
                ref={textareaRef}
                value={description}
                placeholder={description}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    form.submit();
                    setIsEditDesc(false);
                  }
                }}
                onBlur={() => {
                  form.submit();
                  setIsEditDesc(false);
                }}
                rows={2}
                style={{ marginTop: '10px', resize: 'none' }}
              />
            ) : (
              <Popover
                title={description}
                styles={{
                  body: {
                    width: '300px',
                  },
                }}
                trigger="click"
              >
                <div
                  onDoubleClick={() => setIsEditDesc(true)}
                  className={`text-ellipsis cursor-pointer ${styles['desc']}`}
                >
                  {description}
                </div>
              </Popover>
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
