import { dict } from '@/services/i18nRuntime';
import { Form, Input } from 'antd';
import React from 'react';

interface BankAccountInputProps {
  name?: string | string[];
  label?: React.ReactNode;
  placeholder?: string;
  required?: boolean;
}

const BankAccountInput: React.FC<BankAccountInputProps> = ({
  name = 'bankAccountNo',
  label = dict('PC.Common.Global.bankAccountLabel'),
  placeholder = dict('PC.Common.Global.bankAccountPlaceholder'),
  required = true,
}) => {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={[
        ...(required ? [{ required: true }] : []),
        {
          validator: (_: any, value: string) => {
            const digits = value?.replace(/\s/g, '') || '';
            if (digits.length > 0 && !/^\d+$/.test(digits)) {
              return Promise.reject(
                dict('PC.Common.Global.bankAccountInvalid'),
              );
            }
            if (
              digits.length > 0 &&
              (digits.length < 16 || digits.length > 19)
            ) {
              return Promise.reject(
                dict('PC.Common.Global.bankAccountInvalid'),
              );
            }
            return Promise.resolve();
          },
        },
      ]}
      normalize={(value) => {
        if (!value) return value;
        return value.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
      }}
    >
      <Input maxLength={23} showCount placeholder={placeholder} />
    </Form.Item>
  );
};

export default BankAccountInput;
