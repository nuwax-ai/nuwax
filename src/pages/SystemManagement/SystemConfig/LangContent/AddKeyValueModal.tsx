import CustomFormModal from '@/components/CustomFormModal';
import { apiI18nConfigAddOrUpdate } from '@/services/i18n';
import { dict } from '@/services/i18nRuntime';
import type { I18nSlideLangInfo } from '@/types/interfaces/i18n';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, Select, Space, message } from 'antd';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';

interface AddKeyValueModalProps {
  // 是否打开
  open: boolean;
  // 编辑时的当前项
  currentItem?: I18nSlideLangInfo | null;
  // 语言
  lang: string;
  // 端下拉选项
  sideSelectOptions?: { label: string; value: string }[];
  // 取消回调
  onCancel: () => void;
  onSuccess: () => void;
}

interface AddKeyValueFormValues {
  side: string;
  key: string;
  value: string;
  remark?: string;
}

// 默认端下拉选项
const DefaultSideList: { label: string; value: string }[] = [
  { label: 'PC', value: 'PC' },
  { label: 'Mobile', value: 'Mobile' },
  { label: 'Claw', value: 'Claw' },
  { label: 'Backend', value: 'Backend' },
];

/**
 * 新增或编辑键值对弹窗
 */
const AddKeyValueModal: React.FC<AddKeyValueModalProps> = ({
  open,
  currentItem,
  lang,
  sideSelectOptions = DefaultSideList,
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
        message.success(
          isEdit
            ? dict('PC.Pages.SystemConfig.LangContent.updateSuccess')
            : dict('PC.Pages.SystemConfig.LangContent.addSuccess'),
        );
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
      const fullKey = String(currentItem.key || '');
      const dotIndex = fullKey.indexOf('.');
      const selectedSide = dotIndex > -1 ? fullKey.slice(0, dotIndex) : '';
      const keySuffix = dotIndex > -1 ? fullKey.slice(dotIndex + 1) : fullKey;

      form.setFieldsValue({
        side: selectedSide,
        key: keySuffix,
        value: currentItem.value,
        remark: currentItem.remark,
      });
      return;
    } else {
      form.setFieldsValue({
        side: sideSelectOptions[0]?.value || 'PC',
      });
    }
  }, [open, isEdit, currentItem, form]);

  // 添加键值对
  const handleOk = async () => {
    const values = await form.validateFields();
    const keyText = `${values.side}.${values.key.trim()}`;
    await runAddOrUpdate({
      ...values,
      lang,
      key: keyText,
    });
  };

  return (
    <CustomFormModal
      form={form}
      title={
        isEdit
          ? dict('PC.Pages.SystemConfig.LangContent.editKeyValTitle')
          : dict('PC.Pages.SystemConfig.LangContent.addKeyValTitle')
      }
      open={open}
      onCancel={onCancel}
      onConfirm={handleOk}
      okText={
        isEdit
          ? dict('PC.Pages.SystemConfig.LangContent.updateBtn')
          : dict('PC.Pages.SystemConfig.LangContent.addBtn')
      }
      loading={loading}
    >
      <Form form={form} layout="vertical" requiredMark={customizeRequiredMark}>
        <Form.Item label="Key">
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item
              name="side"
              noStyle
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Pages.SystemConfig.LangContent.keyRequired',
                  ),
                },
              ]}
            >
              <Select
                style={{ width: 140 }}
                options={sideSelectOptions}
                disabled={isEdit}
                placeholder={dict(
                  'PC.Pages.SystemConfig.LangContent.keyRequired',
                )}
              />
            </Form.Item>
            <Form.Item
              name="key"
              noStyle
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Pages.SystemConfig.LangContent.keyRequired',
                  ),
                },
                {
                  validator: async (_, value?: string) => {
                    const keyText = String(value || '').trim();
                    if (!keyText) return;
                    if (!keyText.includes('.')) {
                      throw new Error(
                        dict(
                          'PC.Pages.SystemConfig.LangContent.keyMustContainDot',
                        ),
                      );
                    }
                  },
                },
              ]}
            >
              <Input
                maxLength={100}
                showCount
                placeholder={dict(
                  'PC.Pages.SystemConfig.LangContent.keyPlaceholder',
                )}
                disabled={isEdit}
              />
            </Form.Item>
          </Space.Compact>
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.SystemConfig.LangContent.textContentLabel')}
          name="value"
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.SystemConfig.LangContent.textContentRequired',
              ),
            },
          ]}
        >
          <Input.TextArea
            className="dispose-textarea-count"
            placeholder={dict(
              'PC.Pages.SystemConfig.LangContent.textContentPlaceholder',
            )}
            autoSize={{ minRows: 3, maxRows: 4 }}
          />
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.SystemConfig.LangContent.remarkLabel')}
          name="remark"
        >
          <Input.TextArea
            maxLength={200}
            showCount
            className="dispose-textarea-count"
            placeholder={dict(
              'PC.Pages.SystemConfig.LangContent.remarkPlaceholder',
            )}
            autoSize={{ minRows: 3, maxRows: 4 }}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default AddKeyValueModal;
