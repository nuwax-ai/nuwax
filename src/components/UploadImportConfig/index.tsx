import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { UploadImportConfigProps } from '@/types/interfaces/common';
import { Button, message, Upload, UploadProps } from 'antd';
import classNames from 'classnames';
import React from 'react';

const cx = classNames;

/**
 * 上传导入配置
 */
const UploadImportConfig: React.FC<UploadImportConfigProps> = ({
  className,
  spaceId,
  onUploadSuccess,
  beforeUpload,
}) => {
  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const code = info.file.response?.code;
      if (code === SUCCESS_CODE) {
        // Get this url from response in real world.
        onUploadSuccess?.();
        message.success('已成功导入配置');
      } else {
        message.warning(info.file.response?.message);
      }
    }
  };

  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  return (
    <Upload
      action={`${process.env.BASE_URL}/api/template/import/${spaceId}`}
      className={cx(className)}
      onChange={handleChange}
      headers={{
        Authorization: token ? `Bearer ${token}` : '',
      }}
      showUploadList={false}
      beforeUpload={beforeUpload}
    >
      <Button>导入配置</Button>
    </Upload>
  );
};

export default UploadImportConfig;
