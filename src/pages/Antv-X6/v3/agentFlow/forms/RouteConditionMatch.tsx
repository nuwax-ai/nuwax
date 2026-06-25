/**
 * 路由分支「条件匹配」行：变量 + 运算符 + 值/变量切换 + 右侧输入
 */

import InputOrReference from '@/components/FormListItem/InputOrReference';
import { options as compareOptions } from '@/pages/Antv-X6/params';
import { t } from '@/services/i18nRuntime';
import type { FormInstance } from 'antd';
import { Form, Input, Segmented, Select } from 'antd';
import React, { useCallback } from 'react';
import { syncBranchConditionField } from '../adapters/routeConditionAdapter';

export interface RouteConditionMatchProps {
  form: FormInstance;
  /** intentConfigs Form.List 的 field.name */
  listFieldName: number;
  argMap?: Record<string, any>;
}

const ARG_INDEX = 0;

const RouteConditionMatch: React.FC<RouteConditionMatchProps> = ({
  form,
  listFieldName,
  argMap,
}) => {
  const basePath: (string | number)[] = [
    'intentConfigs',
    listFieldName,
    'conditionArgs',
    ARG_INDEX,
  ];

  const syncCondition = useCallback(() => {
    syncBranchConditionField(form, listFieldName, argMap);
  }, [form, listFieldName, argMap]);

  const secondBindValueType =
    Form.useWatch([...basePath, 'secondArg', 'bindValueType'], {
      form,
      preserve: true,
    }) || 'Input';

  const handleValueTypeChange = (val: string | number) => {
    const type = val === 'Reference' ? 'Reference' : 'Input';
    form.setFieldValue([...basePath, 'secondArg', 'bindValueType'], type);
    form.setFieldValue([...basePath, 'secondArg', 'bindValue'], '');
    syncCondition();
  };

  return (
    <div className="route-condition-match">
      <div className="route-condition-match__label">
        {t('PC.Pages.AgentFlowNode.routeConditionMatchLabel', '条件匹配')}
      </div>
      <div className="route-condition-match__row">
        <Form.Item
          name={[
            listFieldName,
            'conditionArgs',
            ARG_INDEX,
            'firstArg',
            'bindValue',
          ]}
          className="route-condition-match__var"
        >
          <InputOrReference
            form={form}
            referenceType="Reference"
            placeholder={t(
              'PC.Pages.AgentFlowNode.routeSelectVariablePlaceholder',
              '选择变量...',
            )}
            fieldName={[...basePath, 'firstArg', 'bindValue']}
            onReferenceSelect={syncCondition}
          />
        </Form.Item>

        <Form.Item
          name={[listFieldName, 'conditionArgs', ARG_INDEX, 'compareType']}
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
          onChange={handleValueTypeChange}
          options={[
            {
              label: t('PC.Pages.AgentFlowNode.routeConditionValue', '值'),
              value: 'Input',
            },
            {
              label: t('PC.Pages.AgentFlowNode.routeConditionVariable', '变量'),
              value: 'Reference',
            },
          ]}
        />

        <Form.Item
          name={[
            listFieldName,
            'conditionArgs',
            ARG_INDEX,
            'secondArg',
            'bindValue',
          ]}
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
                : t('PC.Pages.AgentFlowNode.routeConditionValue', '值')
            }
            fieldName={[...basePath, 'secondArg', 'bindValue']}
            onReferenceSelect={syncCondition}
          />
        </Form.Item>

        <Form.Item
          name={[
            listFieldName,
            'conditionArgs',
            ARG_INDEX,
            'secondArg',
            'bindValueType',
          ]}
          initialValue="Input"
          hidden
        >
          <Input />
        </Form.Item>
      </div>
    </div>
  );
};

export default RouteConditionMatch;
