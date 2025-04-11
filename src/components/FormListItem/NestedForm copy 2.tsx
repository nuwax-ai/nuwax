import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { dataTypes } from '@/pages/Antv-X6/params';
import {
  DeleteOutlined,
  FileDoneOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Cascader, Checkbox, Form, Input, Popover, Space } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  TreeFormItemProps,
  TreeFormProps,
  TreeFormSubProps,
  TreeFormSubRef,
} from './type';

const NodeRender: React.FC<TreeFormItemProps> = ({
  form,
  field,
  fieldName,
  inputItemName,
  remove,
  showCheck,
  subNodeRef, // 新增 prop 传递 ref
}) => {
  return (
    <Space>
      {/* 参数名称 */}
      <Form.Item
        name={[field.name, 'name']} // 修改为数组格式
        noStyle
      >
        <Input
          placeholder="请输入参数名称"
          style={{ flex: 1, marginRight: 8 }}
        />
      </Form.Item>

      {/* 数据类型 */}
      <Form.Item
        name={[field.name, 'dataType']} // 修改为数组格式
        noStyle
      >
        <Cascader
          options={dataTypes}
          style={{ width: 80, marginRight: 8 }}
          placeholder="请选择数据类型"
          displayRender={(label) => label[label.length - 1]}
          onChange={(value, selectedOptions) => {
            // 获取最后一级的 value
            const lastValue = selectedOptions[selectedOptions.length - 1].value;
            form.setFieldValue(
              [...fieldName, field.name, 'dataType'],
              lastValue,
            );
          }}
        />
      </Form.Item>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          width: 55,
        }}
      >
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
        {/* 添加子节点按钮 */}
        <Form.Item noStyle dependencies={['dataType']}>
          {({ getFieldValue }) => {
            const dataType = getFieldValue([
              inputItemName,
              ...fieldName,
              'dataType',
            ]);

            if (dataType === 'Object' || dataType === 'Array_Object') {
              return (
                <Button
                  type="text"
                  icon={<ICON_ASSOCIATION />}
                  onClick={() => {
                    subNodeRef.current?.addChild();
                  }}
                />
              );
            }
            return null;
          }}
        </Form.Item>
        {/* 删除节点按钮 */}
        <Form.Item noStyle>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            style={{ width: 18 }}
            onClick={() => remove(Number(field.name))}
          />
        </Form.Item>
      </div>
    </Space>
  );
};

// 可以递归的子节点

const SubNodeRenderer = forwardRef<TreeFormSubRef, TreeFormSubProps>(
  ({ form, fieldName, showCheck, inputItemName, level }, ref) => {
    const addRef = useRef<(...args: any[]) => void>();

    // 暴露 addChild 方法给父组件
    useImperativeHandle(ref, () => ({
      addChild: () => {
        if (addRef.current) {
          addRef.current({
            key: uuidv4(),
            name: '',
            dataType: null,
            subArgs: [],
          });
        }
      },
    }));

    return (
      <Form.Item
        shouldUpdate={(prevValues, curValues) => {
          const prevSubArgs = _.get(prevValues, [inputItemName, ...fieldName]);
          const currSubArgs = _.get(curValues, [inputItemName, ...fieldName]);
          if (!prevSubArgs && !currSubArgs) return false;
          if (!prevSubArgs || !currSubArgs) return true;
          return !_.isEqual(prevSubArgs, currSubArgs);
        }}
      >
        <Form.List name={[inputItemName, ...fieldName]}>
          {(fields, { add, remove }) => {
            // 保存 add 方法引用
            addRef.current = add;

            return (
              <div
                style={{
                  display: 'flex',
                  rowGap: 16,
                  flexDirection: 'column',
                  marginLeft: level * 10,
                }}
              >
                {fields.map((field) => (
                  <div key={field.key}>
                    <NodeRender
                      form={form}
                      field={field}
                      inputItemName={inputItemName}
                      fieldName={[field.name]}
                      remove={remove}
                      showCheck={showCheck}
                    />
                    <SubNodeRenderer
                      form={form}
                      fieldName={[...fieldName, field.name, 'subArgs']}
                      showCheck={showCheck}
                      level={level + 1}
                      inputItemName={inputItemName}
                    />
                  </div>
                ))}
              </div>
            );
          }}
        </Form.List>
      </Form.Item>
    );
  },
);

const NestedForm: React.FC<TreeFormProps> = ({
  form,
  fieldName,
  showCheck,
  level = 0,
  title,
}) => {
  const subNodeRef = useRef<TreeFormSubRef>(null);

  return (
    <Form.List name={fieldName}>
      {(fields, { add, remove }) => (
        <div
          style={{
            display: 'flex',
            rowGap: 16,
            flexDirection: 'column',
            marginLeft: level * 10,
          }}
        >
          <div className="dis-sb">
            <span>{title}</span>
            <Button icon={<PlusOutlined />} onClick={add}></Button>
          </div>
          {fields.map((field) => (
            <div key={field.key}>
              <NodeRender
                form={form}
                field={field}
                fieldName={[field.name]}
                remove={remove}
                showCheck={showCheck}
                inputItemName={fieldName}
                subNodeRef={subNodeRef} // 传递 ref
              />
              <SubNodeRenderer
                ref={subNodeRef}
                form={form}
                fieldName={[field.name, 'subArgs']}
                showCheck={showCheck}
                level={level + 1}
                inputItemName={fieldName}
              />
            </div>
          ))}
        </div>
      )}
    </Form.List>
  );
};

export default NestedForm;
