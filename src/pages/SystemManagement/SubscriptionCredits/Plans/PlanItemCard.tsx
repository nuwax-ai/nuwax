import { dict } from '@/services/i18nRuntime';
import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Switch } from 'antd';
import React from 'react';
import { SubscriptionPlanInfo } from '../types/subscription';

interface PlanItemCardProps {
  plan: SubscriptionPlanInfo;
  onToggle: (id: number, enabled: boolean) => void;
}

const PlanItemCard: React.FC<PlanItemCardProps> = ({ plan, onToggle }) => {
  return (
    <div
      style={{
        height: '100%',
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 16,
        padding: '16px 14px 12px',
        // opacity: plan.enabled ? 1 : 0.7,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: `${plan.color}1a`,
              color: plan.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            {plan.icon}
          </div>
          <span
            style={{
              fontSize: 12,
              color: plan.enabled ? '#52c41a' : '#8c8c8c',
              background: plan.enabled ? '#f6ffed' : '#fafafa',
              border: `1px solid ${plan.enabled ? '#b7eb8f' : '#f0f0f0'}`,
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            {plan.enabled
              ? dict('PC.Pages.SystemPlans.statusActive')
              : dict('PC.Pages.SystemPlans.statusInactive')}
          </span>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#262626',
            marginBottom: 6,
          }}
        >
          {plan.name}
        </div>
        <div style={{ marginBottom: 6, display: 'flex', alignItems: 'end' }}>
          <span
            style={{
              fontSize: 32,
              lineHeight: 1,
              fontWeight: 700,
              color: '#262626',
            }}
          >
            ¥{plan.price}
          </span>
          <span style={{ color: '#8c8c8c', marginLeft: 4, marginBottom: 4 }}>
            {plan.cycle ? `/${plan.cycle}` : ''}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#8c8c8c',
            marginBottom: 10,
          }}
        >
          {dict('PC.Pages.SystemPlans.subscriberCount')}: {plan.subscriberCount}
        </div>
        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            paddingTop: 10,
          }}
        >
          {plan.features.map((feature, index) => (
            <div
              key={`${plan.id}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
                fontSize: 13,
                color: '#595959',
              }}
            >
              <CheckCircleFilled
                style={{
                  color: plan.color,
                  fontSize: 12,
                }}
              />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          marginTop: 10,
          borderTop: '1px solid #f0f0f0',
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            {dict('PC.Pages.SystemPlans.statusActive')}
          </span>
          <Switch
            checked={plan.enabled}
            onChange={(value) => onToggle(plan.id, value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button type="link" size="small" style={{ padding: 0 }}>
            {dict('PC.Common.Global.edit')}
          </Button>
          <Button type="link" size="small" danger style={{ padding: 0 }}>
            {dict('PC.Common.Global.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanItemCard;
