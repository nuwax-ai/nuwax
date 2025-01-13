import type { OverrideTextAreaProps } from '@/types/interfaces/common';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const { TextArea } = Input;

const OverrideTextArea: React.FC<OverrideTextAreaProps> = (props) => {
  const {
    placeholder = '请输入',
    name,
    label,
    maxLength = 200,
    minRows = 3,
    maxRows = 6,
  } = props;

  const [value, setValue] = useState<string>('');
  return (
    <Form.Item className={cx('relative')}>
      <Form.Item className={cx(styles['text-area'])} name={name} label={label}>
        <TextArea
          rootClassName={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
          autoSize={{ minRows, maxRows }}
        />
      </Form.Item>
      <Form.Item className={cx('absolute', styles.text)}>
        <span>
          {value?.length ?? 0}/{maxLength}
        </span>
      </Form.Item>
    </Form.Item>
  );
};

export default OverrideTextArea;
