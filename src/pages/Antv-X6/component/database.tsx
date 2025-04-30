import ExpandableInputTextarea from '@/components/ExpandTextArea';
import InputOrReference from '@/components/FormListItem/InputOrReference';
import CustomTree from '@/components/FormListItem/NestedForm';
import TreeInput from '@/components/FormListItem/TreeInput';
import Optimize from '@/components/Optimize';
import DataTable from '@/components/Skill/database';
import { InputItemNameEnum } from '@/types/enums/node';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Form, InputNumber, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { outPutConfigs, tableOptions } from '../params';
import { InputAndOut, TreeOutput } from './commonNode';

// 定义数据增，删，改的节点
const Database: React.FC<NodeDisposeProps> = ({ form, type }) => {
  const [open, setOpen] = useState(false); // 自动生成sql的弹窗

  const { setIsModified } = useModel('workflow');

  const defautlConditionArgs = [
    {
      firstArg: {
        bindValue: null,
        bindValueType: null,
      },
      secondArg: {
        bindValue: null,
        bindValueType: null,
      },
      compareType: null,
    },
    {
      firstArg: {
        bindValue: null,
        bindValueType: null,
      },
      secondArg: {
        bindValue: null,
        bindValueType: null,
      },
      compareType: null,
    },
  ];

  // 打开自动生成弹窗
  const onOpenCreated = () => {
    setOpen(true);
    console.log('打开自动生成弹窗');
  };

  useEffect(() => {
    if (!form.getFieldValue('conditionType')) {
      form.setFieldValue('conditionType', 'AND');
    }
  }, [form.getFieldValue('conditionType')]);

  return (
    <div>
      {/* 输入 */}
      {type === 'TableSQL' && (
        <div className="node-item-style">
          <InputAndOut
            title="输入"
            fieldConfigs={outPutConfigs}
            inputItemName={InputItemNameEnum.inputArgs}
            form={form}
          />
        </div>
      )}
      {/* 条件 */}
      {type !== 'TableDataAdd' && type !== 'TableSQL' && (
        <div className="node-item-style">
          <p className="node-title-style">
            {type === 'TableDataDelete'
              ? '删除条件'
              : type === 'TableDataUpdate'
              ? '更新条件'
              : '查询条件'}
          </p>
          <Form.Item>
            <Space>
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) =>
                  prev.conditionArgs !== curr.conditionArgs
                }
              >
                {({ getFieldValue }) => {
                  const conditionArgs = getFieldValue('conditionArgs');

                  return (
                    conditionArgs?.length > 1 && (
                      <Form.Item
                        name={'conditionType'}
                        style={{ marginTop: '-26px' }}
                        initialValue="AND"
                      >
                        <Select
                          style={{
                            marginRight: '4px',
                            width: 54,
                          }}
                          options={[
                            {
                              label: '且',
                              value: 'AND',
                            },
                            {
                              label: '或',
                              value: 'OR',
                            },
                          ]}
                        />
                      </Form.Item>
                    )
                  );
                }}
              </Form.Item>
              <Form.List
                name={'conditionArgs'}
                initialValue={defautlConditionArgs}
              >
                {(subFields, subOpt) => {
                  return (
                    <div className="position-relative">
                      {subFields.length >= 1 ? (
                        <div className="dis-left">
                          <div className="dis-col">
                            {subFields.map((subField) => {
                              const bindValueType = form.getFieldValue([
                                'conditionArgs',
                                subField.name,
                                'secondArg',
                                'bindValueType',
                              ]);
                              return (
                                <div key={subField.name} className="dis-sb">
                                  <Form.Item
                                    name={[subField.name, 'compareType']}
                                    noStyle
                                  >
                                    <Select
                                      popupMatchSelectWidth={false}
                                      options={tableOptions}
                                      optionLabelProp="displayValue"
                                      style={{
                                        marginRight: '10px',
                                        width: 54,
                                      }}
                                    ></Select>
                                  </Form.Item>
                                  <div>
                                    <Form.Item
                                      name={[
                                        subField.name,
                                        'firstArg',
                                        'bindValue',
                                      ]}
                                    >
                                      <Select
                                        placeholder="请选择"
                                        options={form.getFieldValue(
                                          'tableFields',
                                        )}
                                        fieldNames={{
                                          label: 'name',
                                          value: 'key',
                                        }}
                                        style={{
                                          width:
                                            subFields.length > 1 ? 150 : 180,
                                        }}
                                      />
                                    </Form.Item>
                                    <Form.Item
                                      name={[
                                        subField.name,
                                        'secondArg',
                                        'bindValue',
                                      ]}
                                    >
                                      <InputOrReference
                                        form={form}
                                        referenceType={bindValueType}
                                        style={{
                                          width:
                                            subFields.length > 1 ? 150 : 180,
                                        }}
                                        fieldName={[
                                          'conditionArgs',
                                          subField.name,
                                          'secondArg',
                                          'bindValue',
                                        ]}
                                      />
                                    </Form.Item>
                                  </div>
                                  <Button
                                    type="text"
                                    icon={<MinusCircleOutlined />}
                                    onClick={() => {
                                      subOpt.remove(subField.name);
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <Empty description={'当前查询数据为空'} />
                      )}

                      <Button
                        type="primary"
                        onClick={() => {
                          subOpt.add({
                            compareType: 'EQUAL',
                            firstArg: null,
                            secondArg: null,
                          });
                        }}
                        icon={<PlusOutlined />}
                      >
                        添加条件
                      </Button>
                    </div>
                  );
                }}
              </Form.List>
            </Space>
          </Form.Item>
        </div>
      )}
      {/* 更新字段 */}
      {(type === 'TableDataAdd' || type === 'TableDataUpdate') && (
        <div className="node-item-style">
          <TreeInput
            title={type === 'TableDataAdd' ? '输入' : '选择更新字段'}
            form={form}
            options={form.getFieldValue('tableFields') || []}
            showAdd={type === 'TableDataUpdate'}
            params={form.getFieldValue('inputArgs') || []}
          />
        </div>
      )}
      {type === 'TableDataQuery' && (
        <div className="node-item-style">
          <div className=" margin-bottom">
            <span className="node-title-style ">查询上限</span>
          </div>
          <Form.Item name="limit">
            <InputNumber min={1} max={1000} placeholder="请输入查询上限" />
          </Form.Item>
        </div>
      )}
      {/* 数据表 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom ">
          <span className="node-title-style">数据表</span>
        </div>
        {form.getFieldValue('tableId') ? (
          <DataTable
            icon={form.getFieldValue('icon')}
            name={form.getFieldValue('name')}
            description={form.getFieldValue('description')}
            params={
              form
                .getFieldValue('tableFields')
                .map((item: InputAndOutConfig) => item.name) || []
            }
            showParams={type === 'TableSQL'}
          />
        ) : null}
      </div>
      {/* SQL */}
      {type === 'TableSQL' && (
        <div className="node-item-style">
          <ExpandableInputTextarea
            title="SQL"
            inputFieldName="sql"
            onExpand
            onOptimize
            onOptimizeClick={onOpenCreated}
            placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
          />
        </div>
      )}

      {/* 输出参数 */}
      {type === 'TableSQL' || type === 'TableDataQuery' ? (
        <Form.Item name={'inputArgs'}>
          <CustomTree
            title={'输出'}
            inputItemName={'outputArgs'}
            params={form.getFieldValue('outputArgs') || []} // 改为直接读取表单最新值
            form={form}
            showCheck
            isNotAdd
          />
        </Form.Item>
      ) : (
        <Form.Item shouldUpdate>
          {() =>
            form.getFieldValue('outputArgs') && (
              <>
                <div className="node-title-style margin-bottom">输出</div>
                <TreeOutput treeData={form.getFieldValue('outputArgs')} />
              </>
            )
          }
        </Form.Item>
      )}
      <Optimize
        title="生成sql语句"
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        onReplace={(newValue?: string) => {
          if (!newValue) return;
          let text = newValue;
          if (text.includes('```')) {
            text = text.replace(/```/g, '');
          }
          console.log('text', text);
          // 只取第二个SQL语句
          const finalSql = text.startsWith('sql')
            ? text.replace('sql', '').trim()
            : text.trim();
          form.setFieldsValue({ sql: finalSql || '' });
          setIsModified(true);
        }}
        optimizeType="sql"
        tableId={form.getFieldValue('tableId')}
      />
    </div>
  );
};

export default Database;
