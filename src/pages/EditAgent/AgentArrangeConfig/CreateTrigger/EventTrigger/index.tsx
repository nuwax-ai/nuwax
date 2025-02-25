import { DownOutlined } from '@ant-design/icons';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import React, { forwardRef } from 'react';
import CopyUrl from './CopyUrl';
import styles from './index.less';
import RequireParams from './RequireParams';

const cx = classNames.bind(styles);

/**
 * 事件触发器
 */
const EventTrigger: React.FC = forwardRef((_, ref) => {
  return (
    <>
      <Form.Item label="模式">
        <Form.Item className={cx(styles['mode-input'])}>
          <Input
            disabled
            suffix={<DownOutlined className={cx(styles['dropdown-icon'])} />}
            placeholder="Webhook (Catch hook)"
          />
        </Form.Item>
        <Form.Item className={cx('mb-0')}>
          <CopyUrl />
        </Form.Item>
      </Form.Item>
      <Form.Item
        name="eventBearerToken"
        label="Bearer Token"
        rules={[{ required: true, message: '请输入Bearer Token' }]}
      >
        <Input.Password />
      </Form.Item>
      {/*请求参数*/}
      <Form.Item name="requireParams">
        <RequireParams ref={ref} />
      </Form.Item>
    </>
  );
});

export default EventTrigger;
