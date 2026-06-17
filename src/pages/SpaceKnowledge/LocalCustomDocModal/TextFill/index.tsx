import { dict } from '@/services/i18nRuntime';
import type { TextFillProps } from '@/types/interfaces/knowledge';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const { TextArea } = Input;

/**
 * 文本填写组件
 */
const TextFill: React.FC<TextFillProps> = ({ form }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      rootClassName={cx(styles.container)}
      requiredMark={customizeRequiredMark}
    >
      <Form.Item
        name="name"
        label={dict('PC.Pages.SpaceKnowledge.TextFill.docName')}
        rules={[
          {
            required: true,
            message: dict('PC.Pages.SpaceKnowledge.TextFill.inputDocName'),
          },
        ]}
      >
        <Input
          placeholder={dict(
            'PC.Pages.SpaceKnowledge.TextFill.docNamePlaceholder',
          )}
          showCount
          maxLength={100}
        />
      </Form.Item>
      <Form.Item
        name="fileContent"
        label={dict('PC.Pages.SpaceKnowledge.TextFill.docContent')}
        rules={[
          {
            required: true,
            message: dict('PC.Pages.SpaceKnowledge.TextFill.inputDocContent'),
          },
        ]}
      >
        <TextArea
          placeholder={dict(
            'PC.Pages.SpaceKnowledge.TextFill.docContentPlaceholder',
          )}
          autoSize={{ minRows: 6, maxRows: 8 }}
        />
      </Form.Item>
    </Form>
  );
};

export default TextFill;
