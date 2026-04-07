import { dict } from '@/services/i18nRuntime';
import {
  apiKnowledgeQaDownloadTemplate,
  apiKnowledgeQaUpload,
} from '@/services/knowledge';
import { RequestResponse } from '@/types/interfaces/request';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import {
  Button,
  Modal,
  Space,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import classNames from 'classnames';
import { debounce } from 'lodash';
import { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * QA批量导入对话框组件属性
 */
interface QaBatchModalProps {
  open: boolean; // 对话框是否可见
  kbId: number; // 知识库ID
  onCancel: () => void; // 取消回调
  onConfirm: () => void; // 确认回调
}

const { Dragger } = Upload;

/**
 * QA批量导入对话框组件
 * 用于批量导入知识库问答内容
 */
const QaBatchModal: React.FC<QaBatchModalProps> = ({
  open,
  kbId,
  onConfirm,
  onCancel,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // 监听对话框打开关闭状态，重置数据
  useEffect(() => {
    if (!open) {
      setFileList([]);
      setUploading(false);
    }
  }, [open]);

  /**
   * 处理文件上传
   */
  const handleUpload = async (
    file: File,
    onSuccess: () => void,
    onError: (message: string) => void,
  ): Promise<void> => {
    try {
      const res: RequestResponse<null> = await apiKnowledgeQaUpload({
        file,
        kbId,
      });

      if (res.code === '0000') {
        onSuccess();
      } else {
        onError(
          res.message ||
            dict(
              'PC.Pages.SpaceKnowledge.QaBatchModal.uploadFailedCheckFormat',
            ),
        );
      }
    } catch (error) {
      console.error('上传文件出错:', error);
      setUploading(false);
    }
  };

  /**
   * 上传组件配置
   */
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    maxCount: 1,
    beforeUpload: (file) => {
      // 校验文件类型
      const isExcel =
        file.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');

      if (!isExcel) {
        message.error(dict('PC.Pages.SpaceKnowledge.QaBatchModal.excelOnly'));
        return false;
      }

      // 校验文件大小（限制为10MB）
      const isLessThan10M = file.size / 1024 / 1024 < 10;
      if (!isLessThan10M) {
        message.error(
          dict('PC.Pages.SpaceKnowledge.QaBatchModal.fileSizeLimit10MB'),
        );
        return false;
      }

      setFileList([file]);
      return false; // 阻止默认上传行为，改为手动上传
    },
    onRemove: () => {
      setFileList([]);
    },
    fileList,
  };

  /**
   * 确认上传
   */
  const handleConfirm = debounce(() => {
    if (fileList.length === 0) {
      message.warning(
        dict('PC.Pages.SpaceKnowledge.QaBatchModal.pleaseUploadFile'),
      );
      return;
    }

    setUploading(true);
    handleUpload(
      fileList[0] as unknown as File,
      () => {
        setUploading(false);
        message.success(
          dict('PC.Pages.SpaceKnowledge.QaBatchModal.batchImportSuccess'),
        );
        setFileList([]);
        onConfirm();
      },
      (errorMsg) => {
        setUploading(false);
        message.error(errorMsg);
      },
    );
  }, 500);

  /**
   * 取消操作
   */
  const handleCancel = () => {
    setFileList([]);
    onCancel();
  };

  const handleDownloadQaTemplate = async () => {
    try {
      const result = await apiKnowledgeQaDownloadTemplate();
      // 判断是否成功
      if (!result.success) {
        // 导出失败，显示错误信息
        const errorMessage =
          result.error?.message ||
          dict('PC.Pages.SpaceKnowledge.QaBatchModal.exportFailed');
        message.warning(errorMessage);
        return;
      }

      const blob = new Blob([result?.data || '']);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dict(
        'PC.Pages.SpaceKnowledge.QaBatchModal.templateFileName',
      );
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      message.error(
        dict('PC.Pages.SpaceKnowledge.QaBatchModal.downloadTemplateFailed'),
      );
    }
  };

  return (
    <Modal
      title={dict('PC.Pages.SpaceKnowledge.QaBatchModal.qaBatchImport')}
      open={open}
      confirmLoading={uploading}
      onCancel={handleCancel}
      footer={
        <Space>
          <Tooltip
            title={dict(
              'PC.Pages.SpaceKnowledge.QaBatchModal.downloadExcelTemplate',
            )}
          >
            <Button
              icon={<DownloadOutlined />}
              type="link"
              onClick={handleDownloadQaTemplate}
            >
              {dict('PC.Pages.SpaceKnowledge.QaBatchModal.downloadTemplate')}
            </Button>
          </Tooltip>
          <Button
            type="primary"
            disabled={fileList.length === 0}
            onClick={handleConfirm}
            loading={uploading}
          >
            {dict('PC.Pages.SpaceKnowledge.QaBatchModal.confirmUpload')}
          </Button>
        </Space>
      }
      destroyOnHidden
      width={500}
    >
      <div className={cx(styles.dragger)}>
        <Dragger {...uploadProps} className={cx('h-full')}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {dict('PC.Pages.SpaceKnowledge.QaBatchModal.clickOrDragToUpload')}
          </p>
          <p className="ant-upload-hint">
            {dict('PC.Pages.SpaceKnowledge.QaBatchModal.excelUploadHint')}
          </p>
        </Dragger>
      </div>

      {fileList.length === 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Typography.Text type="secondary">
            {dict('PC.Pages.SpaceKnowledge.QaBatchModal.downloadTemplateHint')}
          </Typography.Text>
        </div>
      )}
    </Modal>
  );
};

export default QaBatchModal;
