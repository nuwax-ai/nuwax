/**
 * 路由决策 - 路由分支卡片列表（对齐原型：序号徽标 + 标题 + 描述 + 条件匹配）
 */

import { t } from '@/services/i18nRuntime';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, Input } from 'antd';
import React, { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  createEmptyConditionArg,
  hydrateIntentConfigs,
  syncBranchConditionField,
} from '../adapters/routeConditionAdapter';
import './RouteBranchList.less';
import RouteConditionMatch from './RouteConditionMatch';

const { TextArea } = Input;

export interface RouteBranchListProps {
  form: FormInstance;
  argMap?: Record<string, any>;
}

const RouteBranchList: React.FC<RouteBranchListProps> = ({ form, argMap }) => {
  const intentConfigs = Form.useWatch('intentConfigs', {
    form,
    preserve: true,
  });
  const hydratedRef = useRef(false);

  /** 加载历史数据：补全 conditionArgs，并同步 condition（仅首次） */
  useEffect(() => {
    if (hydratedRef.current) return;
    const raw = form.getFieldValue('intentConfigs');
    if (!raw?.length) return;
    const needsHydrate = raw.some(
      (item: { conditionArgs?: unknown[] }) => !item?.conditionArgs?.length,
    );
    if (!needsHydrate) {
      hydratedRef.current = true;
      return;
    }
    const hydrated = hydrateIntentConfigs(raw, argMap);
    form.setFieldsValue({ intentConfigs: hydrated });
    hydratedRef.current = true;
  }, [form, argMap]);

  /** 编辑 conditionArgs 时同步 condition 字符串 */
  useEffect(() => {
    if (!intentConfigs?.length) return;
    intentConfigs.forEach((_: unknown, index: number) => {
      syncBranchConditionField(form, index, argMap);
    });
  }, [intentConfigs, form, argMap]);

  return (
    <Form.List name="intentConfigs">
      {(fields, { add, remove }) => (
        <div className="route-branch-list">
          <div className="route-branch-list__header">
            <span className="node-title-style">
              {t('PC.Pages.AgentFlowNode.routeBranchesTitle', '路由分支')}
            </span>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              className="route-branch-list__add-btn"
              onClick={() => {
                add({
                  uuid: uuidv4(),
                  intent: '',
                  description: '',
                  condition: '',
                  conditionArgs: [createEmptyConditionArg()],
                  nextNodeIds: [],
                });
              }}
            >
              {t('PC.Pages.AgentFlowNode.routeAddBranch', '添加分支')}
            </Button>
          </div>

          {fields.map(({ key, name }, index) => (
            <div key={key} className="route-branch-card">
              <Button
                type="text"
                size="small"
                className="route-branch-card__close"
                icon={<CloseOutlined />}
                onClick={() => remove(name)}
                disabled={fields.length <= 1}
              />

              <div className="route-branch-card__title-row">
                <span className="route-branch-card__index">{index + 1}</span>
                <Form.Item
                  name={[name, 'intent']}
                  className="route-branch-card__title-input"
                  rules={[{ required: true, max: 32 }]}
                >
                  <Input
                    bordered={false}
                    placeholder={t(
                      'PC.Pages.AgentFlowNode.routeDecisionRouteNamePlaceholder',
                      '分支名称',
                    )}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name={[name, 'description']}
                className="route-branch-card__desc"
              >
                <TextArea
                  rows={2}
                  placeholder={t(
                    'PC.Pages.AgentFlowNode.routeDecisionRouteDescriptionPlaceholder',
                    '什么情况下走这条分支...',
                  )}
                />
              </Form.Item>

              <Form.Item name={[name, 'uuid']} hidden preserve />
              <Form.Item name={[name, 'condition']} hidden preserve />
              <Form.Item name={[name, 'nextNodeIds']} hidden preserve />

              <RouteConditionMatch
                form={form}
                listFieldName={name}
                argMap={argMap}
              />
            </div>
          ))}
        </div>
      )}
    </Form.List>
  );
};

export default RouteBranchList;
