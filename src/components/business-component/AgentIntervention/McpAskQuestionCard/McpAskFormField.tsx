import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { t } from '@/services/i18nRuntime';
import { handleUploadFileList } from '@/utils/upload';
import { InboxOutlined } from '@ant-design/icons';
import {
  Checkbox,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Upload,
} from 'antd';
import classNames from 'classnames';
import React from 'react';
import {
  limitMcpAskUploadFileList,
  validateMcpAskRequiredFileField,
} from '../utils/normalizeMcpAskFormData';
import type { ParsedMcpAskField } from '../utils/parseMcpAskSchema';
import { getJsonSchemaPrimaryType } from '../utils/parseMcpAskSchema';
import styles from './McpAskFormField.less';

const cx = classNames.bind(styles);

interface McpAskFormFieldProps {
  field: ParsedMcpAskField;
  disabled?: boolean;
}

const CUSTOM_OPTION_VALUE = '__custom__';

const McpAskFormField: React.FC<McpAskFormFieldProps> = ({
  field,
  disabled,
}) => {
  const { name, property, widget, required, options, enumValues, enumLabels } =
    field;
  const label = property.title || name;
  const rules = required
    ? [
        {
          required: true,
          message: t('PC.Components.McpAskQuestionCard.fieldRequired'),
        },
      ]
    : [];

  if (widget === 'checkboxes' && enumValues.length) {
    return (
      <Form.Item
        name={name}
        label={label}
        rules={[
          ...rules,
          {
            type: 'array',
            min: property.minItems ?? (required ? 1 : 0),
            message: t('PC.Components.McpAskQuestionCard.multiSelectMin'),
          },
        ]}
      >
        <Checkbox.Group
          disabled={disabled}
          className={cx(styles['option-group'])}
        >
          {enumValues.map((value, index) => (
            <Checkbox key={value} value={value}>
              {enumLabels[index] ?? value}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Form.Item>
    );
  }

  if (widget === 'radio-with-custom' && enumValues.length) {
    const otherValue = options.otherValue ?? CUSTOM_OPTION_VALUE;
    const otherField = options.otherField ?? `${name}Custom`;

    return (
      <>
        <Form.Item name={name} label={label} rules={rules}>
          <Radio.Group
            disabled={disabled}
            className={cx(styles['option-group'])}
          >
            {enumValues.map((value, index) => (
              <Radio key={value} value={value}>
                {enumLabels[index] ?? value}
              </Radio>
            ))}
            {options.allowCustom !== false && (
              <Radio value={otherValue}>
                {t('PC.Components.McpAskQuestionCard.customOption')}
              </Radio>
            )}
          </Radio.Group>
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prev, cur) => prev[name] !== cur[name]}
        >
          {({ getFieldValue }) =>
            getFieldValue(name) === otherValue ? (
              <Form.Item
                name={otherField}
                label={t('PC.Components.McpAskQuestionCard.customInputLabel')}
                rules={[
                  {
                    required: true,
                    message: t(
                      'PC.Components.McpAskQuestionCard.fieldRequired',
                    ),
                  },
                ]}
              >
                <Input
                  disabled={disabled}
                  className={cx(styles['text-control'])}
                  placeholder={
                    options.placeholder ||
                    t('PC.Components.McpAskQuestionCard.customInputPlaceholder')
                  }
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>
      </>
    );
  }

  if ((widget === 'radio' || widget === 'select') && enumValues.length) {
    if (widget === 'select') {
      return (
        <Form.Item name={name} label={label} rules={rules}>
          <Select
            disabled={disabled}
            className={cx(styles['text-control'])}
            classNames={{
              popup: {
                root: cx(styles['select-dropdown']),
              },
            }}
            placeholder={options.placeholder || label}
            options={enumValues.map((value, index) => ({
              value,
              label: enumLabels[index] ?? value,
            }))}
          />
        </Form.Item>
      );
    }
    return (
      <Form.Item name={name} label={label} rules={rules}>
        <Radio.Group disabled={disabled} className={cx(styles['option-group'])}>
          {enumValues.map((value, index) => (
            <Radio key={value} value={value}>
              {enumLabels[index] ?? value}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>
    );
  }

  if (widget === 'number') {
    const isInteger = getJsonSchemaPrimaryType(property) === 'integer';

    return (
      <Form.Item name={name} label={label} rules={rules}>
        <InputNumber
          disabled={disabled}
          className={cx(styles['text-control'])}
          style={{ width: '100%' }}
          placeholder={options.placeholder || label}
          min={property.minimum}
          max={property.maximum}
          step={property.multipleOf ?? (isInteger ? 1 : undefined)}
          precision={isInteger ? 0 : undefined}
        />
      </Form.Item>
    );
  }

  if (widget === 'textarea') {
    return (
      <Form.Item name={name} label={label} rules={rules}>
        <Input.TextArea
          disabled={disabled}
          className={cx(styles['text-control'])}
          rows={3}
          placeholder={options.placeholder || label}
          maxLength={property.maxLength}
          showCount={!!property.maxLength}
        />
      </Form.Item>
    );
  }

  if (widget === 'list' && enumValues.length) {
    return (
      <Form.Item name={name} label={label} rules={rules}>
        <Radio.Group disabled={disabled} className={cx(styles['option-group'])}>
          {enumValues.map((value, index) => (
            <Radio
              key={value}
              value={value}
              className={cx(styles['list-radio'])}
            >
              {enumLabels[index] ?? value}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>
    );
  }

  if (widget === 'file') {
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
    const accept = (options as any)?.accept;
    const multiple = (options as any)?.multiple;
    const fileRules = required
      ? [
          {
            validator: async (_: unknown, value: unknown) => {
              try {
                validateMcpAskRequiredFileField(value);
              } catch {
                throw new Error(
                  t('PC.Components.McpAskQuestionCard.fieldRequired'),
                );
              }
            },
          },
        ]
      : [];

    return (
      <Form.Item
        name={name}
        label={label}
        rules={fileRules}
        valuePropName="fileList"
        getValueFromEvent={(e) => {
          const rawList = Array.isArray(e)
            ? e
            : handleUploadFileList(e?.fileList ?? []);
          return limitMcpAskUploadFileList(rawList, multiple);
        }}
      >
        <Upload.Dragger
          action={UPLOAD_FILE_ACTION}
          headers={{ Authorization: token ? `Bearer ${token}` : '' }}
          data={{ type: 'tmp' }}
          disabled={disabled}
          multiple={multiple}
          maxCount={multiple ? undefined : 1}
          accept={accept}
          listType="picture"
          className={cx(styles['upload-control'])}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {t('PC.Components.McpAskQuestionCard.uploadDragText') ||
              '点击或拖拽文件到此区域上传'}
          </p>
        </Upload.Dragger>
      </Form.Item>
    );
  }

  return (
    <Form.Item name={name} label={label} rules={rules}>
      <Input
        disabled={disabled}
        className={cx(styles['text-control'])}
        placeholder={options.placeholder || label}
        maxLength={property.maxLength}
      />
    </Form.Item>
  );
};

export default McpAskFormField;
