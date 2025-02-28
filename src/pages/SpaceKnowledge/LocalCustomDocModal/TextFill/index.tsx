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
        label="文档名称"
        rules={[{ required: true, message: '输入文档名称' }]}
      >
        <Input placeholder="输入文档名称" showCount maxLength={100} />
      </Form.Item>
      <Form.Item name="fileContent" label="文档内容">
        <TextArea
          placeholder="输入文档内容"
          autoSize={{ minRows: 6, maxRows: 8 }}
        />
      </Form.Item>
    </Form>
  );
};

export default TextFill;
