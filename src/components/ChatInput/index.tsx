import ConditionRender from '@/components/ConditionRender';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { AttachmentFile } from '@/types/interfaces/agent';
import type { ChatInputProps } from '@/types/interfaces/agentConfig';
import { UploadInfo } from '@/types/interfaces/common';
import { ClearOutlined, PlusCircleOutlined } from '@ant-design/icons';
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
const ChatInput: React.FC<ChatInputProps> = ({ onEnter }) => {
  // 文档
  const [files, setFiles] = useState<UploadInfo[]>([]);
  const [message, setMessage] = useState<string>('');
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 附加文件
  const attachments: AttachmentFile[] = useMemo(() => {
    return (
      files?.map((file) => ({
        fileKey: file.key,
        fileUrl: file.url,
        fileName: file.fileName,
        mimeType: file.mimeType,
      })) || []
    );
  }, []);

  // enter事件
  const handlePressEnter = (e) => {
    e.preventDefault();
    const { value } = e.target;
    onEnter(value, attachments);
    // 置空
    setFiles([]);
    setMessage('');
  };

  // 上传成功后，修改文档列表
  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const data: UploadInfo = info.file.response?.data;
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
    <div className={cx(styles.footer, 'flex', 'items-center')}>
      <Tooltip title="清除会话">
        <span
          className={cx(
            styles.clear,
            'flex',
            'items-center',
            'content-center',
            'hover-box',
            'cursor-pointer',
          )}
        >
          <ClearOutlined />
        </span>
      </Tooltip>
      <div className={cx(styles['chat-box'], 'flex-1')}>
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
            <PlusCircleOutlined className={cx('cursor-pointer')} />
          </Upload>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
