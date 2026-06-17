import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  UPLOAD_FILE_ACTION,
  UPLOAD_FILE_SUFFIX,
} from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { dict } from '@/services/i18nRuntime';
import type { FileType } from '@/types/interfaces/common';
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
  onChange,
  fileList,
  multiple = false,
  height = 386,
}) => {
  const handleChange: UploadProps['onChange'] = (info) => {
    const { status } = info.file;
    onChange?.(info);
    if (status === 'uploading') {
      return;
    }
    if (status === 'done') {
      // 接口上传失败
      if (info.file.response?.code !== SUCCESS_CODE) {
        message.warning(info.file.response?.message);
        return;
      }
      // Get this url from response in real world.
      const data = info.file.response?.data;
      // Get this url from response in real world.
      onUploadSuccess?.(data);
    }
  };

  // beforeUpload 返回 false 或 Promise.reject 时，只用于拦截上传行为，不会阻止文件进入上传列表（原因）。如果需要阻止列表展现，可以通过返回 Upload.LIST_IGNORE 实现。
  const beforeUploadDefault = (file: FileType) => {
    const { name, size } = file;
    if (!name.includes('.')) {
      message.error(dict('PC.Pages.SpaceKnowledge.UploadFile.correctFileType'));
      return false;
    }
    const splitList = name.split('.');
    // 取后缀（文件名可能包含多个点号）
    const suffix = splitList[splitList.length - 1]?.toLowerCase();
    const isFile = UPLOAD_FILE_SUFFIX.includes(suffix);
    if (!isFile) {
      message.error(
        dict('PC.Pages.SpaceKnowledge.UploadFile.supportedFileTypes'),
      );
    }
    const isLt100M = size / 1024 / 1024 < 100;
    if (!isLt100M) {
      message.error(
        dict('PC.Pages.SpaceKnowledge.UploadFile.fileSizeLimit100MB'),
      );
    }
    return (isFile && isLt100M) || Upload.LIST_IGNORE;
  };

  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  return (
    <div
      className={cx('flex flex-col content-center', styles.container)}
      style={{ height: height }}
    >
      <Dragger
        className={cx('h-full')}
        action={UPLOAD_FILE_ACTION}
        onChange={handleChange}
        multiple={multiple}
        fileList={fileList}
        headers={{
          Authorization: token ? `Bearer ${token}` : '',
        }}
        showUploadList={false}
        beforeUpload={beforeUpload ?? beforeUploadDefault}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">
          {dict('PC.Pages.SpaceKnowledge.UploadFile.clickOrDragToUpload')}
        </p>
        <p className="ant-upload-hint">
          {dict('PC.Pages.SpaceKnowledge.UploadFile.uploadHint')}
        </p>
      </Dragger>
    </div>
  );
};

export default UploadFile;
