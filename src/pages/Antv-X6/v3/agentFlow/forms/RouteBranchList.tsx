/**
 * 路由决策 - 路由分支卡片列表
 *
 * 末尾固定一条「其他意图」兜底分支（intentType:OTHER）：不可删、始终在最后、
 * 不展示描述/条件匹配。其余为用户分支（intentType:NORMAL）。
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
} from '../adapters/routeConditionAdapter';
import './RouteBranchList.less';
import RouteConditionMatch from './RouteConditionMatch';

const { TextArea } = Input;

export interface RouteBranchListProps {
  form: FormInstance;
}

const RouteBranchList: React.FC<RouteBranchListProps> = ({ form }) => {
  const intentConfigs =
    Form.useWatch('intentConfigs', { form, preserve: true }) || [];
  const hydratedRef = useRef(false);

  /** 加载历史数据：字段对齐 + 补全 conditionArgs + 确保末尾 OTHER 兜底分支（仅首次） */
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
    form.setFieldsValue({ intentConfigs: hydrateIntentConfigs(raw) });
    hydratedRef.current = true;
  }, [form]);

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
                // 新增用户分支插到末尾 OTHER 兜底分支之前
                add(
                  {
                    uuid: uuidv4(),
                    name: '',
                    intent: '',
                    intentType: 'NORMAL',
                    conditionType: 'AND',
                    conditionArgs: [createEmptyConditionArg()],
                    nextNodeIds: [],
                  },
                  Math.max(0, fields.length - 1),
                );
              }}
            >
              {t('PC.Pages.AgentFlowNode.routeAddBranch', '添加分支')}
            </Button>
          </div>

          {fields.map(({ key, name }, index) => {
            const isOther = intentConfigs[name]?.intentType === 'OTHER';

            // 「其他意图」兜底分支：固定名称、无描述/条件匹配、不可删
            if (isOther) {
              return (
                <div
                  key={key}
                  className="route-branch-card route-branch-card--other"
                >
                  <div className="route-branch-card__title-row">
                    <span className="route-branch-card__index">
                      {index + 1}
                    </span>
                    <span className="route-branch-card__other-name">
                      {t('PC.Pages.AgentFlowNode.routeOtherIntent', '其他意图')}
                    </span>
                  </div>
                  <Form.Item name={[name, 'uuid']} hidden preserve />
                  <Form.Item name={[name, 'intentType']} hidden preserve />
                  <Form.Item name={[name, 'nextNodeIds']} hidden preserve />
                </div>
              );
            }

            return (
              <div key={key} className="route-branch-card">
                <Button
                  type="text"
                  size="small"
                  className="route-branch-card__close"
                  icon={<CloseOutlined />}
                  onClick={() => remove(name)}
                />

                <div className="route-branch-card__title-row">
                  <span className="route-branch-card__index">{index + 1}</span>
                  <Form.Item
                    name={[name, 'name']}
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
                  name={[name, 'intent']}
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
                <Form.Item name={[name, 'intentType']} hidden preserve />
                <Form.Item name={[name, 'conditionType']} hidden preserve />
                <Form.Item name={[name, 'nextNodeIds']} hidden preserve />

                <RouteConditionMatch form={form} listFieldName={name} />
              </div>
            );
          })}
        </div>
      )}
    </Form.List>
  );
};

export default RouteBranchList;
