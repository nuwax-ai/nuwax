import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  CheckCircleFilled,
  CrownOutlined,
  RocketOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Row,
  Statistic,
  Switch,
  Tag,
  Typography,
} from 'antd';
import React, { useState } from 'react';

const { Text, Title } = Typography;

interface PlanTemplate {
  id: number;
  name: string;
  icon: React.ReactNode;
  price: number;
  cycle: string;
  features: string[];
  enabled: boolean;
  subscriberCount: number;
  color: string;
}

const MOCK_PLANS: PlanTemplate[] = [
  {
    id: 1,
    name: '免费版',
    icon: <StarOutlined />,
    price: 0,
    cycle: '',
    features: ['每日 10 次对话', '基础模型访问', '社区支持'],
    enabled: true,
    subscriberCount: 1280,
    color: '#8c8c8c',
  },
  {
    id: 2,
    name: '进阶版',
    icon: <ThunderboltOutlined />,
    price: 99,
    cycle: dict('PC.Pages.SpaceResourcePricing.cycleMonthly'),
    features: ['无限对话', '高级模型访问', '知识库 5GB', '优先支持'],
    enabled: true,
    subscriberCount: 456,
    color: '#1677ff',
  },
  {
    id: 3,
    name: '高阶版',
    icon: <RocketOutlined />,
    price: 299,
    cycle: dict('PC.Pages.SpaceResourcePricing.cycleMonthly'),
    features: [
      '所有进阶版功能',
      '知识库 50GB',
      '自定义智能体',
      'API 访问',
      '专属客服',
    ],
    enabled: true,
    subscriberCount: 128,
    color: '#722ed1',
  },
  {
    id: 4,
    name: '旗舰版',
    icon: <CrownOutlined />,
    price: 999,
    cycle: dict('PC.Pages.SpaceResourcePricing.cycleMonthly'),
    features: [
      '所有高阶版功能',
      '无限知识库',
      '私有化部署',
      'SLA 保障',
      '专属技术顾问',
      '定制开发支持',
    ],
    enabled: false,
    subscriberCount: 32,
    color: '#faad14',
  },
];

const MOCK_STATS = {
  activePlans: 3,
  totalSubscriptions: 1896,
  monthlyNew: 234,
  monthlyRevenue: 86500,
};

const Plans: React.FC = () => {
  const [plans, setPlans] = useState(MOCK_PLANS);

  const handleToggle = (id: number, enabled: boolean) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)));
  };

  return (
    <WorkspaceLayout title={dict('PC.Routes.subsPlans')}>
      {/* 统计卡 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemPlans.statActivePlans')}
              value={MOCK_STATS.activePlans}
              suffix={`/ ${plans.length}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemPlans.statTotalSubscriptions')}
              value={MOCK_STATS.totalSubscriptions}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemPlans.statMonthlyNew')}
              value={MOCK_STATS.monthlyNew}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemPlans.statMonthlyRevenue')}
              value={MOCK_STATS.monthlyRevenue}
              precision={0}
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      {/* 套餐卡片 */}
      <Row gutter={[16, 16]}>
        {plans.map((plan) => (
          <Col span={6} key={plan.id}>
            <Badge.Ribbon
              text={
                plan.enabled
                  ? dict('PC.Pages.SystemPlans.statusActive')
                  : dict('PC.Pages.SystemPlans.statusInactive')
              }
              color={plan.enabled ? 'green' : 'default'}
            >
              <Card
                style={{
                  height: '100%',
                  opacity: plan.enabled ? 1 : 0.6,
                }}
                actions={[
                  <Switch
                    key="toggle"
                    checked={plan.enabled}
                    checkedChildren={dict('PC.Pages.SystemPlans.enable')}
                    unCheckedChildren={dict('PC.Pages.SystemPlans.disable')}
                    onChange={(v) => handleToggle(plan.id, v)}
                  />,
                  <Button key="edit" type="link" size="small">
                    {dict('PC.Common.Global.edit')}
                  </Button>,
                ]}
              >
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 32,
                      color: plan.color,
                      marginBottom: 8,
                    }}
                  >
                    {plan.icon}
                  </div>
                  <Title level={4} style={{ margin: 0 }}>
                    {plan.name}
                  </Title>
                  <div style={{ marginTop: 8 }}>
                    {plan.price === 0 ? (
                      <Tag color="green">
                        {dict('PC.Pages.SystemPlans.free')}
                      </Tag>
                    ) : (
                      <span>
                        <span
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: plan.color,
                          }}
                        >
                          ¥{plan.price}
                        </span>
                        {plan.cycle && (
                          <Text type="secondary">/{plan.cycle}</Text>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dict('PC.Pages.SystemPlans.subscriberCount')}:{' '}
                    {plan.subscriberCount}
                  </Text>
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 6,
                        fontSize: 13,
                      }}
                    >
                      <CheckCircleFilled
                        style={{ color: plan.color, fontSize: 12 }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>
    </WorkspaceLayout>
  );
};

export default Plans;
