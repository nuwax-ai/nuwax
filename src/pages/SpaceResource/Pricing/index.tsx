import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import {
  apiDeletePricingPlan,
  apiListPricingPlans,
  apiTogglePricingPlan,
} from '@/services/subscriptionService';
import type { PricingPlanInfo } from '@/types/interfaces/subscription';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import CreatePricingPlanModal from './CreatePricingPlanModal';
import PricingPlanItem from './PricingPlanItem';
import styles from './index.less';

const cx = classNames.bind(styles);

const SpaceResourcePricing: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  const [keyword, setKeyword] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editPlan, setEditPlan] = useState<PricingPlanInfo | null>(null);
  const [planList, setPlanList] = useState<PricingPlanInfo[]>([]);

  const { loading, run: runList } = useRequest(
    () => apiListPricingPlans(spaceId),
    {
      manual: true,
      onSuccess: (res) => setPlanList(res?.data ?? []),
    },
  );

  useEffect(() => {
    runList();
  }, [spaceId]);

  const filteredList = keyword
    ? planList.filter((p) => p.name.includes(keyword))
    : planList;

  const handleEdit = (plan: PricingPlanInfo) => {
    setEditPlan(plan);
    setOpenModal(true);
  };

  const handleDelete = (plan: PricingPlanInfo) => {
    modalConfirm(
      dict('PC.Pages.SpaceResourcePricing.confirmDelete'),
      plan.name,
      async () => {
        await apiDeletePricingPlan(plan.id);
        message.success(dict('PC.Pages.SpaceResourcePricing.deleteSuccess'));
        runList();
        new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
      },
    );
  };

  const handleToggle = async (plan: PricingPlanInfo, enabled: boolean) => {
    await apiTogglePricingPlan(plan.id, enabled);
    setPlanList((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, enabled } : p)),
    );
    message.success(
      enabled
        ? dict('PC.Pages.SpaceResourcePricing.enableSuccess')
        : dict('PC.Pages.SpaceResourcePricing.disableSuccess'),
    );
  };

  const handleModalConfirm = () => {
    setOpenModal(false);
    setEditPlan(null);
    runList();
  };

  const handleModalCancel = () => {
    setOpenModal(false);
    setEditPlan(null);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div className={cx(styles['header-area'])}>
        <div className={cx(styles['header-left'])}>
          <h3 className={cx(styles.title)}>
            {dict('PC.Pages.SpaceResourcePricing.pageTitle')}
          </h3>
        </div>
        <div className={cx(styles['header-right'])}>
          <Input
            placeholder={dict(
              'PC.Pages.SpaceResourcePricing.searchPlaceholder',
            )}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            onClear={() => setKeyword('')}
            style={{ width: 214 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditPlan(null);
              setOpenModal(true);
            }}
          >
            {dict('PC.Pages.SpaceResourcePricing.createPlan')}
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filteredList.length > 0 ? (
        <div
          className={cx(
            styles['main-container'],
            'flex-1',
            'scroll-container-hide',
          )}
        >
          {filteredList.map((plan) => (
            <PricingPlanItem
              key={plan.id}
              plan={plan}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description={dict('PC.Pages.SpaceResourcePricing.noPlans')} />
        </div>
      )}

      <CreatePricingPlanModal
        open={openModal}
        spaceId={spaceId}
        editData={editPlan}
        onCancel={handleModalCancel}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

export default SpaceResourcePricing;
