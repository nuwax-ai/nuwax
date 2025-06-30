import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { UploadFileStatus } from '@/types/enums/common';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Input, message, Upload } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';
const cx = classNames.bind(styles);

/**
 * 聊天输入组件
 */
const ChatInputPhone: React.FC<ChatInputProps> = ({
  className,
  onEnter,
  visible,
  onScrollBottom,
}) => {
  // 文档
  const [files, setFiles] = useState<UploadFileInfo[]>([]);
  const [messageInfo, setMessageInfo] = useState<string>('');
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 发送按钮disabled
  const disabledSend = useMemo(() => {
    return !messageInfo && !files?.length;
  }, [messageInfo, files]);

  // 点击发送事件
  const handleSendMessage = () => {
    if (disabledSend) {
      return;
    }
    if (messageInfo || files?.length > 0) {
      // enter事件
      onEnter(messageInfo, files);
      // 置空
      setFiles([]);
      setMessageInfo('');
    }
  };

  // enter事件
  const handlePressEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { value } = e.target as HTMLInputElement;
    // shift+enter或者ctrl+enter时换行
    if (
      e.nativeEvent.keyCode === 13 &&
      (e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)
    ) {
      const enterValue = `${value}\n`;
      setMessageInfo(enterValue);
    } else if (
      e.nativeEvent.keyCode === 13 &&
      (!!value.trim() || !!files?.length)
    ) {
      // enter事件
      onEnter(value, files);
      // 置空
      setFiles([]);
      setMessageInfo('');
    }
  };

  // 上传成功后，修改文档列表
  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      // 接口上传失败
      if (info.file.response?.code !== SUCCESS_CODE) {
        message.warning(info.file.response?.message);
        return;
      }
      const data = info.file.response?.data;
      const _files = [...files];
      _files.push({
        key: data?.key || '',
        name: data?.fileName || info.file.name || '',
        type: data?.mimeType || info.file.type || '',
        size: data?.size || info.file.size || 0,
        url: data?.url || info.file.url || '',
        uid: info.file.uid,
        status: (info.file.status as UploadFileStatus) || UploadFileStatus.done,
        percent: info.file.percent,
        response: info.file.response,
      });
      setFiles(_files);
    }
  };

  // 删除文档
  const handleDelFile = (uid: string) => {
    const _files = [...files];
    _files.splice(
      _files.findIndex((item) => item.uid === uid),
      1,
    );
    setFiles(_files);
  };

  return (
    <div className={cx('relative', 'w-full', className)}>
      <div className={cx(styles['chat-container'], 'flex', 'flex-col')}>
        {/*文件列表*/}
        <ConditionRender condition={files?.length}>
          <ChatUploadFile files={files} onDel={handleDelFile} />
        </ConditionRender>
        <div className={cx('flex', 'items-center')}>
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
          {/*输入框*/}
          <Input
            className={cx('flex-1')}
            value={messageInfo}
            onChange={(e) => setMessageInfo(e.target.value)}
            rootClassName={cx(styles.input, 'flex-1')}
            onPressEnter={handlePressEnter}
            placeholder="直接输入指令；可通过回车换行"
          />
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
        </div>
      </div>
      {/* 滚动到底部按钮 */}
      <div className={cx(styles['chat-action'])}>
        <div
          className={cx(styles['to-bottom'], { [styles.visible]: visible })}
          onClick={onScrollBottom}
        >
          <ArrowDownOutlined />
        </div>
      </div>
    </div>
  );
};

export default ChatInputPhone;
