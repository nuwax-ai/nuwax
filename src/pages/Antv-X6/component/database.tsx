import Created from '@/components/Created';
import ExpandableInputTextarea from '@/components/ExpandTextArea';
import InputOrReference from '@/components/FormListItem/InputOrReference';
import CustomTree from '@/components/FormListItem/NestedForm';
import TreeInput from '@/components/FormListItem/TreeInput';
import DataTable from '@/components/Skill/database';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { InputItemNameEnum } from '@/types/enums/node';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Select, Space } from 'antd';
import React, { useState } from 'react';
import { useModel } from 'umi';
import { options, outPutConfigs } from '../params';
import { InputAndOut, TreeOutput } from './commonNode';

// 定义数据增，删，改的节点
const Database: React.FC<NodeDisposeProps> = ({ form, type }) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);
  const { setSkillChange, setIsModified } = useModel('workflow');

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

  // 新增技能
  const onAddedSkill = (item: CreatedNodeItem) => {
    setIsModified(true);
    setSkillChange(true);
    form.setFieldValue('tableId', item.targetId);
    form.setFieldValue('name', item.name);
    form.setFieldValue('description', item.description);
    form.setFieldValue('icon', item.icon || '');
    form.submit();
    setOpen(false);
  };

  // 打开自动生成弹窗
  const onOpenCreated = () => {
    // setOpen(true);
    console.log('打开自动生成弹窗');
  };

  // 移出技能
  const removeItem = () => {
    form.setFieldValue('tableId', 0);
    form.submit();
  };
  //   显示新增技能
  const showAdd = () => {
    setOpen(true);
  };

  console.log(form.getFieldsValue(true));

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
            {type === 'TableDataDelete' ? '删除条件' : '更新条件'}
          </p>
          <Form.Item>
            <Space>
              {form.getFieldValue('conditionArgs')?.length > 1 && (
                <Form.Item
                  name={'conditionType'}
                  style={{ marginTop: '-26px' }}
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
              )}
              <Form.List
                name={'conditionArgs'}
                initialValue={defautlConditionArgs}
              >
                {(subFields, subOpt) => {
                  return (
                    <div className="position-relative">
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
                                    options={options}
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
                                      style={{
                                        width: subFields.length > 1 ? 150 : 180,
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
                                        width: subFields.length > 1 ? 150 : 180,
                                      }}
                                      fieldName={[
                                        'conditionBranchConfigs',
                                        subField.name,
                                        'secondArg',
                                        'bindValue',
                                      ]}
                                    />
                                  </Form.Item>
                                </div>
                                {subFields.length > 1 && (
                                  <Button
                                    type="text"
                                    icon={<MinusCircleOutlined />}
                                    onClick={() => {
                                      subOpt.remove(subField.name);
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
      {type !== 'TableDataDelete' && type !== 'TableSQL' && (
        <div className="node-item-style">
          <TreeInput
            title={type === 'TableDataAdd' ? '输入' : '选择更新字段'}
            form={form}
            params={form.getFieldValue('inputArgs')}
          />
        </div>
      )}
      {/* 数据表 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom ">
          <span className="node-title-style">数据表</span>
          <Button
            icon={<PlusOutlined />}
            size={'small'}
            onClick={showAdd}
            type="text"
            disabled={form.getFieldValue('tableId')}
          ></Button>
        </div>
        {form.getFieldValue('tableId') ? (
          <DataTable
            icon={form.getFieldValue('icon')}
            name={form.getFieldValue('name')}
            description={form.getFieldValue('description')}
            handleDelete={removeItem}
            params={['123', '456']}
            showParams={type === 'TableSQL'}
          />
        ) : null}
      </div>
      {/* SQL */}
      {type === 'TableSQL' && (
        <div className="node-item-style">
          <ExpandableInputTextarea
            title="SQL"
            inputFieldName="systemPrompt"
            // onExpand
            onOptimize
            onOptimizeClick={onOpenCreated}
            placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
          />
        </div>
      )}
      {/* <Form.Item>
        {() =>
          form.getFieldValue('tableFields') ? (
            <div className="node-item-style">
              <DataTable
                icon={''}
                name={form.getFieldValue('name')}
                description={form.getFieldValue('description')}
                handleDelete={removeItem}
              />
            </div>
          ) : (
            <Empty />
          )
        }
      </Form.Item> */}
      {/* 输出参数 */}
      {type === 'TableSQL' || type === 'TableDataQuery' ? (
        <Form.Item name={'inputArgs'}>
          <CustomTree
            title={'输出'}
            inputItemName={'outputArgs'}
            params={form.getFieldValue('outputArgs') || []} // 改为直接读取表单最新值
            form={form}
            showCheck
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

      <Created
        checkTag={AgentComponentTypeEnum.Table}
        onAdded={onAddedSkill}
        open={open}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
};

export default Database;
