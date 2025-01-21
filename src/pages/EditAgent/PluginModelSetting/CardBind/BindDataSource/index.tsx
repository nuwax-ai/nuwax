import CustomInputNumber from '@/components/CustomInputNumber';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Radio, RadioChangeEvent, Select, Switch } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const BindDataSource: React.FC = () => {
  const [cardStyle, setCardStyle] = useState<number>(1);
  const [cardListLen, setCardListLen] = useState<string>('');

  const onChangeCardStyle = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setCardStyle(e.target.value);
  };
  const handlerChangeCardLen = (value: string) => {
    setCardListLen(value);
  };

  const onFinish = (values) => {
    console.log(values);
  };

  return (
    <Form
      layout="vertical"
      preserve={false}
      requiredMark={customizeRequiredMark}
      onFinish={onFinish}
    >
      <Form.Item name="cardStyle" label="选择卡片样式">
        <Radio.Group onChange={onChangeCardStyle} value={cardStyle}>
          <Radio value={1}>单张卡片</Radio>
          <Radio value={2}>竖向列表</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        name="cardLength"
        label="卡片列表最大长度"
        rules={[{ required: true, message: '请输入卡片列表最大长度' }]}
      >
        <CustomInputNumber
          value={cardListLen}
          onChange={handlerChangeCardLen}
          placeholder="请输入卡片列表最大长度"
          max={10}
          min={1}
        />
      </Form.Item>
      <Form.Item label="为卡片整体绑定一个数组">
        <Select options={[]} placeholder="请选择"></Select>
      </Form.Item>
      <Form.Item label="为卡片内的列表项绑定数据">
        <Form.Item name="name01" className={cx('mb-16')}>
          <div className={cx('flex', 'items-center', styles['space-box'])}>
            <span className={cx(styles['radius-number'])}>1</span>
            <Select
              rootClassName={cx('flex-1')}
              options={[]}
              placeholder="请选择"
            ></Select>
          </div>
        </Form.Item>
        <Form.Item name="name02" className={cx('mb-16')}>
          <div className={cx('flex', 'items-center', styles['space-box'])}>
            <span className={cx(styles['radius-number'])}>2</span>
            <Select
              rootClassName={cx('flex-1')}
              options={[]}
              placeholder="请选择"
            ></Select>
          </div>
        </Form.Item>
        <Form.Item name="name03" className={cx('mb-0')}>
          <div className={cx('flex', 'items-center', styles['space-box'])}>
            <span className={cx(styles['radius-number'])}>3</span>
            <Select
              rootClassName={cx('flex-1')}
              options={[]}
              placeholder="请选择"
            ></Select>
          </div>
        </Form.Item>
      </Form.Item>
      <Form.Item
        label="点击卡片跳转"
        tooltip={{ title: '点击卡片跳转', icon: <InfoCircleOutlined /> }}
      >
        <Switch className={cx(styles['link-switch'])} size="small" />
        <Select options={[]} placeholder="请选择"></Select>
      </Form.Item>
    </Form>
  );
};

export default BindDataSource;
