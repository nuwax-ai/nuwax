import { dict } from '@/services/i18nRuntime';
import { Button, Tag, message } from 'antd';
import React from 'react';
import styles from './index.less';

export interface SubscribedSkill {
  id: number;
  name: string;
  provider: string;
  buyout: boolean;
  buyoutPrice?: number;
  price?: number;
  expireAt?: string;
  status: 'active' | 'expired';
  themeColor?: string;
  icon?: React.ReactNode;
}

interface SubscribedSkillsProps {
  data: SubscribedSkill[];
}

const SubscribedSkills: React.FC<SubscribedSkillsProps> = ({ data }) => {
  return (
    <div className={styles['skills-grid']}>
      {data.map((skill) => (
        <div
          key={skill.id}
          className={styles['skill-card']}
          style={{ borderTop: `3px solid ${skill.themeColor || '#1890ff'}` }}
        >
          <div className={styles['card-header']}>
            <div className={styles['header-top']}>
              <div
                className={styles['skill-icon']}
                style={{ backgroundColor: skill.themeColor || '#1890ff' }}
              >
                {skill.icon}
              </div>
              <div className={styles['skill-info']}>
                <div className={styles['skill-name']}>{skill.name}</div>
                <div className={styles['skill-provider']}>{skill.provider}</div>
              </div>
            </div>

            {skill.buyout && (
              <Tag color="cyan" className={styles['buyout-tag']}>
                {dict('PC.Pages.MorePage.MySubscriptions.permanentUse') ||
                  '已买断 · 永久使用'}
              </Tag>
            )}
          </div>

          <div className={styles['card-body']}>
            {skill.buyout ? (
              <div className={styles['buyout-info']}>
                <span className={styles['label']}>买断价</span>
                <span className={styles['value']}>¥{skill.buyoutPrice}</span>
              </div>
            ) : (
              <div className={styles['sub-info-grid']}>
                <div className={styles['info-item']}>
                  <div className={styles['label']}>订阅金额</div>
                  <div className={styles['value']}>
                    <span className={styles['price']}>¥{skill.price}</span>/月
                  </div>
                </div>
                <div className={styles['info-item']}>
                  <div className={styles['label']}>到期时间</div>
                  <div className={styles['value']}>{skill.expireAt}</div>
                </div>
              </div>
            )}
          </div>

          <div className={styles['card-footer']}>
            <div className={styles['status-area']}>
              {skill.buyout ? (
                <span className={styles['pay-type']}>买断</span>
              ) : (
                <span className={styles['pay-type']}>月付</span>
              )}
              <Tag
                className={styles['status-tag']}
                color={
                  skill.buyout
                    ? 'success'
                    : skill.status === 'active'
                    ? 'success'
                    : 'error'
                }
              >
                {skill.buyout
                  ? '已买断'
                  : skill.status === 'active'
                  ? '订阅中'
                  : '已到期'}
              </Tag>
            </div>
            {!skill.buyout && (
              <Button
                size="small"
                className={styles['action-btn']}
                onClick={() => message.success('操作执行中')}
              >
                续订
              </Button>
            )}
            {skill.buyout && (
              <Button size="small" className={styles['action-btn']}>
                已买断
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscribedSkills;
