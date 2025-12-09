/**
 * V2 发布弹窗组件
 * 用于发布工作流
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Alert,
  Typography,
  Divider,
  Checkbox,
  message,
} from 'antd';
import {
  CloudUploadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

import type { WorkflowDataV2, ValidationErrorV2 } from '../../types';

import './PublishModalV2.less';

const { TextArea } = Input;
const { Text } = Typography;

// ==================== 类型定义 ====================

export interface PublishModalV2Props {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 工作流数据 */
  workflowData: WorkflowDataV2;
  /** 校验错误 */
  validationErrors?: ValidationErrorV2[];
  /** 发布回调 */
  onPublish?: (data: PublishData) => Promise<void>;
  /** 是否加载中 */
  loading?: boolean;
}

export interface PublishData {
  /** 版本描述 */
  versionDescription: string;
  /** 是否强制发布（忽略警告） */
  forcePublish: boolean;
}

// ==================== 组件实现 ====================

const PublishModalV2: React.FC<PublishModalV2Props> = ({
  open,
  onClose,
  workflowData,
  validationErrors = [],
  onPublish,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [forcePublish, setForcePublish] = useState(false);

  // 分类错误
  const errors = validationErrors.filter((e) => e.level === 'error');
  const warnings = validationErrors.filter((e) => e.level === 'warning');

  // 是否可以发布
  const canPublish = errors.length === 0 && (warnings.length === 0 || forcePublish);

  // 重置表单
  useEffect(() => {
    if (open) {
      form.resetFields();
      setForcePublish(false);
    }
  }, [open]);

  // 执行发布
  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      await onPublish?.({
        versionDescription: values.versionDescription,
        forcePublish,
      });
      message.success('发布成功');
      onClose();
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CloudUploadOutlined />
          <span>发布工作流</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={560}
      className="publish-modal-v2"
      footer={
        <div className="publish-modal-v2-footer">
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handlePublish}
            loading={loading}
            disabled={!canPublish}
          >
            发布
          </Button>
        </div>
      }
      destroyOnClose
    >
      <div className="publish-modal-v2-content">
        {/* 工作流信息 */}
        <div className="publish-modal-v2-info">
          <div className="publish-modal-v2-info-item">
            <Text type="secondary">工作流名称:</Text>
            <Text strong>{workflowData.name || '未命名工作流'}</Text>
          </div>
          <div className="publish-modal-v2-info-item">
            <Text type="secondary">当前版本:</Text>
            <Text>{workflowData.version || 'v1.0.0'}</Text>
          </div>
        </div>

        <Divider />

        {/* 校验结果 */}
        {errors.length > 0 && (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            message={`存在 ${errors.length} 个错误，无法发布`}
            description={
              <ul className="publish-modal-v2-error-list">
                {errors.map((error, index) => (
                  <li key={index}>
                    {error.nodeName && <Text strong>[{error.nodeName}] </Text>}
                    {error.message}
                  </li>
                ))}
              </ul>
            }
            className="publish-modal-v2-alert"
          />
        )}

        {warnings.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`存在 ${warnings.length} 个警告`}
            description={
              <>
                <ul className="publish-modal-v2-error-list">
                  {warnings.map((warning, index) => (
                    <li key={index}>
                      {warning.nodeName && <Text strong>[{warning.nodeName}] </Text>}
                      {warning.message}
                    </li>
                  ))}
                </ul>
                {errors.length === 0 && (
                  <Checkbox
                    checked={forcePublish}
                    onChange={(e) => setForcePublish(e.target.checked)}
                    className="publish-modal-v2-force-checkbox"
                  >
                    忽略警告，强制发布
                  </Checkbox>
                )}
              </>
            }
            className="publish-modal-v2-alert"
          />
        )}

        {errors.length === 0 && warnings.length === 0 && (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message="校验通过，可以发布"
            className="publish-modal-v2-alert"
          />
        )}

        {/* 版本描述 */}
        <Form form={form} layout="vertical" className="publish-modal-v2-form">
          <Form.Item
            name="versionDescription"
            label="版本描述"
            rules={[{ required: true, message: '请输入版本描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入本次发布的更新说明"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default PublishModalV2;
