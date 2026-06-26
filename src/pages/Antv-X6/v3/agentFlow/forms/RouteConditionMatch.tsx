/**
 * 路由分支「条件匹配」：对齐条件节点——支持多条件 + AND/OR 连接。
 * 每行：变量 + 运算符 + 值/变量切换 + 右侧输入；多条件时顶部显示 AND/OR 选择。
 * 结构化 conditionArgs/conditionType 编辑，变更时同步序列化到 condition 字符串。
 */

import InputOrReference from '@/components/FormListItem/InputOrReference';
import { options as compareOptions } from '@/pages/Antv-X6/params';
import { t } from '@/services/i18nRuntime';
import { DeleteOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Form, Input, Segmented, Select } from 'antd';
import React, { useCallback } from 'react';
import { syncBranchConditionField } from '../adapters/routeConditionAdapter';

export interface RouteConditionMatchProps {
  form: FormInstance;
  /** intentConfigs Form.List 的 field.name（分支索引） */
  listFieldName: number;
  argMap?: Record<string, any>;
}

const RouteConditionMatch: React.FC<RouteConditionMatchProps> = ({
  form,
  listFieldName,
  argMap,
}) => {
  const syncCondition = useCallback(() => {
    syncBranchConditionField(form, listFieldName, argMap);
  }, [form, listFieldName, argMap]);

  const conditionArgs =
    Form.useWatch(['intentConfigs', listFieldName, 'conditionArgs'], {
      form,
      preserve: true,
    }) || [];

  const conditionType =
    Form.useWatch(['intentConfigs', listFieldName, 'conditionType'], {
      form,
      preserve: true,
    }) || 'AND';

  const handleValueTypeChange = (argIndex: number, val: string | number) => {
    const type = val === 'Reference' ? 'Reference' : 'Input';
    const base = ['intentConfigs', listFieldName, 'conditionArgs', argIndex];
    form.setFieldValue([...base, 'secondArg', 'bindValueType'], type);
    form.setFieldValue([...base, 'secondArg', 'bindValue'], '');
    syncCondition();
  };

  return (
    <div className="route-condition-match">
      <div className="route-condition-match__head">
        <span className="route-condition-match__label">
          {t('PC.Pages.AgentFlowNode.routeConditionMatchLabel', '条件匹配')}
        </span>
        {conditionArgs.length > 1 && (
          <Select
            size="small"
            className="route-condition-match__type"
            value={conditionType}
            onChange={(v) => {
              form.setFieldValue(
                ['intentConfigs', listFieldName, 'conditionType'],
                v,
              );
              syncCondition();
            }}
            options={[
              { label: t('PC.Pages.AntvX6Condition.and', '且'), value: 'AND' },
              { label: t('PC.Pages.AntvX6Condition.or', '或'), value: 'OR' },
            ]}
          />
        )}
      </div>

      <Form.List name={[listFieldName, 'conditionArgs']}>
        {(fields, { remove }) => (
          <>
            {fields.map((field, argIndex) => {
              const base = [
                'intentConfigs',
                listFieldName,
                'conditionArgs',
                field.name,
              ];
              const secondBindValueType =
                conditionArgs[argIndex]?.secondArg?.bindValueType || 'Input';
              return (
                <div key={field.key} className="route-condition-match__row">
                  <Form.Item
                    name={[field.name, 'firstArg', 'bindValue']}
                    className="route-condition-match__var"
                  >
                    <InputOrReference
                      form={form}
                      referenceType="Reference"
                      placeholder={t(
                        'PC.Pages.AgentFlowNode.routeSelectVariablePlaceholder',
                        '选择变量...',
                      )}
                      fieldName={[...base, 'firstArg', 'bindValue']}
                      onReferenceSelect={syncCondition}
                    />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'compareType']}
                    initialValue="EQUAL"
                    className="route-condition-match__op"
                  >
                    <Select
                      popupMatchSelectWidth={false}
                      options={compareOptions}
                      optionLabelProp="displayValue"
                      onChange={syncCondition}
                    />
                  </Form.Item>

                  <Segmented
                    className="route-condition-match__segmented"
                    size="small"
                    value={secondBindValueType}
                    onChange={(v) => handleValueTypeChange(field.name, v)}
                    options={[
                      {
                        label: t(
                          'PC.Pages.AgentFlowNode.routeConditionValue',
                          '值',
                        ),
                        value: 'Input',
                      },
                      {
                        label: t(
                          'PC.Pages.AgentFlowNode.routeConditionVariable',
                          '变量',
                        ),
                        value: 'Reference',
                      },
                    ]}
                  />

                  <Form.Item
                    name={[field.name, 'secondArg', 'bindValue']}
                    className="route-condition-match__right"
                  >
                    <InputOrReference
                      form={form}
                      referenceType={secondBindValueType}
                      placeholder={
                        secondBindValueType === 'Reference'
                          ? t(
                              'PC.Pages.AgentFlowNode.routeSelectVariablePlaceholder',
                              '选择变量...',
                            )
                          : t(
                              'PC.Pages.AgentFlowNode.routeConditionValue',
                              '值',
                            )
                      }
                      fieldName={[...base, 'secondArg', 'bindValue']}
                      onReferenceSelect={syncCondition}
                    />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'secondArg', 'bindValueType']}
                    initialValue="Input"
                    hidden
                  >
                    <Input />
                  </Form.Item>

                  {fields.length > 1 && (
                    <DeleteOutlined
                      className="route-condition-match__del"
                      onClick={() => {
                        remove(field.name);
                        syncCondition();
                      }}
                    />
                  )}
                </div>
              );
            })}
          </>
        )}
      </Form.List>
    </div>
  );
};

export default RouteConditionMatch;
