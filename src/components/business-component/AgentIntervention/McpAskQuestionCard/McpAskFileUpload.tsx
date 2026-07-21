import ChatUploadFile from '@/components/ChatUploadFile';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { t } from '@/services/i18nRuntime';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { handleUploadFileList } from '@/utils/upload';
import { PaperClipOutlined } from '@ant-design/icons';
import { Button, Upload, type UploadProps } from 'antd';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { limitMcpAskUploadFileList } from '../utils/normalizeMcpAskFormData';
import styles from './McpAskFormField.less';

const cx = classNames.bind(styles);

export interface McpAskFileUploadProps {
  /** Ant Design Form 注入的 fileList */
  value?: UploadFileInfo[];
  onChange?: (fileList: UploadFileInfo[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
}

/**
 * MCP Ask 文件字段上传：对齐聊天输入框附件上传（UPLOAD_FILE_ACTION + ChatUploadFile 列表）。
 */
const McpAskFileUpload: React.FC<McpAskFileUploadProps> = ({
  value = [],
  onChange,
  disabled,
  multiple,
  accept,
}) => {
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
  const fileList = value ?? [];

  const emitChange = useCallback(
    (nextList: UploadFileInfo[]) => {
      onChange?.(limitMcpAskUploadFileList(nextList, multiple));
    },
    [onChange, multiple],
  );

  const handleChange: UploadProps['onChange'] = (info) => {
    emitChange(handleUploadFileList(info.fileList ?? []));
  };

  const handleDel = (uid: string) => {
    emitChange(fileList.filter((item) => item.uid !== uid));
  };

  return (
    <div className={cx(styles['mcp-ask-file-upload'])}>
      {fileList.length > 0 ? (
        <ChatUploadFile files={fileList} onDel={handleDel} />
      ) : null}
      <Upload
        action={UPLOAD_FILE_ACTION}
        headers={{ Authorization: token ? `Bearer ${token}` : '' }}
        data={{ type: 'tmp' }}
        disabled={disabled}
        multiple={multiple}
        maxCount={multiple ? undefined : 1}
        accept={accept}
        fileList={fileList}
        onChange={handleChange}
        showUploadList={false}
      >
        <Button
          type="default"
          disabled={disabled}
          icon={<PaperClipOutlined />}
          className={cx(styles['upload-trigger'])}
        >
          {t('PC.Components.McpAskQuestionCard.uploadDragText') ||
            '点击上传文件'}
        </Button>
      </Upload>
    </div>
  );
};

export default McpAskFileUpload;
