import { apiI18nConfigAddOrUpdate } from '@/services/i18n';
import type { I18nSlideLangInfo } from '@/types/interfaces/i18n';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, Modal, message } from 'antd';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';

interface AddKeyValueModalProps {
  // 是否打开
  open: boolean;
  // 编辑时的当前项
  currentItem?: I18nSlideLangInfo | null;
  // 语言
  lang: string;
  // 端
  side: string;
  // 取消回调
  onCancel: () => void;
  onSuccess: () => void;
}

interface AddKeyValueFormValues {
  key: string;
  value: string;
  remark?: string;
}

/**
 * 添加键值对弹窗
 */
const AddKeyValueModal: React.FC<AddKeyValueModalProps> = ({
  open,
  currentItem,
  lang,
  side,
  onCancel,
  onSuccess,
}) => {
  const isEdit = Boolean(currentItem?.key);
  // 表单
  const [form] = Form.useForm<AddKeyValueFormValues>();

  // 新增或更新多语言配置
  const { run: runAddOrUpdate, loading } = useRequest(
    apiI18nConfigAddOrUpdate,
    {
      manual: true,
      onSuccess: () => {
        message.success(isEdit ? '更新成功' : '添加成功');
        form.resetFields();
        onSuccess();
      },
    },
  );

  // 初始化表单
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    // 编辑时，设置表单值
    if (isEdit && currentItem) {
      form.setFieldsValue({
        key: currentItem.key,
        value: currentItem.value,
        remark: currentItem.remark,
      });
    }
  }, [open, isEdit, currentItem, form]);

  // 添加键值对
  const handleOk = async () => {
    const values = await form.validateFields();
    const keyText = values.key.trim();
    await runAddOrUpdate({
      ...values,
      side,
      lang,
      key: keyText,
    });
  };

  return (
    <Modal
      title={isEdit ? '编辑键值对' : '添加键值对'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? '更新' : '添加'}
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={customizeRequiredMark}>
        <Form.Item
          label="Key"
          name="key"
          rules={[{ required: true, message: '请输入 Key' }]}
        >
          <Input placeholder="例如：PC.User.submit" />
        </Form.Item>
        <Form.Item
          label="文本内容"
          name="value"
          rules={[{ required: true, message: '请输入文本内容' }]}
        >
          <Input placeholder="例如：提交" />
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Input.TextArea
            placeholder="例如：Submit Button"
            autoSize={{ minRows: 3, maxRows: 4 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddKeyValueModal;
