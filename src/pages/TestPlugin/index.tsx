import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import PluginHeader from './PluginHeader';
import { Form, Input, Radio, Select, Switch } from 'antd';
import { customizeRequiredMark } from '@/utils/form';
import { REQUEST_CONTENT_FORMAT, REQUEST_METHOD } from '@/constants/library.constants';

const cx = classNames.bind(styles);

const TestPlugin: React.FC = () => {
  const [form] = Form.useForm();
  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <PluginHeader />
      <div className={cx(styles['main-container'])}>
        <h3 className={styles.title}>插件启用状态</h3>
        <Switch className={cx('mb-16')} />
        <h3 className={styles.title}>请求配置</h3>
        <Form form={form} layout="vertical" requiredMark={customizeRequiredMark}>
          <Form.Item name="requestMethodAndPath" label="请求方法与路径"
                     rules={[{ required: true, message: '请选择请求方法与路径' }]}>
            <div className={cx('flex')}>
              <Select rootClassName={cx(styles['request-select'])} options={REQUEST_METHOD} />
              <Input placeholder="请输入请求路径" />
            </div>
          </Form.Item>
          <Form.Item name="contentFormat" label="请求内容格式"
                     rules={[{ required: true, message: '请选择请求内容格式' }]}>
            <Radio.Group options={REQUEST_CONTENT_FORMAT} />
          </Form.Item>
          <Form.Item name="requestTimeout" label="请求超时配置" rules={[{ required: true, message: '请输入超时配置' }]}>
            <Input placeholder="请求超时配置，以秒为单位" />
          </Form.Item>
        </Form>
        <h3 className={styles.title}>入参配置</h3>
        <h3 className={styles.title}>出参配置</h3>
      </div>
    </div>
  );
};

export default TestPlugin;