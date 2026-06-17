/**
 * 编辑弹窗组件
 */
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Space, message } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './EditModal.less';
import type { EditModalData } from './types/graph';

const { TextArea } = Input;

interface EditModalProps {
  visible: boolean;
  data: EditModalData | null;
  onClose: () => void;
  onSave: (data: EditModalData) => void;
  onDelete: (id: string, type: 'node' | 'edge') => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  visible,
  data,
  onClose,
  onSave,
  onDelete,
}) => {
  const [label, setLabel] = useState('');
  const [fullText, setFullText] = useState('');

  useEffect(() => {
    if (data) {
      setLabel(data.label);
      setFullText(data.fullText || data.label);
    }
  }, [data]);

  const handleSave = () => {
    if (!label.trim()) {
      message.warning('标签不能为空');
      return;
    }

    onSave({
      ...data!,
      label: label.trim(),
      fullText: fullText.trim(),
    });
    onClose();
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后数据将无法恢复，确定要删除吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        onDelete(data!.id, data!.type);
        onClose();
      },
    });
  };

  return (
    <Modal
      title={data?.type === 'node' ? '编辑节点' : '编辑关系'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      className={styles.editModal}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <label className={styles.label}>标签</label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="请输入标签"
          />
        </div>

        <div>
          <label className={styles.label}>详细内容</label>
          <TextArea
            value={fullText}
            onChange={(e) => setFullText(e.target.value)}
            placeholder="请输入详细内容"
            rows={6}
            showCount
          />
        </div>

        <div className={styles.footer}>
          <Space>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
            <Button onClick={onClose}>取消</Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              删除
            </Button>
          </Space>
        </div>
      </Space>
    </Modal>
  );
};

export default EditModal;
