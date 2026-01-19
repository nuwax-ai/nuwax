import CustomFormModal from '@/components/CustomFormModal';
import { UploadOutlined } from '@ant-design/icons';
import { Form, FormProps, message, Typography, Upload } from 'antd';
import { useCallback, useState } from 'react';

interface ImportSkillProjectModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (files: File[]) => void;
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

  // 处理文件导入
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    const files = values.files;
    setLoading(true);
    onConfirm(files);
    setLoading(false);
  };

  // 处理表单提交
  const handlerSubmit = () => {
    form.submit();
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((file: File) => {
    const fileName = file.name?.toLowerCase();
    // 校验文件类型，仅支持 .zip 压缩文件
    const isZip = fileName.endsWith('.zip');
    const isSkill = fileName.endsWith('.skill');
    const isMd = fileName.endsWith('SKILL.md');

    if (!isZip && !isSkill && !isMd) {
      message.error('仅支持 .zip,.skill 压缩文件格式或SKILL.md文件');
      return false;
    }

    // 校验文件大小，限制为100M
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      message.error('文件大小不能超过100MB');
      return false;
    }

    setSelectedFile(file);
    return false; // 阻止自动上传
  }, []);

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <CustomFormModal
      form={form}
      title="导入项目"
      open={open}
      loading={loading}
      okText="确认导入"
      onCancel={handleCancel}
      onConfirm={handlerSubmit}
    >
      <Form form={form} name="import-skill-project" onFinish={onFinish}>
        <Form.Item>
          <Form.Item
            name="files"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            noStyle
          >
            <Upload.Dragger
              accept=".zip,.skill,.md"
              beforeUpload={(file) => handleFileSelect(file)}
              // disabled={isFileOperating}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域选择</p>
              <p className="ant-upload-hint">
                仅支持 .zip,.skill 压缩文件格式或SKILL.md文件
              </p>
              <p className="ant-upload-hint">文件大小不超过100MB</p>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item name="file" noStyle>
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
          </Form.Item>
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default ImportSkillProjectModal;
