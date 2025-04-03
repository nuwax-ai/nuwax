import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { DeleteOutlined, FileDoneOutlined } from '@ant-design/icons';
import { Button, Cascader, Checkbox, Form, Input, Popover } from 'antd';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TreeFormProps } from './type';
// import { v4 as uuidv4 } from 'uuid';
const dataTypes = [
  { value: 'String', label: 'String' },
  { value: 'Number', label: 'Number' },
  { value: 'Object', label: 'Object' },
];

const NodeRenderer: React.FC<TreeFormProps> = ({
  form,
  fieldName,
  showCheck,
  level = 0,
}) => {
  const nodes = form.getFieldValue(fieldName) || [];

  return (
    <Form.List name={fieldName}>
      {(fields, { remove }) => (
        <>
          {fields.map((field, index) => {
            console.log(nodes, 'nodes');
            const node = nodes[index];
            if (!node || !node.key) return null;

            // 处理子节点数据源 - 统一使用subArgs
            const childPath = [fieldName, field.name, 'subArgs'];
            const subParams =
              form.getFieldValue(childPath) || node?.subArgs || [];

            // 确保子节点数据结构正确
            if (!Array.isArray(subParams)) return null;
            if (!node) return null;
            // 确保每个节点的 key 是唯一的
            const uniqueKey = node.key || uuidv4();
            // 统一使用 children，忽略 subArgs

            return (
              <div key={uniqueKey} style={{ marginLeft: level * 10 }}>
                {/* 节点内容 */}
                <div className="dis-left">
                  {/* 参数名称 */}
                  <Form.Item
                    name={[field.name, 'name']} // 移除 {...field}
                    noStyle
                  >
                    <Input
                      placeholder="请输入参数名称"
                      style={{ flex: 1, marginRight: 8 }}
                    />
                  </Form.Item>

                  {/* 数据类型 */}
                  <Form.Item
                    name={[field.name, 'dataType']} // 移除 {...field}
                    noStyle
                  >
                    <Cascader
                      options={dataTypes}
                      style={{ width: 80, marginRight: 8 }}
                      placeholder="请选择数据类型"
                    />
                  </Form.Item>

                  {/* 描述 */}
                  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Form.Item noStyle>
                      <Popover
                        content={
                          <Form.Item name={[field.name, 'description']} noStyle>
                            <Input.TextArea rows={3} placeholder="请输入描述" />
                          </Form.Item>
                        }
                        trigger="click"
                      >
                        <Button
                          type="text"
                          icon={<FileDoneOutlined />}
                          style={{ width: 20 }}
                        />
                      </Popover>
                    </Form.Item>

                    {/* 必填项 */}
                    {showCheck && (
                      <Form.Item
                        name={[field.name, 'require']}
                        valuePropName="checked"
                        noStyle
                      >
                        <Checkbox style={{ width: 18 }} />
                      </Form.Item>
                    )}

                    {/* 当选项为 Object 时增加子节点按钮 */}
                    <Form.Item noStyle>
                      <Button
                        type="text"
                        className="tree-icon-style"
                        icon={<ICON_ASSOCIATION />}
                        style={{ width: 18 }}
                        // 修改添加子节点逻辑
                        onClick={() => {
                          const currentValue =
                            form.getFieldValue(fieldName) || [];
                          const newValue = [
                            ...currentValue,
                            {
                              key: uuidv4(),
                              name: '',
                              subArgs: [],
                            },
                          ];
                          form.setFieldsValue({
                            [fieldName]: newValue,
                          });
                        }}
                      />
                    </Form.Item>

                    {/* 删除节点按钮 */}
                    <Form.Item noStyle>
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        style={{ width: 18 }}
                        onClick={() => remove(field.name)}
                      />
                    </Form.Item>
                  </div>
                </div>

                {/* 子节点 */}
                {subParams.length > 0 && (
                  <Form.Item noStyle name={[field.name, 'subArgs']}>
                    <NodeRenderer
                      form={form}
                      fieldName={childPath}
                      showCheck={showCheck}
                      level={level + 1}
                    />
                  </Form.Item>
                )}
              </div>
            );
          })}
        </>
      )}
    </Form.List>
  );
};

export default NodeRenderer;
