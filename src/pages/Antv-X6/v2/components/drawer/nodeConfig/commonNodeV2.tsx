/**
 * V2 通用节点表单组件
 *
 * 包含：输入输出参数、树形输出等通用组件
 * 完全独立，不依赖 V1
 */

import InputOrReference from '@/components/FormListItem/InputOrReference';
import { DataTypeMap } from '@/constants/common.constants';
import { DataTypeEnum } from '@/types/enums/common';
import type { DefaultObjectType } from '@/types/interfaces/common';
import type { InputAndOutConfig } from '@/types/interfaces/node';
import {
  DeleteOutlined,
  DownOutlined,
  FileDoneOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Form, FormInstance, Input, Popover, Tag, Tree } from 'antd';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import './commonNodeV2.less';

// ==================== 类型定义 ====================

/** V2 简化版字段配置（独立于 V1 的 FieldConfig） */
export interface FieldConfigV2 {
  name: string;
  defaultValue?: any;
}

export interface NodeRenderPropsV2 {
  title: React.ReactNode;
  fieldConfigs?: FieldConfigV2[];
  form: FormInstance;
  inputItemName?: string;
  showCopy?: boolean;
  disabledAdd?: boolean;
  disabledDelete?: boolean;
  disabledInput?: boolean;
  isLoop?: boolean;
}

export interface TreeOutputPropsV2 {
  treeData: InputAndOutConfig[];
}

export interface FormListPropsV2 {
  form: FormInstance;
  title: React.ReactNode;
  field: string;
  inputItemName?: string;
  showIndex?: boolean;
  limitAddLength?: number;
  hasUuid?: boolean;
}

// ==================== 默认配置 ====================

export const outPutConfigsV2: FieldConfigV2[] = [
  { name: 'name', defaultValue: '' },
  { name: 'bindValue', defaultValue: '' },
  { name: 'bindType', defaultValue: '' },
  { name: 'dataType', defaultValue: DataTypeEnum.String },
  { name: 'description', defaultValue: '' },
  { name: 'require', defaultValue: false },
];

const optionsMapV2: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
  4: 'E',
  5: 'F',
  6: 'G',
  7: 'H',
  8: 'I',
  9: 'J',
  10: 'K',
  11: 'L',
  12: 'M',
  13: 'N',
  14: 'O',
  15: 'P',
  16: 'Q',
  17: 'R',
  18: 'S',
  19: 'T',
  20: 'U',
  21: 'V',
  22: 'W',
  23: 'X',
  24: 'Y',
  25: 'Z',
};

// ==================== 组件实现 ====================

/**
 * 通用的输入输出参数组件
 */
export const InputAndOutV2: React.FC<NodeRenderPropsV2> = ({
  title,
  fieldConfigs = outPutConfigsV2,
  form,
  inputItemName = 'inputArgs',
  showCopy = false,
  disabledAdd,
  disabledDelete,
  disabledInput,
  isLoop,
}) => {
  // 根据传递的fieldConfigs生成表单项
  const formItem = fieldConfigs.reduce(
    (acc: DefaultObjectType, field: FieldConfigV2) => {
      acc[field.name] = field.defaultValue ?? null;
      return acc;
    },
    {},
  );

  return (
    <div className="form-list-style-v2">
      <Form.List name={inputItemName}>
        {(fields, { add, remove }) => (
          <>
            <div className="dis-sb">
              <span className="node-title-style-v2 gap-6 flex items-center">
                {title}
              </span>
              {!disabledAdd && (
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => add(formItem)}
                  size="small"
                  type="text"
                />
              )}
            </div>
            {fields.map((item, index) => {
              const fieldValue = form.getFieldValue([
                inputItemName,
                item.name,
                'bindValueType',
              ]);
              return (
                <div key={item.name}>
                  {index === 0 && (
                    <div className="font-color-gray07 font-12 mt-6">
                      <span>参数名</span>
                      <span style={{ marginLeft: '22%' }}>变量值</span>
                    </div>
                  )}
                  <Form.Item key={item.key}>
                    <div className="dis-left">
                      <Form.Item
                        label="参数名"
                        name={[item.name, 'name']}
                        noStyle
                      >
                        <Input
                          size="small"
                          style={{ width: '30%', marginRight: '10px' }}
                          placeholder="请输入参数名"
                          disabled={disabledInput}
                        />
                      </Form.Item>
                      <Form.Item name={[item.name, 'bindValue']} noStyle>
                        <InputOrReference
                          form={form}
                          fieldName={[inputItemName, item.name, 'bindValue']}
                          style={{ flex: 1, marginRight: '10px' }}
                          referenceType={fieldValue}
                          isLoop={isLoop}
                        />
                      </Form.Item>
                      <Form.Item name={[item.name, 'bindType']} noStyle hidden>
                        <Input type="hidden" />
                      </Form.Item>
                      {showCopy && (
                        <Popover
                          content={
                            <Form.Item
                              name={[item.name, 'description']}
                              noStyle
                            >
                              <Input.TextArea
                                autoSize={{ minRows: 3, maxRows: 5 }}
                              />
                            </Form.Item>
                          }
                          trigger="click"
                        >
                          <Button
                            icon={<FileDoneOutlined />}
                            className="margin-right"
                            size="small"
                            type="text"
                          />
                        </Popover>
                      )}
                      {!disabledDelete && (
                        <Form.Item name={[item.name, 'require']} noStyle>
                          <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            type="text"
                            onClick={() => remove(item.name)}
                          />
                        </Form.Item>
                      )}
                    </div>
                  </Form.Item>
                </div>
              );
            })}
          </>
        )}
      </Form.List>
    </div>
  );
};

/**
 * 树结构的输出展示
 */
