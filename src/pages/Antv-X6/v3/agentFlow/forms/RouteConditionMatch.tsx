/**
 * 路由分支「条件匹配」：对齐条件节点——支持多条件 + AND/OR 连接。
 * 每行：变量 + 运算符 + 值（右操作数固定为字面值，不再提供「值/变量」切换）。
 * 直接编辑 conditionArgs（已废弃 condition 字符串，无需同步）。
 */

import InputOrReference from '@/components/FormListItem/InputOrReference';
import { options as compareOptions } from '@/pages/Antv-X6/params';
import { t } from '@/services/i18nRuntime';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, Input, Select } from 'antd';
import React, { useEffect } from 'react';
import { createEmptyConditionArg } from '../adapters/routeConditionAdapter';

export interface RouteConditionMatchProps {
  form: FormInstance;
  /** intentConfigs Form.List 的 field.name（分支索引） */
  listFieldName: number;
}

const RouteConditionMatch: React.FC<RouteConditionMatchProps> = ({
  form,
  listFieldName,
}) => {
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

  // conditionType 的 AND/OR 选项只在用户切换时写回表单，默认值 'AND' 不会被持久化，
  // 导致保存的 intentConfigs 缺少 conditionType。这里在字段为空时补默认 'AND'。
  useEffect(() => {
    const fieldPath = ['intentConfigs', listFieldName, 'conditionType'];
    if (!form.getFieldValue(fieldPath)) {
      form.setFieldValue(fieldPath, 'AND');
    }
  }, [form, listFieldName]);

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
            onChange={(v) =>
              form.setFieldValue(
                ['intentConfigs', listFieldName, 'conditionType'],
                v,
              )
            }
            options={[
              { label: t('PC.Pages.AntvX6Condition.and', '且'), value: 'AND' },
              { label: t('PC.Pages.AntvX6Condition.or', '或'), value: 'OR' },
            ]}
          />
        )}
      </div>

      <Form.List name={[listFieldName, 'conditionArgs']}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => {
              const base = [
                'intentConfigs',
                listFieldName,
                'conditionArgs',
                field.name,
              ];
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
                    />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'secondArg', 'bindValue']}
                    className="route-condition-match__right"
                  >
                    <Input
                      placeholder={t(
                        'PC.Pages.AgentFlowNode.routeConditionValue',
                        '值',
                      )}
                    />
                  </Form.Item>

                  {fields.length > 1 && (
                    <DeleteOutlined
                      className="route-condition-match__del"
                      onClick={() => remove(field.name)}
                    />
                  )}
                </div>
              );
            })}

            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              className="route-condition-match__add"
              onClick={() => add(createEmptyConditionArg())}
            >
              {t('PC.Pages.AgentFlowNode.routeAddCondition', '添加条件')}
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default RouteConditionMatch;
