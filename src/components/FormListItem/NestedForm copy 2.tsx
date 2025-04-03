import { Button, Form, Input } from 'antd';

const SimpleForm = () => {
  const [form] = Form.useForm();

  return (
    <Form form={form} autoComplete="off">
      <Form.List name="inputArgs">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <div key={field.key}>
                <Form.Item
                  {...field}
                  name={[field.name, 'name']}
                  rules={[{ required: true, message: '请输入名称' }]}
                >
                  <Input placeholder="请输入参数名称" />
                </Form.Item>
                <Button onClick={() => remove(field.name)}>删除</Button>
              </div>
            ))}
            <Button onClick={() => add()}>添加节点</Button>
          </>
        )}
      </Form.List>
    </Form>
  );
};

export default SimpleForm;
