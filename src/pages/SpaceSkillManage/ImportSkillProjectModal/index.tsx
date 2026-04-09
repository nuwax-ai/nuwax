import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
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
      message.error(
        dict(
          'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.pleaseSelectFile',
        ),
      );
      return;
    }
    const file = files[0]?.originFileObj || files[0];
    if (!file) {
      message.error(
        dict('PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileGetFailed'),
      );
      return;
    }

    const fileName = file.name || '';
    const lowerFileName = fileName.toLowerCase();
    // 校验文件类型，仅支持 .zip 或 .skill 压缩文件，或单个 SKILL.md 文件
    const isZip = lowerFileName.endsWith('.zip');
    const isSkill = lowerFileName.endsWith('.skill');
    // 只允许文件名严格为 SKILL.md，其他任意 md 文件名都不允许
    const isSkillMd = lowerFileName === 'skill.md';

    if (!isZip && !isSkill && !isSkillMd) {
      message.error(
        dict(
          'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileTypeUnsupported',
        ),
      );
      return false;
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
      console.error('Failed to process file import', error);
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
      message.error(
        dict(
          'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileTypeUnsupported',
        ),
      );
      return false;
    }

    // 校验文件大小，限制为20M
    if (file.size > SKILL_MAX_FILE_SIZE) {
      message.error(
        dict(
          'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileSizeExceeded',
        ),
      );
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
      title={dict(
        'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.importSkill',
      )}
      open={open}
      loading={loading}
      okText={dict(
        'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.confirmImport',
      )}
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
              <p className="ant-upload-text">
                {dict(
                  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.dragOrClickToSelect',
                )}
              </p>
              <p className="ant-upload-hint">
                {dict(
                  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.uploadHint',
                )}
              </p>
              <p className="ant-upload-hint">
                {dict(
                  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileSizeHint',
                )}
              </p>
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
                <Text strong>
                  {dict(
                    'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.selectedFile',
                  )}
                </Text>
                <br />
                <Text>{selectedFile.name}</Text>
                <br />
                <Text type="secondary">
                  {dict(
                    'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileSize',
                  )}
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
