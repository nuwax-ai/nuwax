import { apiI18nLangAdd, apiI18nLangUpdate } from '@/services/i18n';
import { dict } from '@/services/i18nRuntime';
import {
  I18nLangIsDefaultEnum,
  I18nLangStatusEnum,
  type I18nAddLangParams,
  type I18nLangDto,
  type I18nUpdateLangParams,
} from '@/types/interfaces/i18n';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, InputNumber, message, Modal, Switch } from 'antd';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';

interface AddLangModalProps {
  open: boolean;
  langInfo?: I18nLangDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * 新增语言表单值
 */
interface AddLangFormValues {
  name: string;
  lang: string;
  sort?: number;
  isDefault: boolean;
  status: boolean;
}

/**
 * 新增语言弹窗
 */
const AddLangModal: React.FC<AddLangModalProps> = ({
  open,
  langInfo,
  onCancel,
  onSuccess,
}) => {
  const isEdit = Boolean(langInfo?.id);
  const [form] = Form.useForm<AddLangFormValues>();

  // 新增语言
  const { run: runAddLang, loading: addingLang } = useRequest(apiI18nLangAdd, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success(dict('PC.Pages.SystemConfigI18n.addLangSuccess'));
      onSuccess();
    },
  });

  // 编辑语言
  const { run: runUpdateLang, loading: updatingLang } = useRequest(
    apiI18nLangUpdate,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: () => {
        message.success(dict('PC.Pages.SystemConfigI18n.editLangSuccess'));
        onSuccess();
      },
    },
  );

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (isEdit && langInfo) {
        form.setFieldsValue({
          name: langInfo.name,
          lang: langInfo.lang,
          sort: langInfo.sort ?? 0,
          isDefault: langInfo.isDefault === I18nLangIsDefaultEnum.Yes,
          status: langInfo.status === I18nLangStatusEnum.Enabled,
        });
      } else {
        form.setFieldsValue({
          isDefault: false,
          status: true,
          sort: 0,
        });
      }
    }
  }, [open, isEdit, langInfo, form]);

  // 提交表单
  const handleOk = async () => {
    const values = await form.validateFields();

    // 构建新增语言参数
    const addPayload: I18nAddLangParams = {
      ...values,
      isDefault: values.isDefault
        ? I18nLangIsDefaultEnum.Yes
        : I18nLangIsDefaultEnum.No,
      status: values.status
        ? I18nLangStatusEnum.Enabled
        : I18nLangStatusEnum.Disabled,
    };

    // 编辑语言
    if (isEdit && langInfo) {
      const payload: I18nUpdateLangParams = {
        id: langInfo.id,
        ...addPayload,
      };
      await runUpdateLang(payload);
    } else {
      // 新增语言
      await runAddLang(addPayload);
    }
  };

  return (
    <Modal
      title={
        isEdit
          ? dict('PC.Pages.SystemConfigI18n.editLang') || '编辑语言'
          : dict('PC.Pages.SystemConfigI18n.addLang')
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={dict('PC.Common.Global.save') || '保存'}
      cancelText={dict('PC.Common.Global.cancel') || '取消'}
      confirmLoading={addingLang || updatingLang}
      destroyOnHidden
    >
      <Form<AddLangFormValues>
        form={form}
        layout="vertical"
        requiredMark={customizeRequiredMark}
      >
        <Form.Item
          label={dict('PC.Pages.SystemConfigI18n.columnName')}
          name="name"
          rules={[
            {
              required: true,
              message: dict('PC.Common.Form.pleaseInput') || '请输入语言名称',
            },
          ]}
        >
          <Input placeholder="例如：英语、日本语" />
        </Form.Item>
        <Form.Item
          label="语言标识 (Code)"
          name="lang"
          rules={[
            {
              required: true,
              message: dict('PC.Common.Form.pleaseInput') || '请输入语言标识',
            },
          ]}
          tooltip="code格式：语言代码 - 国家代码"
        >
          <Input placeholder="例如：en-US、ja-JP" disabled={isEdit} />
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.SystemConfigI18n.columnSort')}
          name="sort"
          tooltip="值越小越靠前"
        >
          <InputNumber
            min={0}
            max={1000}
            precision={0}
            style={{ width: '100%' }}
            placeholder="例如：1"
          />
        </Form.Item>
        <Form.Item
          label="设为默认语言"
          name="isDefault"
          valuePropName="checked"
          tooltip="默认语言将作为翻译的源语言"
        >
          <Switch />
        </Form.Item>
        <Form.Item label="启用状态" name="status" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddLangModal;
