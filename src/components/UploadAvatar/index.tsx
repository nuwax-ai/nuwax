import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import type { FileType, UploadAvatarProps } from '@/types/interfaces/common';
import { getBase64 } from '@/utils/common';
import { FormOutlined } from '@ant-design/icons';
import { message, Upload, UploadProps } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const UploadAvatar: React.FC<UploadAvatarProps> = (props) => {
  const {
    className,
    imageClassName,
    onUploadSuccess,
    defaultImage,
    imageUrl,
    beforeUpload,
  } = props;

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj as FileType, (url) => {
        // setLoading(false);
        onUploadSuccess?.(url);
      });
    }
  };

  // beforeUpload 返回 false 或 Promise.reject 时，只用于拦截上传行为，不会阻止文件进入上传列表（原因）。如果需要阻止列表展现，可以通过返回 Upload.LIST_IGNORE 实现。
  const beforeUploadDefault = (file: FileType) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    return (isJpgOrPng && isLt2M) || Upload.LIST_IGNORE;
  };

  return (
    <Upload
      action={UPLOAD_FILE_ACTION}
      className={cx(styles.container, className)}
      onChange={handleChange}
      showUploadList={false}
      beforeUpload={beforeUpload ?? beforeUploadDefault}
    >
      <div
        className={cx(
          styles['file-box'],
          'relative',
          'overflow-hide',
          'cursor-pointer',
          imageClassName,
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
