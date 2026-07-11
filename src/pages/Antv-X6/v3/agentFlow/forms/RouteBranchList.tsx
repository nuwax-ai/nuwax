/**
 * 路由决策 - 路由分支卡片列表
 *
 * 末尾固定一条「其他意图」兜底分支（intentType:OTHER）：不可删、始终在最后、
 * 不展示描述/条件匹配。其余为用户分支（intentType:NORMAL）。
 *
 * IME：避免 Form.useWatch('intentConfigs') 整表订阅导致任一分支输入时全量重渲染打断中文组合输入；
 * 各卡片仅 watch 自身 intentType，并用 memo + 稳定 onRemove 减少无效重渲染。
 */

import { t } from '@/services/i18nRuntime';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, Input } from 'antd';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { runOrDeferWorkflowFormFieldWrite } from '../../utils/workflowFormImeGuard';
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

type RouteBranchCardProps = {
  form: FormInstance;
  fieldName: number;
  index: number;
  onRemove: (name: number) => void;
};

/** 单条路由分支卡片：仅订阅本分支 intentType，避免兄弟分支输入触发重渲染 */
const RouteBranchCard = memo(function RouteBranchCard({
  form,
  fieldName,
  index,
  onRemove,
}: RouteBranchCardProps) {
  const intentType = Form.useWatch(['intentConfigs', fieldName, 'intentType'], {
    form,
    preserve: true,
  });

  const handleRemove = useCallback(() => {
    onRemove(fieldName);
  }, [fieldName, onRemove]);

  if (intentType === 'OTHER') {
    return (
      <div className="route-branch-card route-branch-card--other">
        <div className="route-branch-card__title-row">
          <span className="route-branch-card__index">{index + 1}</span>
          <span className="route-branch-card__other-name">
            {t('PC.Pages.AgentFlowNode.routeOtherIntent', '其他意图')}
          </span>
        </div>
        <Form.Item name={[fieldName, 'uuid']} hidden preserve />
        <Form.Item name={[fieldName, 'intentType']} hidden preserve />
        <Form.Item name={[fieldName, 'nextNodeIds']} hidden preserve />
      </div>
    );
  }

  return (
    <div className="route-branch-card">
      <Button
        type="text"
        size="small"
        className="route-branch-card__close"
        icon={<CloseOutlined />}
        onClick={handleRemove}
      />

      <div className="route-branch-card__title-row">
        <span className="route-branch-card__index">{index + 1}</span>
        <Form.Item
          name={[fieldName, 'name']}
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
        name={[fieldName, 'intent']}
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

      <Form.Item name={[fieldName, 'uuid']} hidden preserve />
      <Form.Item name={[fieldName, 'intentType']} hidden preserve />
      <Form.Item name={[fieldName, 'conditionType']} hidden preserve />
      <Form.Item name={[fieldName, 'nextNodeIds']} hidden preserve />

      <RouteConditionMatch form={form} listFieldName={fieldName} />
    </div>
  );
});

const RouteBranchList: React.FC<RouteBranchListProps> = ({ form }) => {
  const hydratedRef = useRef(false);
  /** Form.List 的 remove 引用可能变化，用 ref 保持传给子组件的 onRemove 稳定 */
  const removeRef = useRef<(name: number) => void>(() => {});
  const handleRemove = useCallback((name: number) => {
    removeRef.current(name);
  }, []);

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
    runOrDeferWorkflowFormFieldWrite(() => {
      form.setFieldsValue({ intentConfigs: hydrateIntentConfigs(raw) });
      hydratedRef.current = true;
    });
  }, [form]);

  return (
    <Form.List name="intentConfigs">
      {(fields, { add, remove }) => {
        removeRef.current = remove;

        return (
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

            {fields.map(({ key, name }, index) => (
              <RouteBranchCard
                key={key}
                form={form}
                fieldName={name}
                index={index}
                onRemove={handleRemove}
              />
            ))}
          </div>
        );
      }}
    </Form.List>
  );
};

export default RouteBranchList;
