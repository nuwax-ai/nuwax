import LabelStar from '@/components/LabelStar';
import type { TimingTriggerProps } from '@/types/interfaces/agentConfig';
import type { CascaderOption } from '@/types/interfaces/common';
import { Cascader, Form, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 定时触发器
 */
const TimingTrigger: React.FC<TimingTriggerProps> = ({ triggerTimeZone }) => {
  // UTC时区列表
  const [utcTimeZones, setUtcTimeZones] = useState<CascaderOption[]>([]);
  // 时间范围列表
  const [cronExpScopes, setCronExpScopes] = useState<CascaderOption[]>([]);

  // 数据类型转换
  useEffect(() => {
    const _utcTimeZones =
      triggerTimeZone?.utcTimeZones?.map((item) => {
        return {
          label: item.utc,
          value: item.utc,
          children: item?.timeZones?.map((info) => ({
            label: info.name,
            value: info.timeZone,
          })),
        };
      }) || [];
    setUtcTimeZones(_utcTimeZones);

    const _cronExpScopes =
      triggerTimeZone?.cronExpScopes?.map((item) => {
        return {
          label: item.scope,
          value: item.scope,
          children: item?.cronExps?.map((info) => ({
            label: info.time,
            value: info.expression,
          })),
        };
      }) || [];
    setCronExpScopes(_cronExpScopes);
  }, [triggerTimeZone]);
  return (
    <Form.Item label={<LabelStar label="触发器时间" />}>
      <Space.Compact block>
        <Form.Item
          className={cx(styles['form-item'])}
          name="timeZone"
          rules={[{ required: true }]}
        >
          <Cascader options={utcTimeZones} placeholder="请选择" />
        </Form.Item>
        <Form.Item
          className={cx(styles['form-item'])}
          name="timeCronExpression"
          rules={[{ required: true }]}
        >
          <Cascader options={cronExpScopes} placeholder="请选择" />
        </Form.Item>
      </Space.Compact>
    </Form.Item>
  );
};

export default TimingTrigger;
