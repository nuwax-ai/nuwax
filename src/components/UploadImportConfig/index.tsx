import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { dict } from '@/services/i18nRuntime';
import type {
  FileType,
  UploadImportConfigProps,
} from '@/types/interfaces/common';
import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Modal, Upload, UploadProps } from 'antd';
import React, { useState } from 'react';

/**
 * 上传导入配置
 */
const UploadImportConfig: React.FC<UploadImportConfigProps> = ({
  spaceId,
  onUploadSuccess,
  beforeUpload,
}) => {
  const [loading, setLoading] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setLoading(false);
      const code = info.file.response?.code;
      if (code === SUCCESS_CODE) {
        onUploadSuccess?.();
        message.success(dict('PC.Components.UploadImportConfig.importSuccess'));
      } else {
        message.warning(info.file.response?.message);
      }
    } else if (info.file.status === 'error') {
      setLoading(false);
      message.error(
        dict('PC.Components.UploadImportConfig.uploadFailed').replace(
          '{0}',
          info.file.name,
        ),
      );
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    Modal.confirm({
      title: dict('PC.Components.UploadImportConfig.notice'),
      content: dict('PC.Components.UploadImportConfig.checkConfigHint'),
      okText: dict('PC.Common.Global.confirm'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: () => {
        // 手动触发文件选择
        if (buttonRef.current) {
          buttonRef.current.click();
        }
      },
      onCancel: () => {
        setLoading(false);
      },
    });
  };

  /**
   * 上传文件校验
   */
  const beforeUploadDefault = (file: FileType) => {
    const fileName = file.name.toLocaleLowerCase();
    const isValidFile =
      fileName.endsWith('.table') ||
      fileName.endsWith('.workflow') ||
      fileName.endsWith('.plugin');
    if (!isValidFile) {
      message.error(dict('PC.Components.UploadImportConfig.invalidFileType'));
    }
    return isValidFile || Upload.LIST_IGNORE;
  };

  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  return (
    <>
      <Upload
        action={`${process.env.BASE_URL}/api/template/import/${spaceId}`}
        onChange={handleChange}
        style={{ display: 'none' }}
        headers={{
          Authorization: token ? `Bearer ${token}` : '',
        }}
        showUploadList={false}
        beforeUpload={beforeUpload || beforeUploadDefault}
      >
        <Button ref={buttonRef} />
      </Upload>
      <Button loading={loading} icon={<UploadOutlined />} onClick={handleClick}>
        {dict('PC.Components.UploadImportConfig.importConfig')}
      </Button>
    </>
  );
};

export default UploadImportConfig;
