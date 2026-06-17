import ExpandableInputTextarea from '@/components/ExpandTextArea';
import InputOrReference from '@/components/FormListItem/InputOrReference';
import CustomTree from '@/components/FormListItem/NestedForm';
import TreeInput from '@/components/FormListItem/TreeInput';
import DataTable from '@/components/Skill/database';
import SqlOptimizeModal from '@/components/SqlOptimizeModal';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { t } from '@/services/i18nRuntime';
import { InputItemNameEnum } from '@/types/enums/node';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Form, InputNumber, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { outPutConfigs, tableOptions } from '../ParamsV3';
import { InputAndOut, TreeOutput } from './commonNode';

// Node config panel for add/update/delete/query data-table operations.
const Database: React.FC<NodeDisposeProps> = ({
  form,
  type,
  nodeConfig,
  id,
}) => {
  const [open, setOpen] = useState(false); // Auto SQL generation modal state.

  const { setIsModified, referenceList } = useModel('workflowV3');

  const defaultConditionArgs = [
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

  // Read input args at top-level to avoid hook usage in conditional branches.
  const inputArgs =
    Form.useWatch(InputItemNameEnum.inputArgs, {
      form,
      preserve: true,
    }) || [];

  // Open SQL generation modal.
  const onOpenCreated = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (!form.getFieldValue('conditionType')) {
      form.setFieldValue('conditionType', 'AND');
    }
  }, [form.getFieldValue('conditionType')]);

  return (
    <div>
      {/* Input */}
      {type === 'TableSQL' && (
        <div className="node-item-style">
          <InputAndOut
            title={t('PC.Pages.AntvX6Data.input')}
            fieldConfigs={outPutConfigs}
            inputItemName={InputItemNameEnum.inputArgs}
            form={form}
          />
        </div>
      )}
      {/* Conditions */}
      {type !== 'TableDataAdd' && type !== 'TableSQL' && (
        <div className="node-item-style">
          <p className="node-title-style">
            {type === 'TableDataDelete'
              ? t('PC.Pages.AntvX6Database.deleteCondition')
              : type === 'TableDataUpdate'
              ? t('PC.Pages.AntvX6Database.updateCondition')
              : t('PC.Pages.AntvX6Database.queryCondition')}
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
                              label: t('PC.Pages.AntvX6Database.and'),
                              value: 'AND',
                            },
                            {
                              label: t('PC.Pages.AntvX6Database.or'),
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
                                        placeholder={t(
                                          'PC.Pages.AntvX6Database.selectPlaceholder',
                                        )}
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
                        <Empty
                          description={t(
                            'PC.Pages.AntvX6Database.emptyConditionData',
                          )}
                        />
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
                        {t('PC.Pages.AntvX6Database.addCondition')}
                      </Button>
                    </div>
                  );
                }}
              </Form.List>
            </Space>
          </Form.Item>
        </div>
      )}
      {/* Update fields */}
      {(type === 'TableDataAdd' || type === 'TableDataUpdate') && (
        <div className="node-item-style">
          <TreeInput
            title={
              type === 'TableDataAdd'
                ? t('PC.Pages.AntvX6Data.input')
                : t('PC.Pages.AntvX6Database.selectUpdateFields')
            }
            form={form}
            options={form.getFieldValue('tableFields') || []}
            showAdd={type === 'TableDataUpdate'}
            params={form.getFieldValue('inputArgs') || []}
            showDelete={type === 'TableDataUpdate'}
            descText={t('PC.Pages.AntvX6Database.variableValue')}
          />
        </div>
      )}
      {type === 'TableDataQuery' && (
        <div className="node-item-style">
          <div className=" margin-bottom">
            <span className="node-title-style ">
              {t('PC.Pages.AntvX6Database.queryLimit')}
            </span>
          </div>
          <Form.Item name="limit">
            <InputNumber
              min={1}
              max={1000}
              placeholder={t('PC.Pages.AntvX6Database.queryLimitPlaceholder')}
            />
          </Form.Item>
        </div>
      )}
      {/* Data table */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom ">
          <span className="node-title-style">
            {t('PC.Pages.AntvX6Database.table')}
          </span>
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
            placeholder={t('PC.Pages.AntvX6Database.sqlPlaceholder')}
            variables={transformToPromptVariables(
              inputArgs.filter(
                (item: InputAndOutConfig) =>
                  !['', null, undefined].includes(item.name),
              ),
              referenceList?.argMap,
            )}
          />
        </div>
      )}

      {/* Output arguments */}
      {type === 'TableSQL' || type === 'TableDataQuery' ? (
        <Form.Item name={'inputArgs'}>
          {/* TODO: this output field key may need adjustment (`inputArgs`). */}
          <CustomTree
            key={`${type}-${id}-outputArgs`}
            title={t('PC.Pages.AntvX6Data.output')}
            inputItemName={'outputArgs'}
            params={nodeConfig?.outputArgs || []}
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
                <div className="node-title-style margin-bottom">
                  {t('PC.Pages.AntvX6Data.output')}
                </div>
                <TreeOutput treeData={form.getFieldValue('outputArgs')} />
              </>
            )
          }
        </Form.Item>
      )}
      <SqlOptimizeModal
        title={t('PC.Pages.AntvX6Database.generateSqlTitle')}
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
          // Keep the second SQL statement only.
          const finalSql = text.startsWith('sql')
            ? text.replace('sql', '').trim()
            : text.trim();
          form.setFieldsValue({ sql: finalSql || '' });
          setIsModified(true);
        }}
        tableId={form.getFieldValue('tableId')}
        inputArgs={form.getFieldValue('inputArgs')}
      />
    </div>
  );
};

export default Database;
