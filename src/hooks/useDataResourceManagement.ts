import { t } from '@/services/i18nRuntime';
import type {
  CreateDataResourceRequest,
  DataResource,
  DataResourceOperationResult,
  UpdateDataResourceRequest,
} from '@/types/interfaces/dataResource';
import {
  DataResourceStatus,
  DataResourceType,
} from '@/types/interfaces/dataResource';
import { message } from 'antd';
import { useCallback, useState } from 'react';

/**
 * 数据资源管理 Hook
 * 提供数据资源的增删改查功能
 */
export const useDataResourceManagement = () => {
  const [resources, setResources] = useState<DataResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  /**
   * 获取数据资源列表
   */
  const fetchResources = useCallback(
    async (dataSources: DataResource[] = []) => {
      try {
        setLoading(true);

        // 将 DataSource 转换为 DataResource 格式
        const convertedResources: DataResource[] = dataSources.map((ds) => ({
          id: ds.id,
          name: ds.name,
          icon: ds.icon || '',
          description: ds.description || '',
          type:
            ds.type === 'plugin'
              ? DataResourceType.PLUGIN
              : DataResourceType.WORKFLOW,
          status:
            ds.status === 'active'
              ? DataResourceStatus.ACTIVE
              : DataResourceStatus.INACTIVE,
          createdAt: ds.createdAt || new Date().toISOString(),
          updatedAt: ds.updatedAt || new Date().toISOString(),
          config: ds.config || {},
          tags: ds.tags || [],
          enabled: ds.enabled !== false,
        }));

        setResources(convertedResources);
        setTotal(convertedResources.length);
      } catch (error) {
        console.error('Failed to fetch data resource list:', error);
        message.error(
          t('PC.Components.DataResourceManagement.fetchListFailed'),
        );
      } finally {
        setLoading(false);
      }
    },
    [setResources, setTotal, setLoading],
  );

  /**
   * 创建数据资源
   */
  const createResource = useCallback(
    async (
      data: CreateDataResourceRequest,
    ): Promise<DataResourceOperationResult> => {
      try {
        setLoading(true);

        // 模拟API调用
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 1000);
        });

        const newResource: DataResource = {
          id: Date.now().toString(),
          name: data.name,
          description: data.description,
          type: data.type,
          status: DataResourceStatus.ACTIVE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          config: data.config,
          tags: data.tags || [],
          enabled: true,
        };

        setResources((prev) => [newResource, ...prev]);
        setTotal((prev) => prev + 1);

        message.success(
          t('PC.Components.DataResourceManagement.createSuccess'),
        );

        return {
          success: true,
          message: t('PC.Components.DataResourceManagement.createSuccess'),
          data: newResource,
        };
      } catch (error) {
        console.error('Failed to create data resource:', error);
        message.error(t('PC.Components.DataResourceManagement.createFailed'));

        return {
          success: false,
          message: t('PC.Components.DataResourceManagement.createFailed'),
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * 更新数据资源
   */
  const updateResource = useCallback(
    async (
      data: UpdateDataResourceRequest,
    ): Promise<DataResourceOperationResult> => {
      try {
        setLoading(true);

        // 模拟API调用
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 800);
        });

        setResources((prev) =>
          prev.map((resource) =>
            resource.id === data.id
              ? {
                  ...resource,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : resource,
          ),
        );

        message.success(
          t('PC.Components.DataResourceManagement.updateSuccess'),
        );

        return {
          success: true,
          message: t('PC.Components.DataResourceManagement.updateSuccess'),
        };
      } catch (error) {
        console.error('Failed to update data resource:', error);
        message.error(t('PC.Components.DataResourceManagement.updateFailed'));

        return {
          success: false,
          message: t('PC.Components.DataResourceManagement.updateFailed'),
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * 删除数据资源
   */
  const deleteResource = useCallback(
    async (resourceId: number): Promise<DataResourceOperationResult> => {
      try {
        setLoading(true);

        // 模拟API调用
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 600);
        });

        setResources((prev) =>
          prev.filter((resource) => resource.id !== resourceId),
        );
        setTotal((prev) => prev - 1);

        message.success(
          t('PC.Components.DataResourceManagement.deleteSuccess'),
        );

        return {
          success: true,
          message: t('PC.Components.DataResourceManagement.deleteSuccess'),
        };
      } catch (error) {
        console.error('Failed to delete data resource:', error);
        message.error(t('PC.Components.DataResourceManagement.deleteFailed'));

        return {
          success: false,
          message: t('PC.Components.DataResourceManagement.deleteFailed'),
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * 切换资源状态
   */
  const toggleResourceStatus = useCallback(
    async (
      resourceId: number,
      enabled: boolean,
    ): Promise<DataResourceOperationResult> => {
      try {
        setLoading(true);

        // 模拟API调用
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 500);
        });

        setResources((prev) =>
          prev.map((resource) =>
            resource.id === resourceId
              ? {
                  ...resource,
                  enabled,
                  status: enabled
                    ? DataResourceStatus.ACTIVE
                    : DataResourceStatus.INACTIVE,
                  updatedAt: new Date().toISOString(),
                }
              : resource,
          ),
        );

        return {
          success: true,
          message: enabled
            ? t('PC.Components.DataResourceManagement.enableSuccess')
            : t('PC.Components.DataResourceManagement.disableSuccess'),
        };
      } catch (error) {
        console.error('Failed to toggle data resource status:', error);
        message.error(
          t('PC.Components.DataResourceManagement.switchStatusFailed'),
        );

        return {
          success: false,
          message: t('PC.Components.DataResourceManagement.operationFailed'),
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * 测试资源连接
   */
  const testResourceConnection =
    useCallback(async (): Promise<DataResourceOperationResult> => {
      try {
        setLoading(true);

        // 模拟API调用
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 2000);
        });

        // 模拟测试结果
        const success = Math.random() > 0.3; // 70% 成功率

        if (success) {
          message.success(
            t('PC.Components.DataResourceManagement.connectionTestSuccess'),
          );
          return {
            success: true,
            message: t(
              'PC.Components.DataResourceManagement.connectionTestSuccess',
            ),
          };
        } else {
          message.error(
            t('PC.Components.DataResourceManagement.connectionTestFailed'),
          );
          return {
            success: false,
            message: t(
              'PC.Components.DataResourceManagement.connectionTestFailed',
            ),
          };
        }
      } catch (error) {
        console.error('Failed to test data resource connection:', error);
        message.error(
          t('PC.Components.DataResourceManagement.connectionTestFailed'),
        );

        return {
          success: false,
          message: t('PC.Components.DataResourceManagement.testFailed'),
        };
      } finally {
        setLoading(false);
      }
    }, []);

  return {
    resources,
    loading,
    total,
    fetchResources,
    createResource,
    updateResource,
    deleteResource,
    toggleResourceStatus,
    testResourceConnection,
  };
};
