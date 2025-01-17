import type { CascaderOption } from '@/types/interfaces/common';
import { Cascader, Form, Space } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface TimingTriggerProps {
  onChange: () => void;
}

const options: CascaderOption[] = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
        children: [
          {
            value: 'xihu',
            label: 'West Lake',
          },
        ],
      },
    ],
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    children: [
      {
        value: 'nanjing',
        label: 'Nanjing',
        children: [
          {
            value: 'zhonghuamen',
            label: 'Zhong Hua Men',
          },
        ],
      },
    ],
  },
];

/**
 * 定时触发器
 */
const TimingTrigger: React.FC<TimingTriggerProps> = ({ onChange }) => {
  return (
    <Form.Item
      label={
        <span>
          触发器时间{' '}
          <span className={cx(styles['trigger-time-require'])}>*</span>
        </span>
      }
    >
      <Space.Compact block>
        <Form.Item
          className={cx(styles['form-item'])}
          name="triggerTime"
          rules={[{ required: true }]}
        >
          <Cascader
            options={options}
            onChange={onChange}
            placeholder="Please select"
          />
        </Form.Item>
        <Form.Item
          className={cx(styles['form-item'])}
          name="triggerTime"
          rules={[{ required: true }]}
        >
          <Cascader
            options={options}
            onChange={onChange}
            placeholder="Please select"
          />
        </Form.Item>
      </Space.Compact>
    </Form.Item>
  );
};

export default TimingTrigger;
