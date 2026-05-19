import { dict } from '@/services/i18nRuntime';
import { apiGetMySubscription } from '@/services/subscriptionService';
import {
  BizTypeEnum,
  MyPlanPeriodEnum,
  MySubscriptionStatusEnum,
} from '@/types/interfaces/subscription';
import { PlayCircleOutlined } from '@ant-design/icons';
import { Col, Empty, Row, Spin, Statistic, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import { useRequest } from 'umi';
import { getPeriodPayTypeText, getPeriodUnitText } from '../../../../utils';
import styles from './index.less';

const cx = classNames.bind(styles);

const SubscribedSkills: React.FC = () => {
  const { data: subData, loading } = useRequest(() =>
    apiGetMySubscription({ bizType: BizTypeEnum.Skill }),
  );

  const list = subData?.subscriptions || [];

  if (loading) {
    return (
      <div className={cx(styles['loading-wrapper'])}>
        <Spin />
      </div>
    );
  }

  if (list.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Row gutter={[24, 24]}>
      {list.map((item: any) => {
        const buyout = item.plan?.period === MyPlanPeriodEnum.Forever;
        const themeColor = '#1890ff';

        return (
          <Col key={item.id} xs={24} sm={12} md={8} lg={8} xl={8} xxl={6}>
            <div className={cx(styles['skill-card'])}>
              <div className={cx(styles['card-header'])}>
                <div className={cx(styles['header-top'])}>
                  <div
                    className={cx(styles['skill-icon'])}
                    style={{
                      backgroundColor: item.icon ? 'transparent' : themeColor,
                    }}
                  >
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.bizName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <PlayCircleOutlined />
                    )}
                  </div>
                  <div className={cx(styles['skill-info'])}>
                    <div className={cx(styles['skill-name'])}>
                      {item.bizName}
                    </div>
                    <div className={cx(styles['skill-provider'])}>
                      {item?.planName || '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={cx(styles['card-body'])}>
                {buyout ? (
                  <>
                    <div className={cx(styles['sub-info-grid'])}>
                      <div className={cx(styles['info-item'])}>
                        <div className={cx(styles['label'])}>
                          {dict(
                            'PC.Pages.MorePage.MySubscriptions.buyoutPriceLabel',
                          )}
                        </div>
                        <div className={cx(styles['value'])}>
                          <Statistic
                            className={cx(styles['price-statistic'])}
                            value={item.plan?.price}
                            prefix="¥"
                            precision={2}
                          />
                        </div>
                      </div>
                    </div>
                    <div className={cx(styles['buyout-info'])}>
                      <div className={cx(styles['pay-type'])}>
                        {dict('PC.Pages.MorePage.MySubscriptions.permanentUse')}
                      </div>
                      <Tag
                        className={cx(styles['status-tag-inner'])}
                        color="cyan"
                      >
                        {dict('PC.Pages.MorePage.MySubscriptions.boughtOut')}
                      </Tag>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={cx(styles['sub-info-grid'])}>
                      <div className={cx(styles['info-item'])}>
                        <div className={cx(styles['label'])}>
                          {dict('PC.Pages.MorePage.MySubscriptions.subAmount')}
                        </div>
                        <div className={cx(styles['value'])}>
                          <Statistic
                            className={cx(styles['price-statistic'])}
                            value={item.plan?.price}
                            prefix="¥"
                            suffix={getPeriodUnitText(item.plan?.period)}
                            precision={2}
                          />
                        </div>
                      </div>
                      <div className={cx(styles['info-item'])}>
                        <div className={cx(styles['label'])}>
                          {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}
                        </div>
                        <div className={cx(styles['value'])}>
                          {item.endTime
                            ? dayjs(item.endTime).format('YYYY-MM-DD')
                            : '-'}
                        </div>
                      </div>
                    </div>
                    <div className={cx(styles['buyout-info'])}>
                      <div className={cx(styles['pay-type'])}>
                        {getPeriodPayTypeText(item.plan?.period)}
                      </div>
                      <Tag
                        className={cx(styles['status-tag-inner'])}
                        color={
                          item.status === MySubscriptionStatusEnum.Active
                            ? 'success'
                            : 'error'
                        }
                      >
                        {item.status === MySubscriptionStatusEnum.Active
                          ? dict(
                              'PC.Pages.MorePage.MySubscriptions.subscribing',
                            )
                          : dict('PC.Pages.MorePage.MySubscriptions.expired')}
                      </Tag>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Col>
        );
      })}
    </Row>
  );
};

export default SubscribedSkills;
