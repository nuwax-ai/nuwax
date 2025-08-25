import { useBackground } from '@/hooks/useBackground';
import { BackgroundImage } from '@/types/background';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PictureOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Space,
} from 'antd';
import React, { useState } from 'react';
import './index.less';

const { TextArea } = Input;

/**
 * 全局背景管理组件
 * 提供背景图片的增删改查、预览和管理功能
 */
const GlobalBackgroundManager: React.FC = () => {
  const {
    backgroundImages,
    currentBackground,
    setBackground,
    addBackground,
    removeBackground,
    updateBackground,
    randomBackground,
    clearCustomBackgrounds,
  } = useBackground();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBackground, setEditingBackground] =
    useState<BackgroundImage | null>(null);
  const [form] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');

  // 打开添加背景模态框
  const showAddModal = () => {
    setEditingBackground(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑背景模态框
  const showEditModal = (background: BackgroundImage) => {
    setEditingBackground(background);
    form.setFieldsValue(background);
    setIsModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingBackground) {
        // 编辑现有背景
        updateBackground(editingBackground.id, values);
        message.success('背景图片更新成功');
      } else {
        // 添加新背景
        const newBackground: BackgroundImage = {
          id: `bg-custom-${Date.now()}`,
          ...values,
        };
        addBackground(newBackground);
        message.success('背景图片添加成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 预览背景图片
  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  // 删除背景图片
  const handleDelete = (backgroundId: string) => {
    removeBackground(backgroundId);
    message.success('背景图片删除成功');
  };

  // 随机切换背景
  const handleRandomBackground = () => {
    randomBackground();
    message.success('已随机切换到新背景');
  };

  // 清空自定义背景
  const handleClearCustomBackgrounds = () => {
    clearCustomBackgrounds();
    message.success('已清空所有自定义背景');
  };

  return (
    <div className="global-background-manager">
      {/* 控制按钮区域 */}
      <Card title="背景管理" className="control-panel">
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            添加背景
          </Button>
          <Button icon={<PictureOutlined />} onClick={handleRandomBackground}>
            随机切换
          </Button>
          <Popconfirm
            title="确定要清空所有自定义背景吗？"
            description="此操作将删除所有自定义添加的背景图片，保留默认背景。"
            onConfirm={handleClearCustomBackgrounds}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<DeleteOutlined />}>
              清空自定义
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      {/* 背景图片列表 */}
      <Card title="背景图片列表" className="background-list">
        <Row gutter={[16, 16]}>
          {backgroundImages.map((background) => (
            <Col key={background.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                size="small"
                className={`background-item ${
                  currentBackground?.id === background.id ? 'active' : ''
                }`}
                actions={[
                  <EyeOutlined
                    key="preview"
                    onClick={() => handlePreview(background.preview)}
                    title="预览"
                  />,
                  <EditOutlined
                    key="edit"
                    onClick={() => showEditModal(background)}
                    title="编辑"
                  />,
                  background.id.startsWith('bg-custom-') && (
                    <Popconfirm
                      key="delete"
                      title="确定要删除这个背景图片吗？"
                      onConfirm={() => handleDelete(background.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <DeleteOutlined title="删除" />
                    </Popconfirm>
                  ),
                ].filter(Boolean)}
              >
                <div className="background-preview">
                  <img
                    src={background.preview}
                    alt={background.name}
                    onClick={() => setBackground(background.id)}
                  />
                  {currentBackground?.id === background.id && (
                    <div className="current-badge">当前</div>
                  )}
                </div>
                <div className="background-info">
                  <div className="background-name">{background.name}</div>
                  <div className="background-id">{background.id}</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 添加/编辑背景模态框 */}
      <Modal
        title={editingBackground ? '编辑背景图片' : '添加背景图片'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="背景名称"
            rules={[{ required: true, message: '请输入背景名称' }]}
          >
            <Input placeholder="请输入背景名称" />
          </Form.Item>

          <Form.Item
            name="path"
            label="背景图片路径"
            rules={[{ required: true, message: '请输入背景图片路径' }]}
          >
            <Input placeholder="请输入背景图片路径，如：/bg/custom-bg.png" />
          </Form.Item>

          <Form.Item
            name="preview"
            label="预览图片路径"
            rules={[{ required: true, message: '请输入预览图片路径' }]}
          >
            <Input placeholder="请输入预览图片路径，如：/bg/custom-bg-preview.png" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入背景图片描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 图片预览模态框 */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        title="背景图片预览"
      >
        <div className="preview-container">
          <img
            src={previewImage}
            alt="背景预览"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default GlobalBackgroundManager;
