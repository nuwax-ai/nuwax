import CustomFormModal from '@/components/CustomFormModal';
import { UploadOutlined } from '@ant-design/icons';
import { Form, FormProps, message, Typography, Upload } from 'antd';
import { useCallback, useEffect, useState } from 'react';

interface ImportSkillProjectModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
}

const { Text } = Typography;

// 技能项目文件大小限制
const SKILL_MAX_FILE_SIZE = 20 * 1024 * 1024; // 最大文件大小20MB

/**
 * 上传技能项目模态框
 * @param open 是否打开
 * @param onCancel 取消回调
 * @param onConfirm 确认回调
 * @returns
 */
const ImportSkillProjectModal: React.FC<ImportSkillProjectModalProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedFile(null);
      setLoading(false);
    }
  }, [open, form]);

  // 处理文件导入
  const onFinish: FormProps['onFinish'] = async (values) => {
    const files = values.files;
    if (!files || files.length === 0) {
      message.error('请选择要导入的文件');
      return;
    }
    const file = files[0]?.originFileObj || files[0];
    if (!file) {
      message.error('文件获取失败，请重新选择');
      return;
    }

    /**
     * 在Upload.Dragger的beforeUpload中已经校验了文件大小，但是即使return false 阻止了自动上传，但是form表单中也存在该文件，所以需要再次校验
     */
    // 校验文件大小，限制为20M
    if (file.size > SKILL_MAX_FILE_SIZE) {
      return;
    }

    try {
      setLoading(true);
      await onConfirm(file);
    } catch (error) {
      console.error('处理文件导入失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交
  const handlerSubmit = () => {
    form.submit();
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((file: File) => {
    const fileName = file.name || '';
    const lowerFileName = fileName.toLowerCase();
    // 校验文件类型，仅支持 .zip 或 .skill 压缩文件，或单个 SKILL.md 文件
    const isZip = lowerFileName.endsWith('.zip');
    const isSkill = lowerFileName.endsWith('.skill');
    // 只允许文件名严格为 SKILL.md，其他任意 md 文件名都不允许
    const isSkillMd = lowerFileName === 'skill.md';

    if (!isZip && !isSkill && !isSkillMd) {
      message.error('仅支持 .zip,.skill 压缩文件格式或SKILL.md文件');
      return false;
    }

    // 校验文件大小，限制为20M
    if (file.size > SKILL_MAX_FILE_SIZE) {
      message.error('文件大小不能超过20MB');
      return false;
    }

    setSelectedFile(file);
    return false; // 阻止自动上传
  }, []);

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    // 只返回单个文件，如果已有文件则替换
    const fileList = e?.fileList || [];
    return fileList.slice(-1); // 只保留最后一个文件
  };

  return (
    <CustomFormModal
      form={form}
      title="导入技能"
      open={open}
      loading={loading}
      okText="确认导入"
      onCancel={onCancel}
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
              multiple={false}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域选择</p>
              <p className="ant-upload-hint">
                仅支持 .zip,.skill 压缩文件格式 或 SKILL.md 文件
              </p>
              <p className="ant-upload-hint">文件大小不超过20MB</p>
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
