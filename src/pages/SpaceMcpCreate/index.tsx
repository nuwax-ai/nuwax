import LabelStar from '@/components/LabelStar';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useParams } from 'umi';
import styles from './index.less';
import McpHeader from './McpHeader';

const cx = classNames.bind(styles);

// 创建MCP服务
const SpaceMcpCreate: React.FC = () => {
  const [form] = Form.useForm();
  const params = useParams();
  const spaceId = Number(params.spaceId);

  // 取消创建MCP服务
  const handleCancel = () => {
    console.log('取消创建MCP服务');
  };

  // 保存MCP服务
  const handleSave = () => {
    console.log('保存MCP服务');
  };

  // 保存并部署MCP服务
  const handleSaveAndDeploy = () => {
    console.log('保存并部署MCP服务');
  };

  const onFinish: FormProps<any>['onFinish'] = (values) => {
    console.log('Success:', values);
  };

  return (
    <div className={cx(styles.container)}>
      <McpHeader
        spaceId={spaceId}
        onCancel={handleCancel}
        onSave={handleSave}
        onSaveAndDeploy={handleSaveAndDeploy}
      />
      <div className={cx(styles['main-container'])}>
        <Form
          form={form}
          preserve={false}
          layout="vertical"
          requiredMark={customizeRequiredMark}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item name="name" label={<LabelStar label="服务名称" />}>
            <Input placeholder="MCP服务名称" showCount maxLength={30} />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input.TextArea
              className="dispose-textarea-count"
              placeholder="描述你的MCP服务"
              showCount
              maxLength={500}
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default SpaceMcpCreate;
