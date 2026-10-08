import { XModalForm } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import {
  SensitiveWordActionEnum,
  SensitiveWordCategoryEnum,
  SensitiveWordMatchTypeEnum,
  type SensitiveWordCreateParams,
  type SensitiveWordInfo,
} from '@/types/interfaces/sensitiveWord';
import {
  ProFormRadio,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import {
  getActionOptions,
  getCategoryOptions,
  getMatchTypeOptions,
} from './constants';

interface SensitiveWordFormModalProps {
  open: boolean;
  /** 编辑的记录；为空时新增 */
  record?: SensitiveWordInfo | null;
  onCancel: () => void;
  /** 返回 true 关闭弹窗 */
  onFinish: (values: SensitiveWordCreateParams) => Promise<boolean>;
}

const DEFAULT_VALUES: SensitiveWordCreateParams = {
  word: '',
  category: SensitiveWordCategoryEnum.Illegal,
  matchType: SensitiveWordMatchTypeEnum.Contain,
  action: SensitiveWordActionEnum.Disconnect,
  replaceChar: '*',
};

/**
 * 新增 / 编辑敏感词弹窗
 */
const SensitiveWordFormModal: React.FC<SensitiveWordFormModalProps> = ({
  open,
  record,
  onCancel,
  onFinish,
}) => {
  const [form] = Form.useForm<SensitiveWordCreateParams>();
  const matchType = Form.useWatch('matchType', form);
  const action = Form.useWatch('action', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      record
        ? {
            word: record.word,
            category: record.category,
            matchType: record.matchType,
            action: record.action,
            replaceChar: record.replaceChar || '*',
          }
        : DEFAULT_VALUES,
    );
  }, [open, record, form]);

  return (
    <XModalForm<SensitiveWordCreateParams>
      title={
        record
          ? dict('PC.Pages.SystemSensitiveWord.editTitle')
          : dict('PC.Pages.SystemSensitiveWord.addTitle')
      }
      open={open}
      form={form}
      width={520}
      autoFocusFirstInput
      modalProps={{ destroyOnHidden: true, onCancel }}
      onFinish={async ({ replaceChar, ...values }) =>
        onFinish({
          ...values,
          word: values.word.trim(),
          ...(values.action === SensitiveWordActionEnum.Replace
            ? { replaceChar: replaceChar || '*' }
            : {}),
        })
      }
    >
      <ProFormText
        name="word"
        label={dict('PC.Pages.SystemSensitiveWord.word')}
        placeholder={dict('PC.Pages.SystemSensitiveWord.wordPlaceholder')}
        tooltip={
          matchType === SensitiveWordMatchTypeEnum.Regex
            ? dict('PC.Pages.SystemSensitiveWord.regexTip')
            : undefined
        }
        fieldProps={{ maxLength: 200, showCount: true }}
        rules={[
          {
            required: true,
            whitespace: true,
            message: dict('PC.Pages.SystemSensitiveWord.wordRequired'),
          },
        ]}
      />
      <ProFormSelect
        name="category"
        label={dict('PC.Pages.SystemSensitiveWord.category')}
        options={getCategoryOptions()}
        allowClear={false}
        rules={[{ required: true }]}
      />
      <ProFormRadio.Group
        name="matchType"
        label={dict('PC.Pages.SystemSensitiveWord.matchType')}
        options={getMatchTypeOptions()}
        rules={[{ required: true }]}
      />
      <ProFormRadio.Group
        name="action"
        label={dict('PC.Pages.SystemSensitiveWord.actionLabel')}
        options={getActionOptions()}
        rules={[{ required: true }]}
      />
      {action === SensitiveWordActionEnum.Replace && (
        <ProFormText
          name="replaceChar"
          label={dict('PC.Pages.SystemSensitiveWord.replaceChar')}
          placeholder="*"
          tooltip={dict('PC.Pages.SystemSensitiveWord.replaceCharTip')}
          fieldProps={{ maxLength: 1 }}
          rules={[
            {
              max: 1,
              message: dict('PC.Pages.SystemSensitiveWord.replaceCharInvalid'),
            },
          ]}
        />
      )}
    </XModalForm>
  );
};

export default SensitiveWordFormModal;
