import { apiApiKeyUpdate, apiGetOpenApiDefinitions } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import { apiGetMyModels } from '@/services/modelConfig';
import type { ApiKeyInfo, OpenApiDefinition } from '@/types/interfaces/account';
import {
  Button,
  Checkbox,
  Empty,
  message,
  Modal,
  Space,
  Spin,
  Tabs,
  Tree,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';

const { Text, Title } = Typography;

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
  const [activeTab, setActiveTab] = useState<'api' | 'model'>('api');
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<OpenApiDefinition[]>([]);
  const [myModels, setMyModels] = useState<any[]>([]);
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
      const [apiRes, modelRes] = await Promise.all([
        apiGetOpenApiDefinitions(),
        apiGetMyModels('System'),
      ]);
      if (apiRes.success) {
        setTreeData(apiRes.data || []);
        // 初始化展开第一层
        setExpandedKeys(apiRes.data?.map((i) => i.key) || []);
      }
      if (modelRes.success) {
        setMyModels(modelRes.data || []);
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

  // 处理模型项选择逻辑
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
    setCheckedModelKeys(checked ? myModels.map((item) => item.id) : []);
  };

  // 统计逻辑：计算某个节点下选中的子节点数量
  const getSubCheckedCount = (node: OpenApiDefinition) => {
    if (!node.apiList || node.apiList.length === 0) return 0;
    let count = 0;
    const traverse = (list: OpenApiDefinition[]) => {
      list.forEach((item) => {
        if (!item.apiList || item.apiList.length === 0) {
          if (checkedKeys.includes(item.key)) count++;
        } else {
          traverse(item.apiList);
        }
      });
    };
    traverse(node.apiList);
    return count;
  };

  // 统计逻辑：获取某个节点下的总叶子节点数
  const getSubTotalCount = (node: OpenApiDefinition) => {
    if (!node.apiList || node.apiList.length === 0) return 0;
    let total = 0;
    const traverse = (list: OpenApiDefinition[]) => {
      list.forEach((item) => {
        if (!item.apiList || item.apiList.length === 0) {
          total++;
        } else {
          traverse(item.apiList);
        }
      });
    };
    traverse(node.apiList);
    return total;
  };

  // 自定义渲染接口节点内容
  const titleRender = (node: any) => {
    const isParent = node.apiList && node.apiList.length > 0;
    const checkedCount = isParent ? getSubCheckedCount(node) : 0;
    const totalCount = isParent ? getSubTotalCount(node) : 0;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingRight: 8,
        }}
      >
        <Text style={{ fontSize: 14 }}>{node.name}</Text>
        <Space size={8}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {node.path}
          </Text>
          {isParent && (
            <span
              style={{
                backgroundColor: '#e6f7ff',
                color: '#1890ff',
                padding: '0 8px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {checkedCount}/{totalCount}
            </span>
          )}
        </Space>
      </div>
    );
  };

  // 模型项自定义渲染（展示 name 与 description，各占 50% 空间，不换行，超出省略且悬浮提示）
  const modelTitleRender = (node: any) => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          paddingRight: 8,
          gap: 16,
        }}
      >
        <Text
          ellipsis={{ tooltip: true }}
          style={{ fontSize: 14, flex: 1, width: 0 }}
        >
          {node.name}
        </Text>
        <Text
          type="secondary"
          ellipsis={{ tooltip: true }}
          style={{ fontSize: 12, flex: 1, width: 0, textAlign: 'right' }}
        >
          {node.description}
        </Text>
      </div>
    );
  };

  const modelTreeData = useMemo(() => {
    return myModels.map((item) => ({
      key: String(item.id),
      name: item.name,
      description: item.description || '',
    }));
  }, [myModels]);

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
            ]}
          />

          {/* 顶部操作区 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 48,
              padding: '0 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 8,
            }}
          >
            <Checkbox
              indeterminate={
                activeTab === 'api' ? isIndeterminate : isModelIndeterminate
              }
              checked={activeTab === 'api' ? isAllChecked : isAllModelChecked}
              onChange={(e) => {
                if (activeTab === 'api') {
                  handleSelectAll(e.target.checked);
                } else {
                  handleSelectAllModels(e.target.checked);
                }
              }}
            >
              {dict('PC.Pages.MorePage.ApiKeyPermission.selectAll')}
            </Checkbox>
            {activeTab === 'api' && (
              <Space>
                <Button size="small" onClick={() => setExpandedKeys(allKeys)}>
                  {dict('PC.Pages.MorePage.ApiKeyPermission.expandAll')}
                </Button>
                <Button size="small" onClick={() => setExpandedKeys([])}>
                  {dict('PC.Pages.MorePage.ApiKeyPermission.collapseAll')}
                </Button>
              </Space>
            )}
          </div>

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
              treeData.length > 0 ? (
                <Tree
                  checkable
                  checkStrictly={false}
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                  checkedKeys={checkedKeys}
                  onCheck={(keys: any) => {
                    setCheckedKeys(keys);
                  }}
                  treeData={treeData as any}
                  fieldNames={{
                    title: 'name',
                    key: 'key',
                    children: 'apiList',
                  }}
                  titleRender={titleRender}
                  blockNode
                />
              ) : (
                !loading && (
                  <Empty
                    description={dict(
                      'PC.Pages.MorePage.ApiKeyPermission.noPermissionDefs',
                    )}
                  />
                )
              )
            ) : modelTreeData.length > 0 ? (
              <Tree
                checkable
                checkStrictly={false}
                checkedKeys={checkedModelKeys.map(String)}
                onCheck={(keys: any) => {
                  const actualKeys = Array.isArray(keys) ? keys : keys.checked;
                  const ids = actualKeys
                    .map((k: any) => Number(k))
                    .filter((n: number) => !isNaN(n));
                  setCheckedModelKeys(ids);
                }}
                treeData={modelTreeData as any}
                fieldNames={{ title: 'name', key: 'key' }}
                titleRender={modelTitleRender}
                blockNode
              />
            ) : (
              !loading && (
                <Empty
                  description={dict(
                    'PC.Pages.MorePage.ApiKeyPermission.noModelDefs',
                  )}
                />
              )
            )}
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default ApiKeyPermissionModal;