export const TreeOutputV2: React.FC<TreeOutputPropsV2> = ({ treeData }) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    const getAllParentKeys = (data: InputAndOutConfig[]): React.Key[] => {
      const keys: React.Key[] = [];
      data.forEach((node) => {
        if (node.subArgs && node.subArgs.length > 0) {
          keys.push(node.key);
          keys.push(...getAllParentKeys(node.subArgs));
        }
      });
      return keys;
    };
    setExpandedKeys(getAllParentKeys(treeData));
  }, [treeData]);

  const convertToTreeData = (data: InputAndOutConfig[]): any[] => {
    return data.map((item) => ({
      ...item,
      title: (
        <span>
          {item.name}{' '}
          <Tag color="#C9CDD4" style={{ marginLeft: '5px' }}>
            {DataTypeMap[item.dataType as DataTypeEnum]}
          </Tag>
        </span>
      ),
      children: item.subArgs ? convertToTreeData(item.subArgs) : undefined,
    }));
  };

  return (
    <Tree
      showLine
      expandedKeys={expandedKeys}
      onExpand={(keys) => setExpandedKeys(keys)}
      switcherIcon={<DownOutlined />}
      treeData={convertToTreeData(treeData)}
      defaultExpandAll={true}
    />
  );
};

/**
 * 通用 FormList 组件
 */
export const FormListV2: React.FC<FormListPropsV2> = ({
  form,
  title,
  field,
  inputItemName = 'inputArgs',
  showIndex,
  limitAddLength = -1,
}) => {
  const [disabledAdd, setDisabledAdd] = useState(false);
  const currentFields = Form.useWatch(inputItemName, {
    form,
    preserve: true,
  });

  useEffect(() => {
    if (limitAddLength > -1) {
      setDisabledAdd((currentFields?.length || 0) >= limitAddLength);
    }
  }, [currentFields, limitAddLength]);

  return (
    <Form.List name={inputItemName}>
      {(fields, { add, remove }) => (
        <>
          <div className="dis-sb margin-bottom">
            <span className="node-title-style-v2">{title}</span>
            <Button
              icon={<PlusOutlined />}
              size="small"
              type="text"
              disabled={disabledAdd}
              onClick={() => {
                const currentFields = form.getFieldValue(inputItemName) || [];
                const insertIndex = Math.max(0, currentFields.length - 1);
                add(
                  {
                    [field]: '',
                    index: currentFields.length,
                    nextNodeIds: [],
                    uuid: uuidv4(),
                  },
                  insertIndex,
                );
              }}
            />
          </div>
          {fields.map((item, index) => {
            let fieldData = false;
            if (
              form.getFieldValue([inputItemName, item.name, 'intentType']) ===
              'OTHER'
            ) {
              fieldData = true;
            }
            if (
              form.getFieldValue([inputItemName, item.name, 'content']) ===
              '此选项用户不可见，用户回复无关内容时走此分支'
            ) {
              fieldData = true;
            }

            return (
              <Form.Item key={item.name + '_' + optionsMapV2[index]}>
                <div className="dis-left">
                  {showIndex && (
                    <Form.Item noStyle name={[item.name, 'index']}>
                      <span className="mr-16">{optionsMapV2[index]}</span>
                    </Form.Item>
                  )}
                  <Form.Item name={[item.name, field]} className="flex-1">
                    <Input disabled={fieldData} />
                  </Form.Item>
                  {!fieldData && fields.length > 2 && (
                    <Form.Item noStyle>
                      <DeleteOutlined
                        className="ml-10"
                        onClick={() => remove(item.name)}
                      />
                    </Form.Item>
                  )}
                </div>
              </Form.Item>
            );
          })}
        </>
      )}
    </Form.List>
  );
};

/**
 * 其他输出变量 FormList
 */
export const OtherFormListV2: React.FC<NodeRenderPropsV2> = ({
  title,
  inputItemName = 'conditionArgs',
  disabledAdd,
  disabledDelete,
  disabledInput,
}) => {
  return (
    <>
      <Form.List name={inputItemName}>
        {(fields, { add, remove }) => (
          <>
            <div className="dis-sb margin-bottom">
              <span className="node-title-style-v2">{title}</span>
              {!disabledAdd && (
                <Button
                  icon={<PlusOutlined />}
                  size="small"
                  type="text"
                  onClick={() =>
                    add({
                      key: uuidv4(),
                      name: '',
                      bindValue: '',
                      dataType: DataTypeEnum.String,
                    })
                  }
                />
              )}
            </div>
            {fields.map((item, index) => {
              return (
                <div key={item.key}>
                  {index === 0 && (
                    <div className="font-color-gray07">
                      <span>参数名</span>
                      <span style={{ marginLeft: '20%' }}>变量值</span>
                    </div>
                  )}
                  <Form.Item key={item.key}>
                    <div className="dis-left">
                      <Form.Item
                        label="参数名"
                        name={[item.name, 'name']}
                        noStyle
                      >
                        <Input
                          size="small"
                          style={{ width: '30%', marginRight: '10px' }}
                          placeholder="请输入参数名"
                          disabled={disabledInput}
                        />
                      </Form.Item>
                      <Form.Item
                        label="变量名"
                        name={[item.name, 'bindValue']}
                        noStyle
                      >
                        <Input
                          placeholder="请输入参数值"
                          size="small"
                          style={{ width: '55%', marginRight: '10px' }}
                        />
                      </Form.Item>
                      {!disabledDelete && (
                        <Form.Item noStyle>
                          <DeleteOutlined onClick={() => remove(item.name)} />
                        </Form.Item>
                      )}
                    </div>
                  </Form.Item>
                </div>
              );
            })}
          </>
        )}
      </Form.List>
    </>
  );
};
