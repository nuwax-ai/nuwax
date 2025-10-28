import { ExceptionItem } from '@/pages/Antv-X6/component/ExceptionItem';
import { ExceptionHandleTypeEnum } from '@/types/enums/common';
import { Button, Card, Form } from 'antd';
import React, { useState } from 'react';

/**
 * 异常处理组件使用示例
 */
const ExceptionItemExample: React.FC = () => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    exceptionHandleConfig: {
      timeout: 600,
      retryCount: 0,
      exceptionHandleType: ExceptionHandleTypeEnum.INTERRUPT,
    },
  });

  // 初始化表单值
  React.useEffect(() => {
    form.setFieldsValue(formValues);
  }, []);

  // 处理表单值变化
  const handleValuesChange = (changedValues: any, allValues: any) => {
    console.log('表单值变化：', changedValues);
    setFormValues(allValues);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('表单提交成功：', values);
      alert('表单提交成功：' + JSON.stringify(values, null, 2));
    } catch (error) {
      console.error('表单验证失败：', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="异常处理组件示例" bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          style={{ maxWidth: '600px' }}
        >
          {/* 其他表单项可以在这里添加 */}
          <Form.Item name="testField" label="测试字段">
            <input placeholder="这是外部表单的一个测试字段" />
          </Form.Item>

          {/* 使用异常处理组件 */}
          <ExceptionItem
            name="exceptionHandleConfig"
            outerForm={form}
            timeout={formValues.exceptionHandleConfig.timeout}
            retryCount={formValues.exceptionHandleConfig.retryCount}
            exceptionHandleType={
              formValues.exceptionHandleConfig.exceptionHandleType
            }
          />

          <Form.Item>
            <Button
              type="primary"
              onClick={handleSubmit}
              style={{ marginTop: '20px' }}
            >
              提交表单
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
          }}
        >
          <h4>当前表单值：</h4>
          <pre>{JSON.stringify(formValues, null, 2)}</pre>
        </div>
      </Card>
    </div>
  );
};

export default ExceptionItemExample;
