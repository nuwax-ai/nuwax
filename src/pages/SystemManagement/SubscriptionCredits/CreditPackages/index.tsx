import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Form, Switch, message } from 'antd';
import React, { useRef, useState } from 'react';
import {
  apiDeleteCreditPackage,
  apiGetCreditPackageList,
  apiUpdateCreditPackage,
} from '../services/credit';
import { CreditPackageInfo, CreditPackageStatusEnum } from '../types/credit';
import CreditPackageFormModal from './CreditPackageFormModal';

const CreditPackages: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [creditPackageInfo, setCreditPackageInfo] =
    useState<CreditPackageInfo | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setCreditPackageInfo(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true });
    setModalOpen(true);
  };

  const openEdit = (item: CreditPackageInfo) => {
    setCreditPackageInfo(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleDelete = (item: CreditPackageInfo) => {
    if (!item.id) {
      return;
    }
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.packageName,
      async () => {
        await apiDeleteCreditPackage(item.id as number);
        message.success(dict('PC.Common.Global.deleteSuccess'));
        actionRef.current?.reload();
      },
    );
  };

  // 切换状态
  const handleToggle = async (item: CreditPackageInfo, enabled: boolean) => {
    if (!item.id) {
      return;
    }
    await apiUpdateCreditPackage({
      ...item,
      status: enabled
        ? CreditPackageStatusEnum.Enabled
        : CreditPackageStatusEnum.Disabled,
    });
    message.success(
      enabled
        ? dict('PC.Common.Global.enableSuccess')
        : dict('PC.Common.Global.disableSuccess'),
    );
    actionRef.current?.reload();
  };

  // 列配置
  const columns: ProColumns<CreditPackageInfo>[] = [
    {
      title: dict('PC.Pages.SystemCreditPackages.colName'),
      dataIndex: 'packageName',
      key: 'packageName',
      render: (_, record) => <span>{record.packageName || '-'}</span>,
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colCredits'),
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      search: false,
      // render: (val) => `${val} 积分`,
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colValidityPeriod'),
      dataIndex: 'period',
      key: 'period',
      search: false,
      render: (_, record) => `${record.period || '-'} 个月`,
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colPrice'),
      dataIndex: 'price',
      key: 'price',
      search: false,
      render: (_, record) => (
        <span>{record.price ? `¥${record.price}` : '-'}</span>
      ),
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colStatus'),
      dataIndex: 'status',
      key: 'status',
      search: false,
      render: (_, record) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Switch
            checked={record.status === 1}
            onChange={(v) => handleToggle(record, v)}
          />
        </span>
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      search: false,
      width: 120,
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'edit',
              label: dict('PC.Common.Global.edit'),
              onClick: (r) => openEdit(r),
            },
            {
              key: 'delete',
              label: dict('PC.Common.Global.delete'),
              danger: true,
              // confirm: { title: dict('PC.Common.Global.confirmDelete') },
              onClick: (r) => handleDelete(r),
            },
          ]}
        />
      ),
    },
  ];

  /**
   * ProTable request 函数
   */
  const request = async (params: {
    pageSize?: number;
    current?: number;
    keyword?: string;
    status?: number;
  }) => {
    const response = await apiGetCreditPackageList(params.status);
    const list = response?.data || [];

    return {
      data: list,
      total: list.length,
      success: response?.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.creditsPackages')}
      rightSlot={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {dict('PC.Pages.SystemCreditPackages.createPackage')}
        </Button>
      }
    >
      <XProTable<CreditPackageInfo>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={request}
        pagination={false}
      />

      {/* 新建、编辑积分套餐表单弹窗 */}
      <CreditPackageFormModal
        form={form}
        open={modalOpen}
        creditPackageInfo={creditPackageInfo}
        onSuccess={() => {
          setModalOpen(false);
          actionRef.current?.reload();
        }}
        onCancel={() => setModalOpen(false)}
      />
    </WorkspaceLayout>
  );
};

export default CreditPackages;
