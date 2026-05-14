/**
 * 批量导入图谱节点弹窗组件
 */
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  UPLOAD_FILE_ACTION,
  UPLOAD_FILE_SUFFIX,
} from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
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
import React, { useEffect, useState } from 'react';
import styles from './BatchImportModal.less';

const cx = classNames.bind(styles);

const { Dragger } = Upload;

interface BatchImportModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (fileList: UploadFile[]) => void;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // 监听对话框打开关闭状态，重置数据
  useEffect(() => {
    if (!visible) {
      setFileList([]);
      setUploading(false);
    }
  }, [visible]);

  // 下载模板
  const handleDownloadTemplate = () => {
    // 模板内容
    const templateContent = `数据来源,图谱对象,图谱关系,图谱对象值
手动添加,人工智能,包含,机器学习是AI的一个分支
手动添加,机器学习,包含,深度学习
手动添加,深度学习,包含,神经网络
手动添加,Python,属于,编程语言
手动添加,React,关联,前端开发`;

    const blob = new Blob(['\ufeff' + templateContent], {
      type: 'text/csv;charset=utf-8',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '图谱节点导入模板.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success('模板下载成功');
  };

  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    action: UPLOAD_FILE_ACTION,
    fileList,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    beforeUpload: (file: File) => {
      const { name, size } = file;
      if (!name.includes('.')) {
        message.error('请上传正确的文件类型');
        return Upload.LIST_IGNORE;
      }
      const splitList = name.split('.');
      const suffix = splitList[splitList.length - 1]?.toLowerCase();
      const isFile = UPLOAD_FILE_SUFFIX.includes(suffix);
      if (!isFile) {
        message.error(
          '请上传 PDF、TXT、DOC、DOCX、MD、JSON、JPG、PNG、GIF、WEBP、SVG、HEIC、MP4、MKV、MOV、WEBM、MP3、AAC、WAV、FLAC、OGG、OPUS 类型文件!',
        );
        return Upload.LIST_IGNORE;
      }
      const isLt100M = size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error('文件大小不能超过100MB!');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    onChange: (info) => {
      const { status } = info.file;
      if (status === 'done') {
        if (info.file.response?.code !== SUCCESS_CODE) {
          message.warning(info.file.response?.message);
          return;
        }
      }
      setFileList(info.fileList);
    },
    onRemove: () => {
      setFileList([]);
    },
    showUploadList: true,
  };

  // 确认导入
  const handleConfirm = () => {
    if (fileList.length === 0) {
      message.warning('请先上传文件');
      return;
    }
    if (fileList.length > 300) {
      message.warning('最多可上传 300 个文件');
      return;
    }
    setUploading(true);
    // 模拟上传过程
    setTimeout(() => {
      setUploading(false);
      onConfirm(fileList);
      setFileList([]);
      message.success('导入成功');
    }, 500);
  };

  // 关闭弹窗
  const handleClose = () => {
    setFileList([]);
    onClose();
  };

  return (
    <Modal
      title="批量导入图谱节点"
      open={visible}
      confirmLoading={uploading}
      onCancel={handleClose}
      footer={
        <Space>
          <Tooltip title="下载导入模板">
            <Button
              icon={<DownloadOutlined />}
              type="link"
              onClick={handleDownloadTemplate}
            >
              下载模板
            </Button>
          </Tooltip>
          <Button onClick={handleClose}>取消</Button>
          <Button
            type="primary"
            disabled={fileList.length === 0}
            loading={uploading}
            onClick={handleConfirm}
          >
            确认导入
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
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持
            PDF、TXT、DOC、DOCX、MD、JSON、JPG、PNG、GIF、WEBP、SVG、HEIC、MP4、MKV、MOV、WEBM、MP3、AAC、WAV、FLAC、OGG、OPUS，最多可上传
            300 个文件，每个文件不超过 100MB， PDF 最多 500 页
          </p>
        </Dragger>
      </div>

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

export default BatchImportModal;
