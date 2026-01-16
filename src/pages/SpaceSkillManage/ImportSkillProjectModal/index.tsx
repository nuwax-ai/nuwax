import CustomFormModal from '@/components/CustomFormModal';
import { UploadOutlined } from '@ant-design/icons';
import { Form, message, Typography, Upload } from 'antd';
import { useCallback, useState } from 'react';

interface ImportSkillProjectModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const { Text } = Typography;

const ImportSkillProjectModal: React.FC<ImportSkillProjectModalProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleCancel = () => {
    onCancel();
  };

  const handlerSubmit = () => {
    setLoading(true);
    onConfirm();
    setLoading(false);
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((file: File) => {
    // 校验文件类型，仅支持 .zip 压缩文件
    const isZip = file.name?.toLowerCase().endsWith('.zip');

    if (!isZip) {
      message.error('仅支持 .zip 压缩文件格式');
      return false;
    }

    setSelectedFile(file);
    return false; // 阻止自动上传
  }, []);

  return (
    <CustomFormModal
      form={form}
      title={'导入项目'}
      open={open}
      loading={loading}
      okText={'确认导入'}
      // okPrefixIcon={
      //   createAgentType === CreateAgentEnum.Standard ? (
      //     ''
      //   ) : (
      //     <ICON_CONFIRM_STAR />
      //   )
      // }
      onCancel={handleCancel}
      onConfirm={handlerSubmit}
    >
      <div>
        <Upload.Dragger
          accept=".zip"
          beforeUpload={(file) => handleFileSelect(file)}
          // disabled={isFileOperating}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域选择</p>
          <p className="ant-upload-hint">
            仅支持 .zip 压缩文件格式（将更新当前项目）
          </p>
        </Upload.Dragger>
        {selectedFile && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 6,
            }}
          >
            <Text strong>已选择文件：</Text>
            <br />
            <Text>{selectedFile.name}</Text>
            <br />
            <Text type="secondary">
              文件大小：{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </Text>
          </div>
        )}
      </div>
    </CustomFormModal>
  );
};

export default ImportSkillProjectModal;
