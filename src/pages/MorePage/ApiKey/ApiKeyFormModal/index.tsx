import XModalForm from '@/components/ProComponents/XModalForm';
import { apiApiKeyCreate, apiApiKeyUpdate } from '@/services/account';
import type { ApiKeyInfo } from '@/types/interfaces/account';
import {
  ProFormDatePicker,
  ProFormRadio,
  ProFormText,
} from '@ant-design/pro-components';
import { Form, message } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect } from 'react';

interface ApiKeyFormModalProps {
  /** 弹窗显隐状态 */
  open: boolean;
  /** 显隐状态变更回调 */
  onOpenChange: (open: boolean) => void;
  /** 编辑模式下的行数据；若为空则为新建模式 */
  record?: ApiKeyInfo;
  /** 提交成功回调 */
  onSuccess: () => void;
}

/**
 * API Key 创建与编辑表单弹窗
 */
const ApiKeyFormModal: React.FC<ApiKeyFormModalProps> = ({
  open,
  onOpenChange,
  record,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!record;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        // 转换回显：后端返回的是格式化字符串 (如 YYYY-MM-DD HH:mm:ss)
        // 日期选择器需要 YYYY-MM-DD 格式
        const expire =
          record.expire &&
          record.expire !== '永不过期' &&
          record.expire !== '0000-00-00 00:00:00'
            ? dayjs(record.expire).format('YYYY-MM-DD')
            : undefined;

        form.setFieldsValue({
          name: record.name,
          expire,
          accessKey: record.accessKey,
          status: record.status,
        });
      } else {
        // 新建模式重置表单
        form.resetFields();
        form.setFieldsValue({ status: 1 }); // 默认启用
      }
    }
  }, [open, record, isEdit, form]);

  const onFinish = async (values: any) => {
    try {
      const { name, status, expire: expireVal } = values;
      // 这里的 expireVal 是日期选择器返回的字符串（YYYY-MM-DD）
      // 若为空则传 null
      const expire = expireVal ? dayjs(expireVal).valueOf() : null;

      if (isEdit) {
        // 调用更新接口
        await apiApiKeyUpdate({
          accessKey: record.accessKey,
          name,
          status,
          expire,
        });
        message.success('更新成功');
      } else {
        // 调用创建接口
        await apiApiKeyCreate({
          name,
          expire,
        });
        message.success('创建成功');
      }
      onSuccess(); // 成功后执行列表刷新等操作
      return true;
    } catch (error) {
      // 报错由全局 request 拦截器处理
      return false;
    }
  };

  return (
    <XModalForm
      title={isEdit ? '编辑 API Key' : '新建 API Key'}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onFinish={onFinish}
      width={520}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
      }}
    >
      <ProFormText
        name="name"
        label="密匙名称"
        placeholder="例如:生产环境API"
        rules={[{ required: true, message: '请输入密匙名称' }]}
      />

      <ProFormDatePicker
        name="expire"
        label="过期时间"
        placeholder="请选择过期时间"
        tooltip="留空表示永不过期"
      />

      {isEdit && (
        <>
          <ProFormText
            name="accessKey"
            label="API Key"
            placeholder="自动生成"
            disabled
          />
          <ProFormRadio.Group
            name="status"
            label="状态"
            options={[
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ]}
          />
        </>
      )}
    </XModalForm>
  );
};

export default ApiKeyFormModal;
