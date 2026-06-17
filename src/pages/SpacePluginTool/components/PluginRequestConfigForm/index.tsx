import LabelStar from '@/components/LabelStar';
import {
  REQUEST_CONTENT_FORMAT,
  REQUEST_METHOD,
} from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
import { HttpContentTypeEnum, HttpMethodEnum } from '@/types/enums/common';
import { customizeRequiredMark } from '@/utils/form';
import type { FormInstance } from 'antd';
import { Form, Input, Radio, Select } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from '../../index.less';

const cx = classNames.bind(styles);

export interface PluginRequestConfigFormProps {
  form: FormInstance;
}

const PluginRequestConfigForm: React.FC<PluginRequestConfigFormProps> = ({
  form,
}) => {
  return (
    <Form
      form={form}
      initialValues={{
        method: HttpMethodEnum.GET,
        contentType: HttpContentTypeEnum.OTHER,
        timeout: 10,
      }}
      layout="vertical"
      requiredMark={customizeRequiredMark}
    >
      <Form.Item
        label={
          <LabelStar
            label={dict('PC.Pages.SpacePluginTool.requestMethodAndPath')}
          />
        }
      >
        <div className={cx('flex')}>
          <Form.Item name="method" noStyle>
            <Select
              rootClassName={cx(styles['request-select'])}
              options={REQUEST_METHOD}
              placeholder={dict('PC.Pages.SpacePluginTool.selectRequestMethod')}
            />
          </Form.Item>
          <Form.Item
            name="url"
            rules={[
              {
                required: true,
                message: dict('PC.Pages.SpacePluginTool.inputRequestPath'),
              },
            ]}
            noStyle
          >
            <Input
              placeholder={dict('PC.Pages.SpacePluginTool.inputRequestPath')}
            />
          </Form.Item>
        </div>
      </Form.Item>
      <Form.Item
        name="contentType"
        label={dict('PC.Pages.SpacePluginTool.requestContentFormat')}
        rules={[
          {
            required: true,
            message: dict(
              'PC.Pages.SpacePluginTool.selectRequestContentFormat',
            ),
          },
        ]}
      >
        <Radio.Group options={REQUEST_CONTENT_FORMAT} />
      </Form.Item>
      <Form.Item
        name="timeout"
        label={dict('PC.Pages.SpacePluginTool.requestTimeoutConfig')}
        rules={[
          {
            required: true,
            message: dict('PC.Pages.SpacePluginTool.inputTimeoutConfig'),
          },
        ]}
      >
        <Input
          placeholder={dict(
            'PC.Pages.SpacePluginTool.requestTimeoutPlaceholder',
          )}
        />
      </Form.Item>
    </Form>
  );
};

export default PluginRequestConfigForm;
