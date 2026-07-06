/**
 * 路由分支「条件匹配」：对齐条件节点——支持多条件 + AND/OR 连接。
 * 每行：变量 + 运算符 + 值（右操作数固定为字面值，不再提供「值/变量」切换）。
 *
 * IME：不订阅整个 conditionArgs；各行 memo + Form.Item 内部订阅，
 * 避免兄弟条件「值」输入时整表重渲染打断中文组合输入。
 */

import InputOrReference from '@/components/FormListItem/InputOrReference';
import { options as compareOptions } from '@/pages/Antv-X6/params';
import { t } from '@/services/i18nRuntime';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, Input, Select } from 'antd';
import React, { memo, useCallback, useRef } from 'react';
import { createEmptyConditionArg } from '../adapters/routeConditionAdapter';

export interface RouteConditionMatchProps {
  form: FormInstance;
  /** intentConfigs Form.List 的 field.name（分支索引） */
  listFieldName: number;
}

type ConditionArgRowProps = {
  form: FormInstance;
  listFieldName: number;
  fieldName: number;
  fieldsLength: number;
  onRemove: (name: number) => void;
};

/** 单条条件行：memo 隔离，值输入由 Form.Item 内部订阅表单 store */
const ConditionArgRow = memo(function ConditionArgRow({
  form,
  listFieldName,
  fieldName,
  fieldsLength,
  onRemove,
}: ConditionArgRowProps) {
  const base = [
    'intentConfigs',
    listFieldName,
    'conditionArgs',
    fieldName,
  ] as const;

  const handleRemove = useCallback(() => {
    onRemove(fieldName);
  }, [fieldName, onRemove]);

  return (
    <div className="route-condition-match__row">
      <Form.Item
        name={[fieldName, 'firstArg', 'bindValue']}
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
        name={[fieldName, 'compareType']}
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
        name={[fieldName, 'secondArg', 'bindValue']}
        className="route-condition-match__right"
      >
        <Input
          placeholder={t('PC.Pages.AgentFlowNode.routeConditionValue', '值')}
        />
      </Form.Item>

      {fieldsLength > 1 && (
        <DeleteOutlined
          className="route-condition-match__del"
          onClick={handleRemove}
        />
      )}
    </div>
  );
});

const RouteConditionMatch: React.FC<RouteConditionMatchProps> = ({
  form,
  listFieldName,
}) => {
  const removeRef = useRef<(name: number) => void>(() => {});
  const handleRemove = useCallback((name: number) => {
    removeRef.current(name);
  }, []);

  return (
    <div className="route-condition-match">
      <Form.List name={[listFieldName, 'conditionArgs']}>
        {(fields, { add, remove }) => {
          removeRef.current = remove;

          return (
            <>
              <div className="route-condition-match__head">
                <span className="route-condition-match__label">
                  {t(
                    'PC.Pages.AgentFlowNode.routeConditionMatchLabel',
                    '条件匹配',
                  )}
                </span>
                {fields.length > 1 && (
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                      prev.intentConfigs?.[listFieldName]?.conditionType !==
                      curr.intentConfigs?.[listFieldName]?.conditionType
                    }
                  >
                    {() => (
                      <Select
                        size="small"
                        className="route-condition-match__type"
                        value={
                          form.getFieldValue([
                            'intentConfigs',
                            listFieldName,
                            'conditionType',
                          ]) || 'AND'
                        }
                        onChange={(v) =>
                          form.setFieldValue(
                            ['intentConfigs', listFieldName, 'conditionType'],
                            v,
                          )
                        }
                        options={[
                          {
                            label: t('PC.Pages.AntvX6Condition.and', '且'),
                            value: 'AND',
                          },
                          {
                            label: t('PC.Pages.AntvX6Condition.or', '或'),
                            value: 'OR',
                          },
                        ]}
                      />
                    )}
                  </Form.Item>
                )}
              </div>

              {fields.map((field) => (
                <ConditionArgRow
                  key={field.key}
                  form={form}
                  listFieldName={listFieldName}
                  fieldName={field.name}
                  fieldsLength={fields.length}
                  onRemove={handleRemove}
                />
              ))}

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
          );
        }}
      </Form.List>
    </div>
  );
};

export default RouteConditionMatch;
