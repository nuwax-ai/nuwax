import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiCreateCreditPackage,
  apiDeleteCreditPackage,
  apiListAdminCreditPackages,
  apiToggleCreditPackage,
  apiUpdateCreditPackage,
} from '@/services/subscriptionService';
import type { CreditPackageAdminInfo } from '@/types/interfaces/subscription';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Switch,
  Tag,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const MOCK_PACKAGES: CreditPackageAdminInfo[] = [
  {
    id: 1,
    name: '入门包',
    credits: 100,
    price: 10,
    originalPrice: 15,
    tag: '',
    enabled: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 2,
    name: '标准包',
    credits: 500,
    price: 45,
    originalPrice: 50,
    tag: '热门',
    enabled: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 3,
    name: '专业包',
    credits: 2000,
    price: 150,
    originalPrice: 200,
    tag: '最划算',
    enabled: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 4,
    name: '企业包',
    credits: 10000,
    price: 600,
    originalPrice: 1000,
    tag: '限时折扣',
    enabled: false,
    createdAt: '2026-02-01T08:00:00Z',
  },
];

const CreditPackages: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [pkgList, setPkgList] =
    useState<CreditPackageAdminInfo[]>(MOCK_PACKAGES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CreditPackageAdminInfo | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const loadList = async () => {
    try {
      const res = await apiListAdminCreditPackages();
      if (res?.code === SUCCESS_CODE && res.data?.length) {
        setPkgList(res.data);
      }
    } catch {}
  };

  useEffect(() => {
    loadList();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true });
    setModalOpen(true);
  };

  const openEdit = (item: CreditPackageAdminInfo) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleDelete = (item: CreditPackageAdminInfo) => {
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.name,
      async () => {
        await apiDeleteCreditPackage(item.id);
        message.success(dict('PC.Common.Global.deleteSuccess'));
        setPkgList((prev) => prev.filter((p) => p.id !== item.id));
      },
    );
  };

  const handleToggle = async (
    item: CreditPackageAdminInfo,
    enabled: boolean,
  ) => {
    await apiToggleCreditPackage(item.id, enabled);
    setPkgList((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, enabled } : p)),
    );
    message.success(
      enabled
        ? dict('PC.Common.Global.enableSuccess')
        : dict('PC.Common.Global.disableSuccess'),
    );
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editItem) {
        const res = await apiUpdateCreditPackage(editItem.id, values);
        if (res?.code === SUCCESS_CODE) {
          setPkgList((prev) =>
            prev.map((p) => (p.id === editItem.id ? { ...p, ...values } : p)),
          );
          message.success(dict('PC.Common.Global.saveSuccess'));
          setModalOpen(false);
        }
      } else {
        const res = await apiCreateCreditPackage(values);
        if (res?.code === SUCCESS_CODE && res.data) {
          setPkgList((prev) => [...prev, res.data!]);
          message.success(dict('PC.Common.Global.createSuccess'));
          setModalOpen(false);
        } else {
          setPkgList((prev) => [
            ...prev,
            { id: Date.now(), createdAt: new Date().toISOString(), ...values },
          ]);
          setModalOpen(false);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const columns: ProColumns<CreditPackageAdminInfo>[] = [
    {
      title: dict('PC.Pages.SystemCreditPackages.colName'),
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <span>
          {record.name}
          {record.tag && (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {record.tag}
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colCredits'),
      dataIndex: 'credits',
      key: 'credits',
      search: false,
      render: (val) => `${val} 积分`,
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colPrice'),
      dataIndex: 'price',
      key: 'price',
      search: false,
      render: (_, record) => (
        <span>
          <span style={{ fontWeight: 600 }}>¥{record.price}</span>
          {record.originalPrice && (
            <span
              style={{
                color: '#999',
                textDecoration: 'line-through',
                marginLeft: 8,
                fontSize: 12,
              }}
            >
              ¥{record.originalPrice}
            </span>
          )}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colStatus'),
      dataIndex: 'enabled',
      key: 'enabled',
      search: false,
      render: (_, record) => (
        <Switch
          checked={record.enabled}
          size="small"
          onChange={(v) => handleToggle(record, v)}
        />
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
              confirm: { title: dict('PC.Common.Global.confirmDelete') },
              onClick: (r) => handleDelete(r),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.creditsPackages')}
      rightSlot={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {dict('PC.Pages.SystemCreditPackages.createPackage')}
        </Button>
      }
    >
      <XProTable<CreditPackageAdminInfo>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        dataSource={pkgList}
        request={async () => ({
          data: pkgList,
          total: pkgList.length,
          success: true,
        })}
      />

      <Modal
        title={
          editItem
            ? dict('PC.Pages.SystemCreditPackages.editPackage')
            : dict('PC.Pages.SystemCreditPackages.createPackage')
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={dict('PC.Pages.SystemCreditPackages.fieldName')}
            rules={[{ required: true }]}
          >
            <Input maxLength={30} showCount />
          </Form.Item>
          <Form.Item
            name="credits"
            label={dict('PC.Pages.SystemCreditPackages.fieldCredits')}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="price"
            label={dict('PC.Pages.SystemCreditPackages.fieldPrice')}
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              precision={2}
              prefix="¥"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="originalPrice"
            label={dict('PC.Pages.SystemCreditPackages.fieldOriginalPrice')}
          >
            <InputNumber
              min={0}
              precision={2}
              prefix="¥"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="tag"
            label={dict('PC.Pages.SystemCreditPackages.fieldTag')}
          >
            <Input
              maxLength={10}
              placeholder={dict(
                'PC.Pages.SystemCreditPackages.fieldTagPlaceholder',
              )}
            />
          </Form.Item>
          <Form.Item
            name="enabled"
            label={dict('PC.Pages.SystemCreditPackages.fieldEnabled')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </WorkspaceLayout>
  );
};

export default CreditPackages;
