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
  /** 新增语言时的默认排序值（优先使用外部计算的最大 sort + 1） */
  sortIndex?: number;
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
  sortIndex,
  onCancel,
  onSuccess,
}) => {
  const isEdit = Boolean(langInfo?.id);
  const [form] = Form.useForm<AddLangFormValues>();
  const isDefaultChecked = Form.useWatch('isDefault', form);
  // 是否禁用默认语言开关
  const disableDefaultSwitch =
    isEdit && langInfo?.isDefault === I18nLangIsDefaultEnum.Yes;

  // 是否禁用状态开关
  const disableStatusSwitch = Boolean(isDefaultChecked);

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
          sort: sortIndex || 0,
        });
      }
    }
  }, [open, isEdit, langInfo, sortIndex, form]);

  // isDefault 为 true 时，status 必须自动开启且不可编辑
  useEffect(() => {
    if (!open || !isDefaultChecked) return;
    if (form.getFieldValue('status') !== true) {
      form.setFieldValue('status', true);
    }
  }, [open, isDefaultChecked, form]);

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
          ? dict('PC.Pages.SystemConfigI18n.editLang')
          : dict('PC.Pages.SystemConfigI18n.addLang')
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={dict('PC.Common.Global.confirm')}
      cancelText={dict('PC.Common.Global.cancel')}
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
              message: dict('PC.Pages.SystemConfigI18n.inputLangName'),
            },
          ]}
        >
          <Input
            maxLength={50}
            showCount
            placeholder={dict(
              'PC.Pages.SystemConfig.I18nManage.namePlaceholder',
            )}
          />
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.SystemConfig.I18nManage.codeLabel')}
          name="lang"
          rules={[
            {
              required: true,
              message: dict('PC.Pages.SystemConfigI18n.inputLangCode'),
            },
          ]}
          tooltip={dict('PC.Pages.SystemConfig.I18nManage.codeTooltip')}
        >
          <Input
            maxLength={50}
            showCount
            placeholder={dict(
              'PC.Pages.SystemConfig.I18nManage.codePlaceholder',
            )}
            disabled={isEdit}
          />
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.SystemConfigI18n.columnSort')}
          name="sort"
          tooltip={dict('PC.Pages.SystemConfig.I18nManage.orderTooltip')}
        >
          <InputNumber
            min={0}
            max={1000}
            precision={0}
            style={{ width: '100%' }}
            placeholder={dict(
              'PC.Pages.SystemConfig.I18nManage.orderPlaceholder',
            )}
          />
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.SystemConfig.I18nManage.setDefaultLang')}
          name="isDefault"
          valuePropName="checked"
          tooltip={
            isEdit && disableDefaultSwitch
              ? {
                  title: dict(
                    'PC.Pages.SystemConfig.I18nManage.defaultLangTip',
                  ),
                }
              : undefined
          }
        >
          <Switch disabled={disableDefaultSwitch} />
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.SystemConfig.I18nManage.statusLabel')}
          name="status"
          valuePropName="checked"
        >
          <Switch disabled={disableStatusSwitch} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddLangModal;
