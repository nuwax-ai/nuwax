/**
 * V2 编辑工作流弹窗组件
 * 用于编辑工作流基本信息
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
} from 'antd';
import { EditOutlined } from '@ant-design/icons';

import type { WorkflowDataV2 } from '../../types';

import './EditWorkflowModalV2.less';

const { TextArea } = Input;

// ==================== 类型定义 ====================

export interface EditWorkflowModalV2Props {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 工作流数据 */
  workflowData: WorkflowDataV2;
  /** 保存回调 */
  onSave?: (data: EditWorkflowData) => Promise<void>;
  /** 是否加载中 */
  loading?: boolean;
}

export interface EditWorkflowData {
  /** 工作流名称 */
  name: string;
  /** 工作流描述 */
  description?: string;
}

// ==================== 组件实现 ====================

const EditWorkflowModalV2: React.FC<EditWorkflowModalV2Props> = ({
  open,
  onClose,
  workflowData,
  onSave,
  loading = false,
}) => {
  const [form] = Form.useForm();

  // 初始化表单
  useEffect(() => {
    if (open && workflowData) {
      form.setFieldsValue({
        name: workflowData.name || '',
        description: workflowData.description || '',
      });
    }
  }, [open, workflowData]);

  // 保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave?.(values);
      message.success('保存成功');
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <EditOutlined />
          <span>编辑工作流</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={480}
      className="edit-workflow-modal-v2"
      footer={
        <div className="edit-workflow-modal-v2-footer">
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={loading}
          >
            保存
          </Button>
        </div>
      }
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        className="edit-workflow-modal-v2-form"
      >
        <Form.Item
          name="name"
          label="工作流名称"
          rules={[
            { required: true, message: '请输入工作流名称' },
            { max: 50, message: '名称最多50个字符' },
          ]}
        >
          <Input placeholder="请输入工作流名称" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="description"
          label="工作流描述"
          rules={[{ max: 500, message: '描述最多500个字符' }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入工作流描述"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditWorkflowModalV2;
