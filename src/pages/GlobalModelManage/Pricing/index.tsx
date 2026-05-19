import WorkspaceLayout from '@/components/WorkspaceLayout';
import type { ResourcePricingConfigInfo } from '@/pages/SpaceResource/types/resource';
import { dict } from '@/services/i18nRuntime';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import { Button, Form } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import ModelPricingModal from './ModelPricingModal';
import ModelPricingTab from './ModelPricingTab';

/**
 * 公共模型管理 - 资源定价（系统级，仅模型定价）
 */
const GlobalModelManagePricing: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ResourcePricingConfigInfo | null>(
    null,
  );
  const [existingModelIds, setExistingModelIds] = useState<number[]>([]);
  const [form] = Form.useForm();
  const tableActionRef = useRef<ActionType>();

  const handleOpenAdd = useCallback(() => {
    setEditItem(null);
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item: ResourcePricingConfigInfo) => {
    setEditItem(item);
    setModalOpen(true);
  }, []);

  const handleModalCancel = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleModalSaved = useCallback(() => {
    setModalOpen(false);
    tableActionRef.current?.reload();
  }, []);

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SpaceResourcePricing.pageTitle')}
      hideScroll
      rightSlot={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
          {dict('PC.Pages.SpaceResourcePricing.addModel')}
        </Button>
      }
    >
      {/* 模型定价列表 */}
      <ModelPricingTab
        actionRef={tableActionRef}
        onEdit={handleOpenEdit}
        onExistingModelIdsChange={setExistingModelIds}
      />

      {/* 模型定价弹窗 */}
      <ModelPricingModal
        existingModelIds={existingModelIds}
        open={modalOpen}
        isEdit={!!editItem}
        editItem={editItem}
        form={form}
        onCancel={handleModalCancel}
        onSaved={handleModalSaved}
      />
    </WorkspaceLayout>
  );
};

export default GlobalModelManagePricing;
