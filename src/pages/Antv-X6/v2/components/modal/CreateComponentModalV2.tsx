/**
 * V2 创建组件弹窗
 * 用于将工作流保存为可复用组件
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Select,
  message,
  Alert,
} from 'antd';
import { AppstoreAddOutlined } from '@ant-design/icons';

import type { WorkflowDataV2 } from '../../types';

import './CreateComponentModalV2.less';

const { TextArea } = Input;

// ==================== 类型定义 ====================

export interface CreateComponentModalV2Props {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 工作流数据 */
  workflowData: WorkflowDataV2;
  /** 创建回调 */
  onCreate?: (data: CreateComponentData) => Promise<void>;
  /** 是否加载中 */
  loading?: boolean;
  /** 分类列表 */
  categories?: Array<{ label: string; value: string }>;
}

export interface CreateComponentData {
  /** 组件名称 */
  name: string;
  /** 组件描述 */
  description?: string;
  /** 组件分类 */
  category?: string;
  /** 组件图标 */
  icon?: string;
}

// 默认分类
const DEFAULT_CATEGORIES = [
  { label: '通用', value: 'general' },
  { label: '数据处理', value: 'data' },
  { label: 'AI 能力', value: 'ai' },
  { label: '工具', value: 'tool' },
  { label: '其他', value: 'other' },
];

// ==================== 组件实现 ====================

const CreateComponentModalV2: React.FC<CreateComponentModalV2Props> = ({
  open,
  onClose,
  workflowData,
  onCreate,
  loading = false,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [form] = Form.useForm();

  // 初始化表单
  useEffect(() => {
    if (open && workflowData) {
      form.setFieldsValue({
        name: workflowData.name ? `${workflowData.name}_组件` : '',
        description: workflowData.description || '',
        category: 'general',
      });
    }
  }, [open, workflowData]);

  // 创建
  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await onCreate?.(values);
      message.success('组件创建成功');
      onClose();
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <AppstoreAddOutlined />
          <span>保存为组件</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={520}
      className="create-component-modal-v2"
      footer={
        <div className="create-component-modal-v2-footer">
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            onClick={handleCreate}
            loading={loading}
          >
            创建组件
          </Button>
        </div>
      }
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        message="将当前工作流保存为可复用组件"
        description="保存后的组件可以在其他工作流中直接使用，提高开发效率。"
        className="create-component-modal-v2-alert"
      />

      <Form
        form={form}
        layout="vertical"
        className="create-component-modal-v2-form"
      >
        <Form.Item
          name="name"
          label="组件名称"
          rules={[
            { required: true, message: '请输入组件名称' },
            { max: 50, message: '名称最多50个字符' },
          ]}
        >
          <Input placeholder="请输入组件名称" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="category"
          label="组件分类"
          rules={[{ required: true, message: '请选择组件分类' }]}
        >
          <Select
            placeholder="请选择组件分类"
            options={categories}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="组件描述"
          rules={[{ max: 500, message: '描述最多500个字符' }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入组件描述，说明组件的功能和使用场景"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateComponentModalV2;
