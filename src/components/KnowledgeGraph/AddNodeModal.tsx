/**
 * 手动添加图谱节点弹窗组件
 */
import {
  AutoComplete,
  Button,
  Input,
  Modal,
  Select,
  Space,
  message,
} from 'antd';
import React, { useState } from 'react';
import styles from './AddNodeModal.less';

const { TextArea } = Input;

interface AddNodeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: AddNodeData) => void;
}

export interface AddNodeData {
  source: string; // 数据来源
  objectName: string; // 图谱对象
  relation: string; // 图谱关系
  objectValue: string; // 图谱对象值
}

// 数据来源选项
const SOURCE_OPTIONS = [
  { label: '文档导入', value: 'document' },
  { label: '手动添加', value: 'manual' },
  { label: 'API导入', value: 'api' },
  { label: '其他', value: 'other' },
];

// 图谱关系选项
const RELATION_OPTIONS = [
  { value: '包含' },
  { value: '关联' },
  { value: '属于' },
  { value: '引用' },
  { value: '依赖' },
  { value: '其他' },
];

export const AddNodeModal: React.FC<AddNodeModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [source] = useState<string>('manual'); // 默认选中手动添加且禁用
  const [objectName, setObjectName] = useState<string>('');
  const [relation, setRelation] = useState<string>('');
  const [objectValue, setObjectValue] = useState<string>('');

  const handleConfirm = () => {
    if (!objectName.trim()) {
      message.warning('请输入图谱对象');
      return;
    }
    if (!relation) {
      message.warning('请选择图谱关系');
      return;
    }
    if (!objectValue.trim()) {
      message.warning('请输入图谱对象值');
      return;
    }

    onConfirm({
      source,
      objectName: objectName.trim(),
      relation,
      objectValue: objectValue.trim(),
    });

    // 重置表单
    setObjectName('');
    setRelation('');
    setObjectValue('');
    onClose();
  };

  const handleClose = () => {
    setObjectName('');
    setRelation('');
    setObjectValue('');
    onClose();
  };

  return (
    <Modal
      title="手动添加图谱节点"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={520}
      className={styles.addNodeModal}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 数据来源 */}
        <div>
          <label className={styles.label}>数据来源</label>
          <Select
            value={source}
            placeholder="手动添加"
            options={SOURCE_OPTIONS}
            style={{ width: '100%' }}
            disabled
          />
        </div>

        {/* 图谱对象 */}
        <div>
          <label className={styles.label}>
            图谱对象
            <span className={styles.required}>*</span>
          </label>
          <Input
            value={objectName}
            onChange={(e) => setObjectName(e.target.value)}
            placeholder="请输入图谱对象名称"
          />
        </div>

        {/* 图谱关系 */}
        <div>
          <label className={styles.label}>
            图谱关系
            <span className={styles.required}>*</span>
          </label>
          <AutoComplete
            value={relation}
            onChange={setRelation}
            placeholder="请选择或输入图谱关系"
            options={RELATION_OPTIONS}
            style={{ width: '100%' }}
            filterOption={(inputValue, option) =>
              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
              -1
            }
          />
        </div>

        {/* 图谱对象值 */}
        <div>
          <label className={styles.label}>
            图谱对象值
            <span className={styles.required}>*</span>
          </label>
          <TextArea
            value={objectValue}
            onChange={(e) => setObjectValue(e.target.value)}
            placeholder="请输入图谱对象值"
            rows={4}
            showCount
          />
        </div>

        {/* 操作按钮 */}
        <div className={styles.footer}>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" onClick={handleConfirm}>
              确认保存
            </Button>
          </Space>
        </div>
      </Space>
    </Modal>
  );
};

export default AddNodeModal;
