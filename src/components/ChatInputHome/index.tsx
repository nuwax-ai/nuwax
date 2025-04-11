import ConditionRender from '@/components/ConditionRender';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import { ArrowUpOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Input, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import ChatUploadFile from './ChatUploadFile';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 聊天输入组件
 */
const ChatInput: React.FC<ChatInputProps> = ({ className, onEnter }) => {
  // 文档
  const [files, setFiles] = useState<UploadFileInfo[]>([]);
  const [message, setMessage] = useState<string>('');
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 发送按钮disabled
  const disabledSend = useMemo(() => {
    return !message && !files?.length;
  }, [message, files]);

  // 点击发送事件
  const handleSendMessage = () => {
    if (disabledSend) {
      return;
    }
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
    } else if (
      e.nativeEvent.keyCode === 13 &&
      (!!value.trim() || !!files?.length)
    ) {
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

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', className)}>
      {/*文件列表*/}
      <ConditionRender condition={files?.length}>
        <ChatUploadFile files={files} onDel={handleDelFile} />
      </ConditionRender>
      {/*输入框*/}
      <Input.TextArea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rootClassName={cx(styles.input, 'flex-1')}
        onPressEnter={handlePressEnter}
        placeholder="直接输入指令；可通过回车发送"
        autoSize={{ minRows: 1, maxRows: 3 }}
      />
      <div className={cx('flex', 'content-between')}>
        {/*上传按钮*/}
        <Upload
          action={UPLOAD_FILE_ACTION}
          onChange={handleChange}
          headers={{
            Authorization: token ? `Bearer ${token}` : '',
          }}
          data={{
            type: 'tmp',
          }}
          showUploadList={false}
        >
          <span
            className={cx(
              'flex',
              'items-center',
              'content-center',
              'cursor-pointer',
              styles.box,
              styles['plus-box'],
            )}
          >
            <PlusOutlined />
          </span>
        </Upload>
        <Tooltip title={disabledSend ? '请输入你的问题' : ''}>
          <span
            onClick={handleSendMessage}
            className={cx(
              'flex',
              'items-center',
              'content-center',
              'cursor-pointer',
              styles.box,
              styles['send-box'],
              { [styles.disabled]: disabledSend },
            )}
          >
            <ArrowUpOutlined />
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default ChatInput;
