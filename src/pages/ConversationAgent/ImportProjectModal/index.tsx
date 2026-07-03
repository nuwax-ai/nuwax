import CustomFormModal from '@/components/CustomFormModal';
import { dict, t } from '@/services/i18nRuntime';
import { UploadOutlined } from '@ant-design/icons';
import { Form, FormProps, message, Typography, Upload } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

const { Text } = Typography;

/** 导入项目 zip 包大小上限 20MB */
const IMPORT_PROJECT_MAX_FILE_SIZE = 20 * 1024 * 1024;

export interface ImportProjectModalProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
}

/**
 * 智能体开发页 - 导入项目弹窗
 * 上传 zip 包替换工作空间文件
 */
const ImportProjectModal: React.FC<ImportProjectModalProps> = ({
  open,
  loading = false,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedFile(null);
      setSubmitting(false);
    }
  }, [open, form]);

  /** 验证 zip 文件 */
  const validateZipFile = useCallback((file: File): boolean => {
    const lowerFileName = (file.name || '').toLowerCase();
    if (!lowerFileName.endsWith('.zip')) {
      message.error(t('PC.Pages.AppDevIndex.uploadZipHint'));
      return false;
    }

    if (file.size > IMPORT_PROJECT_MAX_FILE_SIZE) {
      message.error(
        dict(
          'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileSizeExceeded',
        ),
      );
      return false;
    }

    return true;
  }, []);

  /** 选择文件 */
  const handleFileSelect = useCallback(
    (file: File) => {
      if (!validateZipFile(file)) {
        return Upload.LIST_IGNORE;
      }

      setSelectedFile(file);
      return false;
    },
    [validateZipFile],
  );

  /** 标准化文件 */
  const normFile = (e: { fileList?: unknown[] } | unknown[]) => {
    if (Array.isArray(e)) {
      return e;
    }
    const fileList = e?.fileList || [];
    return fileList.slice(-1);
  };

  /** 提交 */
  const onFinish: FormProps['onFinish'] = async () => {
    if (!selectedFile) {
      message.error(t('PC.Pages.AppDevIndex.selectFileFirst'));
      return;
    }

    // beforeUpload 已校验，提交前再校验一次（与技能导入弹窗一致）
    if (!validateZipFile(selectedFile)) {
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(selectedFile);
    } catch (error) {
      console.error('[ImportProjectModal] import failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  /** 确认加载 */
  const confirmLoading = loading || submitting;

  return (
    <CustomFormModal
      form={form}
      title={t('PC.Pages.AppDevIndex.importProjectTitle')}
      open={open}
      loading={confirmLoading}
      okText={t('PC.Pages.AppDevIndex.confirmImport')}
      onCancel={onCancel}
      onConfirm={() => form.submit()}
    >
      <Form form={form} name="import-agent-project" onFinish={onFinish}>
        <Form.Item>
          <Form.Item
            name="files"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            noStyle
          >
            <Upload.Dragger
              accept=".zip"
              beforeUpload={handleFileSelect}
              multiple={false}
              showUploadList={false}
              disabled={confirmLoading}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                {t('PC.Pages.AppDevIndex.uploadDragText')}
              </p>
              <p className="ant-upload-hint">
                {t('PC.Pages.AppDevIndex.uploadZipHint')}
              </p>
              <p className="ant-upload-hint">
                {dict(
                  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileSizeHint',
                )}
              </p>
            </Upload.Dragger>
          </Form.Item>

          {/* 已选择文件 */}
          {selectedFile && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 6,
              }}
            >
              <Text strong>{t('PC.Pages.AppDevIndex.selectedFile')}</Text>
              <br />
              <Text>{selectedFile.name}</Text>
              <br />
              <Text type="secondary">
                {t('PC.Pages.AppDevIndex.fileSize')}{' '}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </div>
          )}
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default ImportProjectModal;
