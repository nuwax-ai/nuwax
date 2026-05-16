import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { Segmented } from 'antd';
import React, { useMemo, useState } from 'react';
import { useParams } from 'umi';
import styles from './index.less';
import ModelPricingTab from './ModelPricingTab';
import SkillPricingTab from './SkillPricingTab';
import ToolPricingTab from './ToolPricingTab';

/**
 * 资源定价
 */
const SpaceResourcePricing: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  // 标签选项
  const tabOptions = useMemo(
    () => [
      {
        value: 'model',
        label: dict('PC.Pages.SpaceResourcePricing.tabModelPricing'),
      },
      {
        value: 'tool',
        label: dict('PC.Pages.SpaceResourcePricing.tabToolPricing'),
      },
      {
        value: 'skill',
        label: dict('PC.Pages.SpaceResourcePricing.tabSkillPricing'),
      },
    ],
    [],
  );

  // 当前激活的标签
  const [activeTab, setActiveTab] = useState<string>('model');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'model':
        return <ModelPricingTab spaceId={spaceId} />;
      case 'tool':
        return <ToolPricingTab spaceId={spaceId} />;
      case 'skill':
        return <SkillPricingTab spaceId={spaceId} />;
      default:
        return null;
    }
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SpaceResourcePricing.pageTitle')}
      hideScroll
    >
      <Segmented
        options={tabOptions}
        value={activeTab}
        onChange={(v) => setActiveTab(v as string)}
        className={styles.segmented}
      />
      {renderTabContent()}
    </WorkspaceLayout>
  );
};

export default SpaceResourcePricing;
