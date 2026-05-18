import { t } from '@/services/i18nRuntime';
import { Checkbox, Form, Input, Radio, Select } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { ParsedMcpAskField } from '../../utils/parse-interaction-schema';
import styles from './McpAskFormField.less';

interface McpAskFormFieldProps {
  field: ParsedMcpAskField;
  disabled?: boolean;
}

const CUSTOM_OPTION_VALUE = '__custom__';

/**
 * 按 JSON Schema + uiSchema 渲染单个 Ask 表单字段
 */
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
        <Checkbox.Group disabled={disabled} className={styles.optionGroup}>
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
          <Radio.Group disabled={disabled} className={styles.optionGroup}>
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
                  className={styles.textControl}
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
            className={styles.textControl}
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
        <Radio.Group disabled={disabled} className={styles.optionGroup}>
          {enumValues.map((value, index) => (
            <Radio key={value} value={value}>
              {enumLabels[index] ?? value}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>
    );
  }

  if (widget === 'textarea') {
    return (
      <Form.Item name={name} label={label} rules={rules}>
        <Input.TextArea
          disabled={disabled}
          className={styles.textControl}
          rows={3}
          placeholder={options.placeholder || label}
          maxLength={property.maxLength}
          showCount={!!property.maxLength}
        />
      </Form.Item>
    );
  }

  return (
    <Form.Item name={name} label={label} rules={rules}>
      <Input
        disabled={disabled}
        className={classNames(styles.textControl)}
        placeholder={options.placeholder || label}
        maxLength={property.maxLength}
      />
    </Form.Item>
  );
};

export default McpAskFormField;
