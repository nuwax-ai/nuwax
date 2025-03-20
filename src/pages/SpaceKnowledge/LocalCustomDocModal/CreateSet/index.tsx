import type { CreateSetProps } from '@/types/interfaces/knowledge';
import { isNumber } from '@/utils/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建设置、分段设置
 */
const CreateSet: React.FC<CreateSetProps> = ({
  form,
  autoSegmentConfigFlag,
  onChoose,
}) => {
  return (
    <>
      <div
        className={cx(
          styles['set-box'],
          'px-16',
          'py-16',
          'cursor-pointer',
          {
            [styles.active]: autoSegmentConfigFlag,
          },
          styles['mt-50'],
        )}
        onClick={() => onChoose(true)}
      >
        <h3>自动分段与清洗</h3>
        <p>自动分段与预处理规则</p>
      </div>
      <div
        className={cx(styles['set-box'], 'px-16', 'py-16', 'cursor-pointer', {
          [styles.active]: !autoSegmentConfigFlag,
        })}
        onClick={() => onChoose(false)}
      >
        <h3>自定义</h3>
        <p>自定义分段规则，分段长度及预处理规则</p>
        <div
          className={cx({
            [styles['custom-set-hide']]: autoSegmentConfigFlag,
          })}
        >
          <div className={cx(styles['divider-horizontal'])} />
          <Form
            form={form}
            layout="vertical"
            requiredMark={customizeRequiredMark}
          >
            <Form.Item
              name="delimiter"
              label="分段标识符"
              rules={[{ required: true, message: '输入分段标识符' }]}
            >
              <Input placeholder="输入分段标识符，例如 \n 换行" />
            </Form.Item>
            <Form.Item
              name="words"
              label="分段最大长度"
              rules={[
                { required: true, message: '请输入100-5000的数值' },
                {
                  validator(_, value) {
                    if (
                      !value ||
                      (Number(value) >= 100 && Number(value) <= 5000)
                    ) {
                      return Promise.resolve();
                    }
                    if (value && !isNumber(value)) {
                      return Promise.reject(new Error('请输入正确的数字!'));
                    }
                    return Promise.reject(
                      new Error('分段最大长度不得小于100，大于5000!'),
                    );
                  },
                },
              ]}
            >
              <Input placeholder="请输入100-5000的数值" />
            </Form.Item>
            <Form.Item
              name="overlaps"
              label="分段重叠数%"
              rules={[
                { required: true, message: '请输入0-100的数值' },
                {
                  validator(_, value) {
                    if (
                      !value ||
                      (Number(value) >= 0 && Number(value) <= 100)
                    ) {
                      return Promise.resolve();
                    }
                    if (value && !isNumber(value)) {
                      return Promise.reject(new Error('请输入正确的数字!'));
                    }
                    return Promise.reject(
                      new Error('分段重叠数不得小于0，大于100!'),
                    );
                  },
                },
              ]}
            >
              <Input placeholder="请输入0-100的数值" />
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
};

export default CreateSet;
