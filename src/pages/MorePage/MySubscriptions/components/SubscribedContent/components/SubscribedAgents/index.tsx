import { dict } from '@/services/i18nRuntime';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import React from 'react';
import styles from './index.less';

export interface SubscribedAgent {
  id: number;
  name: string;
  provider: string;
  price: number;
  expireAt: string;
  status: 'active' | 'expired';
  iconColor?: string;
  icon?: React.ReactNode;
}

interface SubscribedAgentsProps {
  data: SubscribedAgent[];
}

const SubscribedAgents: React.FC<SubscribedAgentsProps> = ({ data }) => {
  return (
    <div className={styles['agents-grid']}>
      {data.map((agent) => (
        <div key={agent.id} className={styles['agent-card']}>
          <div className={styles['card-header']}>
            <div
              className={styles['agent-icon']}
              style={{ backgroundColor: agent.iconColor || '#1890ff' }}
            >
              {agent.icon}
            </div>
            <div className={styles['agent-info']}>
              <div className={styles['agent-name']}>{agent.name}</div>
              <div className={styles['agent-provider']}>{agent.provider}</div>
            </div>
          </div>

          <div className={styles['card-body']}>
            <div className={styles['info-item']}>
              <div className={styles['info-label']}>
                {dict('PC.Pages.MorePage.MySubscriptions.subAmount')}
              </div>
              <div className={styles['info-value']}>
                <span className={styles['price']}>¥{agent.price}</span>
                <span className={styles['unit']}>
                  {dict('PC.Pages.MorePage.MySubscriptions.perMonth')}
                </span>
              </div>
            </div>
            <div className={styles['info-item']}>
              <div className={styles['info-label']}>
                {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}
              </div>
              <div className={styles['info-value']}>{agent.expireAt}</div>
            </div>
          </div>

          <div className={styles['card-footer']}>
            <div
              className={`${styles['status-box']} ${
                agent.status === 'active'
                  ? styles['status-active']
                  : styles['status-expired']
              }`}
            >
              {agent.status === 'active' ? (
                <>
                  <CheckCircleOutlined />
                  <span>
                    {dict('PC.Pages.MorePage.MySubscriptions.subscribing')}
                  </span>
                </>
              ) : (
                <>
                  <CloseCircleOutlined />
                  <span>
                    {dict('PC.Pages.MorePage.MySubscriptions.expired')}
                  </span>
                </>
              )}
            </div>
            <Button
              type="primary"
              className={styles['renew-button']}
              onClick={() => message.success('续订功能开发中')}
            >
              {dict('PC.Pages.MorePage.MySubscriptions.renewNow')}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscribedAgents;
