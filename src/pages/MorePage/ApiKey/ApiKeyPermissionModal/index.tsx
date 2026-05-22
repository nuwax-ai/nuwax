import { apiApiKeyUpdate, apiGetOpenApiDefinitions } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import { apiGetMyModels } from '@/services/modelConfig';
import type { ApiKeyInfo, OpenApiDefinition } from '@/types/interfaces/account';
import { message, Modal, Spin, Tabs, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import ApiPermissionTab from './components/ApiPermissionTab';
import ModelPermissionTab from './components/ModelPermissionTab';
import PermissionOperationsBar from './components/PermissionOperationsBar';

const { Title } = Typography;

interface ApiKeyPermissionModalProps {
  /** 是否打开 */
  open: boolean;
  /** 弹窗显隐控制 */
  onOpenChange: (open: boolean) => void;
  /** 当前选中的密钥信息 */
  record?: ApiKeyInfo;
  /** 保存成功回调 */
  onSuccess?: () => void;
}

/**
 * API KEY 权限配置弹窗
 */
const ApiKeyPermissionModal: React.FC<ApiKeyPermissionModalProps> = ({
  open,
  onOpenChange,
  record,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'model' | 'spaceModel'>(
    'api',
  );
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<OpenApiDefinition[]>([]);
  const [myModels, setMyModels] = useState<any[]>([]);
  const [mySpaceModels, setMySpaceModels] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [checkedModelKeys, setCheckedModelKeys] = useState<number[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  // 获取所有节点的 key（用于展开/全选）
  const allKeys = useMemo(() => {
    const keys: string[] = [];
    const traverse = (list: OpenApiDefinition[]) => {
      list.forEach((item) => {
        keys.push(item.key);
        if (item.apiList) traverse(item.apiList);
      });
    };
    traverse(treeData);
    return keys;
  }, [treeData]);

  // 获取所有叶子节点的 key（用于全选判断）
  const allLeafKeys = useMemo(() => {
    const keys: string[] = [];
    const traverse = (list: OpenApiDefinition[]) => {
      list.forEach((item) => {
        if (!item.apiList || item.apiList.length === 0) {
          keys.push(item.key);
        } else {
          traverse(item.apiList);
        }
      });
    };
    traverse(treeData);
    return keys;
  }, [treeData]);

  // 加载权限与模型数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [apiRes, modelRes, spaceModelRes] = await Promise.all([
        apiGetOpenApiDefinitions(),
        apiGetMyModels('System'),
        apiGetMyModels('Space'),
      ]);
      if (apiRes.success) {
        setTreeData(apiRes.data || []);
        // 初始化展开第一层
        setExpandedKeys(apiRes.data?.map((i) => i.key) || []);
      }
      if (modelRes.success) {
        setMyModels(modelRes.data || []);
      }
      if (spaceModelRes.success) {
        setMySpaceModels(spaceModelRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setActiveTab('api');
      loadData();
      // 回显逻辑：从 record.config.apiConfigs 中提取 key
      if (record?.config?.apiConfigs) {
        const initialKeys = record.config.apiConfigs.map((i: any) => i.key);
        setCheckedKeys(initialKeys);
      } else {
        setCheckedKeys([]);
      }

      // 回显逻辑：从 record.config.modelIds 中提取 id
      if (record?.config?.modelIds) {
        setCheckedModelKeys(record.config.modelIds);
      } else {
        setCheckedModelKeys([]);
      }
    }
  }, [open, record]);

  // 处理项操作逻辑
  const isAllChecked = useMemo(() => {
    return (
      allLeafKeys.length > 0 &&
      allLeafKeys.every((key) => checkedKeys.includes(key))
    );
  }, [allLeafKeys, checkedKeys]);

  const isIndeterminate = useMemo(() => {
    if (isAllChecked) return false;
    return allLeafKeys.some((key) => checkedKeys.includes(key));
  }, [allLeafKeys, checkedKeys, isAllChecked]);

  const handleSelectAll = (checked: boolean) => {
    setCheckedKeys(checked ? allKeys : []);
  };

  // 处理模型项选择逻辑 (系统模型)
  const isAllModelChecked = useMemo(() => {
    return (
      myModels.length > 0 &&
      myModels.every((item) => checkedModelKeys.includes(item.id))
    );
  }, [myModels, checkedModelKeys]);

  const isModelIndeterminate = useMemo(() => {
    if (isAllModelChecked) return false;
    return myModels.some((item) => checkedModelKeys.includes(item.id));
  }, [myModels, checkedModelKeys, isAllModelChecked]);

  const handleSelectAllModels = (checked: boolean) => {
    const nonSystemModelIds = checkedModelKeys.filter(
      (id) => !myModels.some((m) => m.id === id),
    );
    if (checked) {
      setCheckedModelKeys([...nonSystemModelIds, ...myModels.map((m) => m.id)]);
    } else {
      setCheckedModelKeys(nonSystemModelIds);
    }
  };

  // 处理模型项选择逻辑 (个人空间模型)
  const isAllSpaceModelChecked = useMemo(() => {
    return (
      mySpaceModels.length > 0 &&
      mySpaceModels.every((item) => checkedModelKeys.includes(item.id))
    );
  }, [mySpaceModels, checkedModelKeys]);

  const isSpaceModelIndeterminate = useMemo(() => {
    if (isAllSpaceModelChecked) return false;
    return mySpaceModels.some((item) => checkedModelKeys.includes(item.id));
  }, [mySpaceModels, checkedModelKeys, isAllSpaceModelChecked]);

  const handleSelectAllSpaceModels = (checked: boolean) => {
    const nonSpaceModelIds = checkedModelKeys.filter(
      (id) => !mySpaceModels.some((m) => m.id === id),
    );
    if (checked) {
      setCheckedModelKeys([
        ...nonSpaceModelIds,
        ...mySpaceModels.map((m) => m.id),
      ]);
    } else {
      setCheckedModelKeys(nonSpaceModelIds);
    }
  };

  const handleSave = async () => {
    if (!record) return;
    setSaveLoading(true);
    try {
      // 1. 构造 apiConfigs
      // 如果原有配置中有对应的 key，保留其 rpm；否则默认为 0
      const oldApiConfigs = record.config?.apiConfigs || [];
      const newApiConfigs = (checkedKeys as string[]).map((key) => {
        const existItem = oldApiConfigs.find((i) => i.key === key);
        return {
          key,
          rpm: existItem ? existItem.rpm : 0,
        };
      });

      // 2. 处理 expire 过期时间转换
      // 逻辑：如果是 "YYYY-MM-DD HH:mm:ss" 或 ISO 字符串且非 "永不过期"，转为当天 23:59:59 时间戳
      let expire: number | null = null;
      if (
        record.expire &&
        record.expire !== dict('PC.Pages.MorePage.ApiKey.neverExpires') && // backend literal value comparison
        record.expire !== '0000-00-00 00:00:00'
      ) {
        // 使用 dayjs 统一转换为当天结束的 23:59:59
        expire = dayjs(record.expire).endOf('day').valueOf();
      }

      // 3. 调用更新接口
      const res = await apiApiKeyUpdate({
        accessKey: record.accessKey,
        status: record.status,
        name: record.name,
        expire,
        apiConfigs: newApiConfigs,
        modelIds: checkedModelKeys,
      });

      if (res.success) {
        message.success(
          dict('PC.Pages.MorePage.ApiKeyPermission.permissionSaved'),
        );
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to save permissions:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Title level={4} ellipsis={{ tooltip: true }}>
          {dict('PC.Pages.MorePage.ApiKeyPermission.title', record?.name || '')}
        </Title>
      }
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleSave}
      confirmLoading={saveLoading}
      width={720}
    >
      <Spin spinning={loading}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 页签切换 */}
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as any)}
            style={{ marginBottom: -12 }}
            items={[
              {
                key: 'api',
                label: dict('PC.Pages.MorePage.ApiKeyPermission.apiPermission'),
              },
              {
                key: 'model',
                label: dict(
                  'PC.Pages.MorePage.ApiKeyPermission.modelPermission',
                ),
              },
              {
                key: 'spaceModel',
                label: dict(
                  'PC.Pages.MorePage.ApiKeyPermission.spaceModelPermission',
                ),
              },
            ]}
          />

          {/* 顶部操作区 */}
          <PermissionOperationsBar
            activeTab={activeTab}
            isIndeterminate={isIndeterminate}
            isModelIndeterminate={isModelIndeterminate}
            isSpaceModelIndeterminate={isSpaceModelIndeterminate}
            isAllChecked={isAllChecked}
            isAllModelChecked={isAllModelChecked}
            isAllSpaceModelChecked={isAllSpaceModelChecked}
            onSelectAll={handleSelectAll}
            onSelectAllModels={handleSelectAllModels}
            onSelectAllSpaceModels={handleSelectAllSpaceModels}
            onExpandAll={() => setExpandedKeys(allKeys)}
            onCollapseAll={() => setExpandedKeys([])}
          />

          {/* 内容展示区 */}
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: '12px',
              maxHeight: '520px',
              overflowY: 'auto',
            }}
          >
            {activeTab === 'api' ? (
              <ApiPermissionTab
                loading={loading}
                treeData={treeData}
                checkedKeys={checkedKeys}
                onCheckedChange={setCheckedKeys}
                expandedKeys={expandedKeys}
                onExpandedChange={setExpandedKeys}
              />
            ) : activeTab === 'model' ? (
              <ModelPermissionTab
                loading={loading}
                myModels={myModels}
                checkedModelKeys={checkedModelKeys}
                onCheckedModelKeysChange={setCheckedModelKeys}
              />
            ) : (
              <ModelPermissionTab
                loading={loading}
                myModels={mySpaceModels}
                checkedModelKeys={checkedModelKeys}
                onCheckedModelKeysChange={setCheckedModelKeys}
              />
            )}
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default ApiKeyPermissionModal;
