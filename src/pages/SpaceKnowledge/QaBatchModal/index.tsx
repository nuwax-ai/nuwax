import { apiKnowledgeQaUpload } from '@/services/knowledge';
import { RequestResponse } from '@/types/interfaces/request';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { Button, Modal, Upload, message } from 'antd';
import { useState } from 'react';

interface QaBatchModalProps {
  open: boolean;
  kbId: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const { Dragger } = Upload;

const QaBatchModal: React.FC<QaBatchModalProps> = ({
  open,
  kbId,
  onConfirm,
  onCancel,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (
    file,
    onSuccess: () => void,
    onError: () => void,
  ) => {
    const res: RequestResponse<null> = await apiKnowledgeQaUpload({
      file: file as File,
      kbId,
    });
    if (res.code === '0000') {
      onSuccess();
    } else {
      onError();
    }
  };
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: (file) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        message.error('仅支持 excel 文件');
        return false;
      }
      setFileList([...fileList, file]);
      return false; // 阻止默认行为 手动上传
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    fileList,
  };
  const handleConfirm = () => {
    if (fileList.length === 0) {
      message.error('请上传文件');
      return;
    }
    setUploading(true);
    handleUpload(
      fileList[0],
      () => {
        setUploading(false);
        message.success('上传成功');
        setFileList([]);
        onConfirm();
      },
      () => {
        setUploading(false);
        message.error('上传失败');
      },
    );
  };

  return (
    <Modal
      title="QA批量导入"
      open={open}
      confirmLoading={uploading}
      onCancel={() => {
        setFileList([]);
        onCancel();
      }}
      footer={
        <Button
          type="primary"
          disabled={fileList.length === 0}
          onClick={handleConfirm}
          loading={uploading}
        >
          确认
        </Button>
      }
    >
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">仅支持 excel 文件</p>
      </Dragger>
    </Modal>
  );
};

export default QaBatchModal;
