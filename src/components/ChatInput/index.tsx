import sendImage from '@/assets/images/send_image.png';
import ConditionRender from '@/components/ConditionRender';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import { ClearOutlined, PlusCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Input, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import ChatUploadFile from './ChatUploadFile';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 聊天输入组件
 */
const ChatInput: React.FC<ChatInputProps> = ({
  className,
  disabled = false,
  onClear,
  onEnter,
}) => {
  // 文档
  const [files, setFiles] = useState<UploadFileInfo[]>([]);
  const [message, setMessage] = useState<string>('');
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 点击发送事件
  const handleSendMessage = () => {
    if (message || files?.length > 0) {
      // enter事件
      onEnter(message, files);
      // 置空
      setFiles([]);
      setMessage('');
    }
  };

  // enter事件
  const handlePressEnter = (e) => {
    e.preventDefault();
    const { value } = e.target;
    // shift+enter或者ctrl+enter时换行
    if (
      e.nativeEvent.keyCode === 13 &&
      (e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)
    ) {
      const enterValue = `${value}\n`;
      setMessage(enterValue);
    } else if (e.nativeEvent.keyCode === 13 && !!value.trim()) {
      // enter事件
      onEnter(value, files);
      // 置空
      setFiles([]);
      setMessage('');
    }
  };

  // 上传成功后，修改文档列表
  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const data: UploadFileInfo = info.file.response?.data;
      const _files = [...files];
      _files.push(data);
      setFiles(_files);
    }
  };

  // 删除文档
  const handleDelFile = (index: number) => {
    const _files = [...files];
    _files.splice(index, 1);
    setFiles(_files);
  };

  const handleClear = () => {
    if (disabled) {
      return;
    }
    onClear?.();
  };

  return (
    <div className={cx(styles.footer, 'flex', 'items-center', className)}>
      <ConditionRender condition={!!onClear}>
        <Tooltip title="清空会话记录">
          <span
            className={cx(
              styles.clear,
              'flex',
              'items-center',
              'content-center',
              'hover-box',
              'cursor-pointer',
              { [styles.disabled]: disabled },
            )}
            onClick={handleClear}
          >
            <ClearOutlined />
          </span>
        </Tooltip>
      </ConditionRender>
      <div className={cx('flex-1', 'w-full')}>
        {/*文件列表*/}
        <ConditionRender condition={files?.length}>
          <ChatUploadFile files={files} onDel={handleDelFile} />
        </ConditionRender>
        {/*输入框*/}
        <div className={cx(styles['chat-input'], 'flex', 'items-center')}>
          <Input.TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rootClassName={styles.input}
            onPressEnter={handlePressEnter}
            placeholder="直接输入指令；可通过回车发送"
            autoSize={{ minRows: 1, maxRows: 3 }}
          />
          {/*上传按钮*/}
          <Upload
            action={UPLOAD_FILE_ACTION}
            className={cx(styles['add-file'])}
            onChange={handleChange}
            headers={{
              Authorization: token ? `Bearer ${token}` : '',
            }}
            showUploadList={false}
            // beforeUpload={beforeUpload ?? beforeUploadDefault}
          >
            <span
              className={cx(
                styles['icon-box'],
                'flex',
                'items-center',
                'content-center',
              )}
            >
              <PlusCircleOutlined className={cx('cursor-pointer')} />
            </span>
          </Upload>
          <span
            onClick={handleSendMessage}
            className={cx(
              styles['icon-box'],
              'flex',
              'items-center',
              'content-center',
            )}
          >
            <img
              className={cx(styles['send-image'], 'cursor-pointer')}
              src={sendImage as string}
              alt=""
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
