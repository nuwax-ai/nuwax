/**
 * V2 数据库节点配置组件
 *
 * 支持数据表增删改查、SQL 节点配置
 * 完全独立，不依赖 V1
 */

import ExpandableInputTextarea from '@/components/ExpandTextArea';
import InputOrReference from '@/components/FormListItem/InputOrReference';
import CustomTree from '@/components/FormListItem/NestedForm';
import TreeInput from '@/components/FormListItem/TreeInput';
import DataTable from '@/components/Skill/database';
import SqlOptimizeModal from '@/components/SqlOptimizeModal';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { InputItemNameEnum } from '@/types/enums/node';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Empty,
  Form,
  FormInstance,
  InputNumber,
  Select,
  Space,
} from 'antd';
import React, { useEffect, useState } from 'react';

import type { NodeConfigV2 } from '../../../types';
import { InputAndOutV2, TreeOutputV2, outPutConfigsV2 } from './commonNodeV2';

import './DatabaseNodeV2.less';

// ==================== 类型定义 ====================

export interface DatabaseNodeV2Props {
  form: FormInstance;
  nodeConfig?: NodeConfigV2;
  id: number;
  type: string;
  referenceData?: any;
}

// ==================== 常量配置 ====================

const tableOptions = [
  { label: '等于', value: 'EQUAL', displayValue: '=' },
  { label: '不等于', value: 'NOT_EQUAL', displayValue: '≠' },
  { label: '大于', value: 'GREATER_THAN', displayValue: '>' },
  { label: '大于等于', value: 'GREATER_THAN_OR_EQUAL', displayValue: '≥' },
  { label: '小于', value: 'LESS_THAN', displayValue: '<' },
  { label: '小于等于', value: 'LESS_THAN_OR_EQUAL', displayValue: '≤' },
  { label: '属于', value: 'IN', displayValue: '⊃' },
  { label: '不属于', value: 'NOT_IN', displayValue: '⊅' },
  { label: '为空', value: 'IS_NULL', displayValue: '∅' },
  { label: '不为空', value: 'NOT_NULL', displayValue: '!∅' },
];

const defaultConditionArgs = [
  {
    firstArg: { bindValue: null, bindValueType: null },
    secondArg: { bindValue: null, bindValueType: null },
    compareType: null,
  },
  {
    firstArg: { bindValue: null, bindValueType: null },
    secondArg: { bindValue: null, bindValueType: null },
    compareType: null,
  },
];

// ==================== 组件实现 ====================

const DatabaseNodeV2: React.FC<DatabaseNodeV2Props> = ({
  form,
  type,
  nodeConfig,
  id,
  referenceData,
}) => {
  const [open, setOpen] = useState(false); // 自动生成sql的弹窗

  // 获取输入参数
  const inputArgs =
    Form.useWatch(InputItemNameEnum.inputArgs, {
      form,
      preserve: true,
    }) || [];

  // 打开自动生成弹窗
  const onOpenCreated = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (!form.getFieldValue('conditionType')) {
      form.setFieldValue('conditionType', 'AND');
    }
  }, [form.getFieldValue('conditionType')]);

  return (
    <div className="database-node-v2">
      {/* 输入 - TableSQL 节点 */}
      {type === 'TableSQL' && (
        <div className="node-item-style-v2">
          <InputAndOutV2
            title="输入"
            fieldConfigs={outPutConfigsV2}
            inputItemName={InputItemNameEnum.inputArgs}
            form={form}
          />
        </div>
      )}

      {/* 条件 - 非 TableDataAdd 和 TableSQL 节点 */}
      {type !== 'TableDataAdd' && type !== 'TableSQL' && (
        <div className="node-item-style-v2">
          <p className="node-title-style-v2">
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
                          style={{ marginRight: '4px', width: 54 }}
                          options={[
                            { label: '且', value: 'AND' },
                            { label: '或', value: 'OR' },
                          ]}
                        />
                      </Form.Item>
                    )
                  );
                }}
              </Form.Item>
              <Form.List
                name={'conditionArgs'}
                initialValue={defaultConditionArgs}
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
                                      style={{ marginRight: '10px', width: 54 }}
                                    />
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
                                    onClick={() => subOpt.remove(subField.name)}
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

      {/* 更新字段 - TableDataAdd 和 TableDataUpdate 节点 */}
      {(type === 'TableDataAdd' || type === 'TableDataUpdate') && (
        <div className="node-item-style-v2">
          <TreeInput
            title={type === 'TableDataAdd' ? '输入' : '选择更新字段'}
            form={form}
            options={form.getFieldValue('tableFields') || []}
            showAdd={type === 'TableDataUpdate'}
            params={form.getFieldValue('inputArgs') || []}
            showDelete={type === 'TableDataUpdate'}
            descText="变量值"
          />
        </div>
      )}

      {/* 查询上限 - TableDataQuery 节点 */}
      {type === 'TableDataQuery' && (
        <div className="node-item-style-v2">
          <div className="margin-bottom">
            <span className="node-title-style-v2">查询上限</span>
          </div>
          <Form.Item name="limit">
            <InputNumber min={1} max={1000} placeholder="请输入查询上限" />
          </Form.Item>
        </div>
      )}

      {/* 数据表 */}
      <div className="node-item-style-v2">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style-v2">数据表</span>
        </div>
        {form.getFieldValue('tableId') ? (
          <DataTable
            icon={form.getFieldValue('icon')}
            name={form.getFieldValue('name')}
            description={form.getFieldValue('description')}
            params={
              form
                .getFieldValue('tableFields')
                ?.map((item: InputAndOutConfig) => item.name) || []
            }
            showParams={type === 'TableSQL'}
          />
        ) : null}
      </div>

      {/* SQL - TableSQL 节点 */}
      {type === 'TableSQL' && (
        <div className="node-item-style-v2">
          <ExpandableInputTextarea
            title="SQL"
            inputFieldName="sql"
            onExpand
            onOptimize
            onOptimizeClick={onOpenCreated}
            placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
            variables={transformToPromptVariables(
              inputArgs.filter(
                (item: InputAndOutConfig) =>
                  !['', null, undefined].includes(item.name),
              ),
              referenceData?.argMap,
            )}
          />
        </div>
      )}

      {/* 输出参数 */}
      {type === 'TableSQL' || type === 'TableDataQuery' ? (
        <Form.Item name={'inputArgs'}>
          <CustomTree
            key={`${type}-${id}-outputArgs`}
            title={'输出'}
            inputItemName={'outputArgs'}
            params={(nodeConfig?.outputArgs || []) as any}
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
                <div className="node-title-style-v2 margin-bottom">输出</div>
                <TreeOutputV2 treeData={form.getFieldValue('outputArgs')} />
              </>
            )
          }
        </Form.Item>
      )}

      {/* SQL 生成弹窗 */}
      <SqlOptimizeModal
        title="生成sql语句"
        open={open}
        onCancel={() => setOpen(false)}
        onReplace={(newValue?: string) => {
          if (!newValue) return;
          let text = newValue;
          if (text.includes('```')) {
            text = text.replace(/```/g, '');
          }
          const finalSql = text.startsWith('sql')
            ? text.replace('sql', '').trim()
            : text.trim();
          form.setFieldsValue({ sql: finalSql || '' });
        }}
        tableId={form.getFieldValue('tableId')}
        inputArgs={form.getFieldValue('inputArgs')}
      />
    </div>
  );
};

export default DatabaseNodeV2;
