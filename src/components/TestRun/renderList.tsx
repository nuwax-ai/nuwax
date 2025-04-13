import CodeEditor from '@/components/CodeEditor';
import { Form, FormInstance, Input, Tag } from 'antd';

const renderFormList = (name: string, items: any[], form: FormInstance) => {
  return (
    <Form.List name={name}>
      {(fields) => {
        return (
          <>
            <span>{name}</span>
            {fields.map(({ key, name: fieldName }) => {
              const item = items[fieldName]; // 获取对应的数据项
              return (
                <div key={key}>
                  <Form.Item
                    name={[fieldName, item.name]} // 绑定到 bindValue
                    label={
                      <>
                        {item.name}
                        <Tag color="#C9CDD4" className="ml-10">
                          {item.dataType}
                        </Tag>
                      </>
                    }
                  >
                    {item.dataType === 'Object' ||
                    item.dataType?.includes('Array') ? (
                      <CodeEditor
                        value={
                          form.getFieldValue([name, fieldName, item.name]) || ''
                        }
                        codeLanguage={'JSON'}
                        onChange={(code: string) => {
                          form.setFieldValue(
                            [name, fieldName, item.name],
                            code,
                          ); // 更新表单值
                        }}
                        height="180px"
                      />
                    ) : (
                      <Input />
                    )}
                  </Form.Item>
                </div>
              );
            })}
          </>
        );
      }}
    </Form.List>
  );
};

export default renderFormList;
