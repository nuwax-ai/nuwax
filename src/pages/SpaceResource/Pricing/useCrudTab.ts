import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import type { FormInstance } from 'antd';
import { Form, message } from 'antd';
import { useEffect, useState } from 'react';

interface CrudTabConfig<T> {
  spaceId: number;
  listApi: (spaceId: number) => Promise<any>;
  createApi: (spaceId: number, data: Partial<T>) => Promise<any>;
  updateApi: (id: number, data: Partial<T>) => Promise<any>;
  deleteApi: (id: number) => Promise<any>;
  toggleApi: (id: number, enabled: boolean) => Promise<any>;
}

interface CrudTabReturn<T> {
  list: T[];
  setList: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  saving: boolean;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  editItem: T | null;
  form: FormInstance;
  openAdd: () => void;
  openEdit: (item: T) => void;
  handleSave: (extraPayload?: Record<string, any>) => Promise<void>;
  handleDelete: (item: T) => void;
  handleToggle: (item: T, enabled: boolean) => Promise<void>;
  load: () => Promise<void>;
}

export function useCrudTab<
  T extends { id: number; name: string; enabled: boolean },
>(config: CrudTabConfig<T>): CrudTabReturn<T> {
  const { spaceId, listApi, createApi, updateApi, deleteApi, toggleApi } =
    config;

  const [list, setList] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await listApi(spaceId);
      if (res?.data) setList(res.data);
    } catch {
      message.error(dict('PC.Common.Global.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [spaceId]);

  const openAdd = () => {
    setEditItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (item: T) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleSave = async (extraPayload?: Record<string, any>) => {
    const values = await form.validateFields();
    const payload = { ...values, ...extraPayload };
    setSaving(true);
    try {
      if (editItem) {
        await updateApi(editItem.id, payload);
        message.success(dict('PC.Pages.SpaceResourcePricing.editSuccess'));
      } else {
        await createApi(spaceId, payload);
        message.success(dict('PC.Pages.SpaceResourcePricing.addSuccess'));
      }
      setModalOpen(false);
      load();
    } catch {
      message.error(dict('PC.Common.Global.operationFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: T) => {
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.name,
      async () => {
        try {
          await deleteApi(item.id);
          message.success(dict('PC.Pages.SpaceResourcePricing.deleteSuccess'));
          load();
        } catch {
          message.error(dict('PC.Common.Global.operationFailed'));
        }
      },
    );
  };

  const handleToggle = async (item: T, enabled: boolean) => {
    const prev = list;
    setList((l) => l.map((p) => (p.id === item.id ? { ...p, enabled } : p)));
    try {
      await toggleApi(item.id, enabled);
      message.success(dict('PC.Pages.SpaceResourcePricing.toggleSuccess'));
    } catch {
      setList(prev);
      message.error(dict('PC.Common.Global.operationFailed'));
    }
  };

  return {
    list,
    setList,
    loading,
    saving,
    modalOpen,
    setModalOpen,
    editItem,
    form,
    openAdd,
    openEdit,
    handleSave,
    handleDelete,
    handleToggle,
    load,
  };
}
