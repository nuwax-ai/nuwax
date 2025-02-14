import LabelStar from '@/components/LabelStar';
import type { CascaderOption } from '@/types/interfaces/common';
import { Cascader, Form, Space } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const options: CascaderOption[] = [
  {
    value: '11:00',
    label: '11:00',
    children: [
      {
        value: '1',
        label: '纽埃时间 - Pacific/Niue',
      },
      {
        value: '2',
        label: '萨摩亚标准时间 - Pacific/Midway',
      },
    ],
  },
  {
    value: '10:00',
    label: '10:00',
    children: [
      {
        value: '1',
        label: '塔希提岛时间 - Pacific/Tahiti',
      },
      {
        value: '2',
        label: '夏威夷-阿留申时间 - America/Adak',
      },
    ],
  },
];

const timeOptions: CascaderOption[] = [
  {
    value: '1',
    label: '每日触发',
    children: [
      {
        value: '10',
        label: '00:00',
      },
      {
        value: '11',
        label: '01:00',
      },
    ],
  },
  {
    value: '2',
    label: '每周触发',
    children: [
      {
        value: '20',
        label: '周日',
      },
      {
        value: '21',
        label: '周一',
      },
    ],
  },
];

/**
 * 定时触发器
 */
const TimingTrigger: React.FC = () => {
  return (
    <Form.Item label={<LabelStar label="触发器时间" />}>
      <Space.Compact block>
        <Form.Item
          className={cx(styles['form-item'])}
          name="timeZone"
          rules={[{ required: true }]}
        >
          <Cascader options={options} placeholder="请选择" />
        </Form.Item>
        <Form.Item
          className={cx(styles['form-item'])}
          name="timeCronExpression"
          rules={[{ required: true }]}
        >
          <Cascader options={timeOptions} placeholder="请选择" />
        </Form.Item>
      </Space.Compact>
    </Form.Item>
  );
};

export default TimingTrigger;
