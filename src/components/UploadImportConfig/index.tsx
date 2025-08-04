import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type {
  FileType,
  UploadImportConfigProps,
} from '@/types/interfaces/common';
import { Button, message, Upload, UploadProps } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';

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
  const [loading, setLoading] = useState(false);

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setLoading(false);
      const code = info.file.response?.code;
      if (code === SUCCESS_CODE) {
        // Get this url from response in real world.
        onUploadSuccess?.();
        message.success('已成功导入配置');
      } else {
        message.warning(info.file.response?.message);
      }
    } else if (info.file.status === 'error') {
      setLoading(false);
      message.error(`${info.file.name} 上传失败`);
    }
  };

  /**
   * 上传文件校验（.table, .workflow, .plugin用于组件库页面校验，.agent用于智能体开发页面需要单独传入校验）
   * @param file 文件
   * @returns 是否允许上传
   * beforeUpload 返回 false 或 Promise.reject 时，只用于拦截上传行为，不会阻止文件进入上传列表（原因）。如果需要阻止列表展现，可以通过返回 Upload.LIST_IGNORE 实现。
   */
  const beforeUploadDefault = (file: FileType) => {
    const fileName = file.name.toLocaleLowerCase();
    const isValidFile =
      fileName.endsWith('.table') ||
      fileName.endsWith('.workflow') ||
      fileName.endsWith('.plugin');
    if (!isValidFile) {
      message.error('请上传 .table, .workflow 或 .plugin 类型的文件!');
    }
    return isValidFile || Upload.LIST_IGNORE;
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
      beforeUpload={beforeUpload || beforeUploadDefault}
    >
      <Button loading={loading}>导入配置</Button>
    </Upload>
  );
};

export default UploadImportConfig;
