import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { FileType, UploadAvatarProps } from '@/types/interfaces/common';
import { FormOutlined } from '@ant-design/icons';
import { message, Upload, UploadProps } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 上传头像
 */
const UploadAvatar: React.FC<UploadAvatarProps> = (props) => {
  const { className, onUploadSuccess, defaultImage, imageUrl, beforeUpload } =
    props;

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const data = info.file.response?.data;
      // Get this url from response in real world.
      onUploadSuccess?.(data?.url);
    }
  };

  // beforeUpload 返回 false 或 Promise.reject 时，只用于拦截上传行为，不会阻止文件进入上传列表（原因）。如果需要阻止列表展现，可以通过返回 Upload.LIST_IGNORE 实现。
  const beforeUploadDefault = (file: FileType) => {
    const { type, size } = file;
    const isJpgOrPng =
      type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    return (isJpgOrPng && isLt2M) || Upload.LIST_IGNORE;
  };

  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  return (
    <Upload
      action={UPLOAD_FILE_ACTION}
      className={cx(styles.container, className)}
      onChange={handleChange}
      headers={{
        Authorization: token ? `Bearer ${token}` : '',
      }}
      showUploadList={false}
      beforeUpload={beforeUpload ?? beforeUploadDefault}
    >
      <div
        className={cx(
          styles['file-box'],
          'relative',
          'overflow-hide',
          'cursor-pointer',
        )}
      >
        <div
          className={cx(styles.mask, 'flex', 'content-center', 'items-center')}
        >
          <FormOutlined />
        </div>
        <img
          className={cx(styles.image)}
          src={imageUrl || defaultImage}
          alt=""
        />
      </div>
    </Upload>
  );
};

export default UploadAvatar;
