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
import { useEffect, useState } from 'react';

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
        onError(res.message || '上传失败，请检查文件格式是否正确');
      }
    } catch (error) {
      console.error('上传文件出错:', error);
      onError('上传过程中发生错误，请重试');
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
        message.error('仅支持Excel文件(.xlsx/.xls)');
        return false;
      }

      // 校验文件大小（限制为10MB）
      const isLessThan10M = file.size / 1024 / 1024 < 10;
      if (!isLessThan10M) {
        message.error('文件大小不能超过10MB');
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
  const handleConfirm = () => {
    if (fileList.length === 0) {
      message.error('请上传文件');
      return;
    }

    setUploading(true);
    handleUpload(
      fileList[0] as unknown as File,
      () => {
        setUploading(false);
        message.success('批量导入成功');
        setFileList([]);
        onConfirm();
      },
      (errorMsg) => {
        setUploading(false);
        message.error(errorMsg);
      },
    );
  };

  /**
   * 取消操作
   */
  const handleCancel = () => {
    setFileList([]);
    onCancel();
  };
  const handleDownloadQaTemplate = async () => {
    console.log('下载QA批量excel模板');
    try {
      const blob = await apiKnowledgeQaDownloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'QA批量excel模板.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      message.error('下载QA批量excel模板失败');
    }
  };

  return (
    <Modal
      title="QA批量导入"
      open={open}
      confirmLoading={uploading}
      onCancel={handleCancel}
      footer={
        <Space>
          <Tooltip title="下载Excel导入模板">
            <Button
              icon={<DownloadOutlined />}
              type="link"
              onClick={handleDownloadQaTemplate}
            >
              下载模板
            </Button>
          </Tooltip>
          <Button
            type="primary"
            disabled={fileList.length === 0}
            onClick={handleConfirm}
            loading={uploading}
          >
            确认上传
          </Button>
        </Space>
      }
      destroyOnClose
      width={500}
    >
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          仅支持Excel文件(.xlsx/.xls)，大小不超过10MB
        </p>
      </Dragger>

      {fileList.length === 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Typography.Text type="secondary">
            请先下载导入模板，按照格式填写后上传
          </Typography.Text>
        </div>
      )}
    </Modal>
  );
};

export default QaBatchModal;
