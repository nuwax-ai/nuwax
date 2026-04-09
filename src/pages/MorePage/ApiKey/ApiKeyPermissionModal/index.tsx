import { apiApiKeyUpdate, apiGetOpenApiDefinitions } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import type { ApiKeyInfo, OpenApiDefinition } from '@/types/interfaces/account';
import {
  Button,
  Checkbox,
  Empty,
  message,
  Modal,
  Space,
  Spin,
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
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<OpenApiDefinition[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
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

  // 加载权限数据
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiGetOpenApiDefinitions();
      if (res.success) {
        setTreeData(res.data || []);
        // 初始化展开第一层
        setExpandedKeys(res.data?.map((i) => i.key) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      // 回显逻辑：从 record.config.apiConfigs 中提取 key
      if (record?.config?.apiConfigs) {
        const initialKeys = record.config.apiConfigs.map((i: any) => i.key);
        setCheckedKeys(initialKeys);
      } else {
        setCheckedKeys([]);
      }
    }
  }, [open, record]);

  // 处理全选逻辑
  const isAllChecked =
    allLeafKeys.length > 0 && checkedKeys.length === allLeafKeys.length;
  const isIndeterminate =
    checkedKeys.length > 0 && checkedKeys.length < allLeafKeys.length;

  const handleSelectAll = (checked: boolean) => {
    setCheckedKeys(checked ? allLeafKeys : []);
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

  // 自定义渲染节点内容
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
      });

      if (res.success) {
        message.success(
          dict('PC.Pages.MorePage.ApiKeyPermission.permissionSaved'),
        );
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to save permissions:', error); // keep Chinese in console
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Title level={4}>
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
          {/* 顶部操作区 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 8,
            }}
          >
            <Checkbox
              indeterminate={isIndeterminate}
              checked={isAllChecked}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              {dict('PC.Pages.MorePage.ApiKeyPermission.selectAll')}
            </Checkbox>
            <Space>
              <Button size="small" onClick={() => setExpandedKeys(allKeys)}>
                {dict('PC.Pages.MorePage.ApiKeyPermission.expandAll')}
              </Button>
              <Button size="small" onClick={() => setExpandedKeys([])}>
                {dict('PC.Pages.MorePage.ApiKeyPermission.collapseAll')}
              </Button>
            </Space>
          </div>

          {/* Tree 区域 */}
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: '12px',
              maxHeight: '520px',
              overflowY: 'auto',
            }}
          >
            {treeData.length > 0 ? (
              <Tree
                checkable
                checkStrictly={false}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
                checkedKeys={checkedKeys}
                onCheck={(keys: any) => setCheckedKeys(keys)}
                treeData={treeData as any}
                fieldNames={{ title: 'name', key: 'key', children: 'apiList' }}
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
            )}
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default ApiKeyPermissionModal;
