import {
  UPLOAD_FILE_ACTION,
  UPLOAD_FILE_SUFFIX,
} from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { FileType, UploadFileInfo } from '@/types/interfaces/common';
import type { UploadFileProps } from '@/types/interfaces/knowledge';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { message, Upload } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const { Dragger } = Upload;

const UploadFile: React.FC<UploadFileProps> = ({
  onUploadSuccess,
  beforeUpload,
}) => {
  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      const data: UploadFileInfo = info.file.response?.data;
      // Get this url from response in real world.
      onUploadSuccess?.(data);
    }
  };

  // beforeUpload 返回 false 或 Promise.reject 时，只用于拦截上传行为，不会阻止文件进入上传列表（原因）。如果需要阻止列表展现，可以通过返回 Upload.LIST_IGNORE 实现。
  const beforeUploadDefault = (file: FileType) => {
    const { name, size } = file;
    if (!name.includes('.')) {
      message.error('请上传正确的文件类型');
      return false;
    }
    const suffix = name.split('.')[1].toLowerCase();
    const isFile = UPLOAD_FILE_SUFFIX.includes(suffix);
    if (!isFile) {
      message.error('请上传 PDF、TXT、DOC、DOCX、MD、JSON 类型文件!');
    }
    const isLt100M = size / 1024 / 1024 < 100;
    if (!isLt100M) {
      message.error('文件大小不能超过100MB!');
    }
    return (isFile && isLt100M) || Upload.LIST_IGNORE;
  };

  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  return (
    <div className={cx('flex flex-col content-center', styles.container)}>
      <Dragger
        action={UPLOAD_FILE_ACTION}
        onChange={handleChange}
        headers={{
          Authorization: token ? `Bearer ${token}` : '',
        }}
        showUploadList={false}
        beforeUpload={beforeUpload ?? beforeUploadDefault}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">点击上传或拖拽文档到这里</p>
        <p className="ant-upload-hint">
          支持 PDF、TXT、DOC、DOCX、MD、JSON，最多可上传 300 个文件，每个文件不超过
          100MB， PDF 最多 500 页
        </p>
      </Dragger>
    </div>
  );
};

export default UploadFile;
