/**
 * OnlyOffice Demo Page
 *
 * Demonstrates document upload, preview, and editing functionality
 * using OnlyOffice Document Server
 */

import OnlyOfficeEditor from '@/components/business-component/OnlyOfficeEditor';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileWordOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  List,
  message,
  Modal,
  Popconfirm,
  Space,
  Typography,
  Upload,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

const { Title, Text } = Typography;

// Backend API URL
const API_URL = 'http://localhost:3001/api';

interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  documentKey: string;
  updatedAt?: string;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'doc':
    case 'docx':
      return <FileWordOutlined style={{ fontSize: 32, color: '#2b579a' }} />;
    case 'xls':
    case 'xlsx':
      return <FileExcelOutlined style={{ fontSize: 32, color: '#217346' }} />;
    case 'ppt':
    case 'pptx':
      return <FilePptOutlined style={{ fontSize: 32, color: '#d24726' }} />;
    case 'pdf':
      return <FilePdfOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />;
    default:
      return <FileWordOutlined style={{ fontSize: 32, color: '#666' }} />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const OnlyOfficeDemo: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Fetch file list
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/files`);
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
      } else {
        message.error('获取文件列表失败');
      }
    } catch (error) {
      console.error('Fetch files error:', error);
      message.error('获取文件列表失败，请检查后端服务是否运行');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Handle file upload
  const uploadProps: UploadProps = {
    name: 'file',
    action: `${API_URL}/upload`,
    accept: '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf',
    showUploadList: false,
    beforeUpload: () => {
      setUploading(true);
      return true;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        setUploading(false);
        if (info.file.response?.success) {
          message.success('上传成功');
          fetchFiles();
        } else {
          message.error(info.file.response?.error || '上传失败');
        }
      } else if (info.file.status === 'error') {
        setUploading(false);
        message.error('上传失败');
      }
    },
  };

  // Handle file delete
  const handleDelete = async (file: FileInfo) => {
    try {
      const response = await fetch(`${API_URL}/files/${file.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        message.success('删除成功');
        fetchFiles();
      } else {
        message.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error('删除失败');
    }
  };

  // Handle preview
  const handlePreview = (file: FileInfo, edit = false) => {
    setSelectedFile(file);
    setEditMode(edit);
    setPreviewModalOpen(true);
  };

  // Close preview modal
  const closePreview = () => {
    setPreviewModalOpen(false);
    setSelectedFile(null);
    setEditMode(false);
    // Refresh file list to get updated timestamps
    fetchFiles();
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2}>OnlyOffice 文档预览和编辑演示</Title>
      <Text type="secondary">
        支持上传、预览和编辑 Word、Excel、PowerPoint 和 PDF 文档
      </Text>

      <Alert
        style={{ marginTop: 16, marginBottom: 16 }}
        message="使用说明"
        description={
          <div>
            <p>
              1. 需要启动后端服务：
              <code>cd server &amp;&amp; npm install &amp;&amp; npm start</code>
            </p>
            <p>
              2. 需要运行 OnlyOffice Document Server：
              <code>docker run -p 8080:80 onlyoffice/documentserver</code>
            </p>
            <p>
              3.
              上传文档后，点击&ldquo;预览&rdquo;或&ldquo;编辑&rdquo;按钮查看效果
            </p>
          </div>
        }
        type="info"
        showIcon
      />

      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Upload {...uploadProps}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={uploading}
            >
              上传文档
            </Button>
          </Upload>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchFiles}
            loading={loading}
          >
            刷新列表
          </Button>
        </Space>
      </Card>

      <Divider>已上传文档</Divider>

      {files.length === 0 ? (
        <Empty description="暂无文档，请上传文件" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
          dataSource={files}
          loading={loading}
          renderItem={(file) => (
            <List.Item>
              <Card
                hoverable
                actions={[
                  <Button
                    key="preview"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(file, false)}
                  >
                    预览
                  </Button>,
                  <Button
                    key="edit"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handlePreview(file, true)}
                    disabled={file.filename.endsWith('.pdf')}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确定删除此文档？"
                    onConfirm={() => handleDelete(file)}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  avatar={getFileIcon(file.filename)}
                  title={
                    <div
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={file.originalName}
                    >
                      {file.originalName}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatFileSize(file.size)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(file.uploadedAt).toLocaleString()}
                      </Text>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Preview/Edit Modal */}
      <Modal
        title={
          <Space>
            {selectedFile && getFileIcon(selectedFile.filename)}
            <span>{selectedFile?.originalName}</span>
            <span
              style={{ color: editMode ? '#52c41a' : '#1890ff', fontSize: 12 }}
            >
              ({editMode ? '编辑模式' : '预览模式'})
            </span>
          </Space>
        }
        open={previewModalOpen}
        onCancel={closePreview}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        styles={{ body: { padding: 0, height: 'calc(100vh - 150px)' } }}
        destroyOnClose
      >
        {selectedFile && (
          <OnlyOfficeEditor
            configUrl={`${API_URL}/config`}
            documentId={selectedFile.id}
            editable={editMode}
            height="100%"
            onReady={() => console.log('Editor ready')}
            onError={(e) => console.error('Editor error:', e)}
          />
        )}
      </Modal>
    </div>
  );
};

export default OnlyOfficeDemo;
