import type {
  CreateDataResourceRequest,
  DataResource,
  DataResourceOperationResult,
  DataResourceQueryParams,
  UpdateDataResourceRequest,
} from '@/types/interfaces/dataResource';
import {
  DataResourceStatus,
  DataResourceType,
} from '@/types/interfaces/dataResource';
import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

/**
 * 数据资源管理 Hook
 * 提供数据资源的增删改查功能
 */
export const useDataResourceManagement = (
  projectDataSources: DataResource[],
) => {
  const [resources, setResources] = useState<DataResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  /**
   * 获取数据资源列表
   */
  const fetchResources = useCallback(
    async (params?: DataResourceQueryParams) => {
      try {
        setLoading(true);

        // 从项目数据源中获取真实数据
        let dataSources: DataResource[] = projectDataSources || [];

        // 将 DataSource 转换为 DataResource 格式
        const convertedResources: DataResource[] = dataSources.map((ds) => ({
          id: ds.id,
          name: ds.name,
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

        // 根据查询参数过滤数据
        let filteredResources = convertedResources;

        if (params?.type) {
          filteredResources = filteredResources.filter(
            (r) => r.type === params.type,
          );
        }

        if (params?.status) {
          filteredResources = filteredResources.filter(
            (r) => r.status === params.status,
          );
        }

        if (params?.keyword) {
          const keyword = params.keyword.toLowerCase();
          filteredResources = filteredResources.filter(
            (r) =>
              r.name.toLowerCase().includes(keyword) ||
              r.description?.toLowerCase().includes(keyword),
          );
        }

        setResources(filteredResources);
        setTotal(filteredResources.length);
      } catch (error) {
        console.error('获取数据资源列表失败:', error);
        message.error('获取数据资源列表失败');
      } finally {
        setLoading(false);
      }
    },
    [projectDataSources],
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

        message.success('数据资源创建成功');

        return {
          success: true,
          message: '创建成功',
          data: newResource,
        };
      } catch (error) {
        console.error('创建数据资源失败:', error);
        message.error('创建数据资源失败');

        return {
          success: false,
          message: '创建失败',
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

        message.success('数据资源更新成功');

        return {
          success: true,
          message: '更新成功',
        };
      } catch (error) {
        console.error('更新数据资源失败:', error);
        message.error('更新数据资源失败');

        return {
          success: false,
          message: '更新失败',
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

        message.success('数据资源删除成功');

        return {
          success: true,
          message: '删除成功',
        };
      } catch (error) {
        console.error('删除数据资源失败:', error);
        message.error('删除数据资源失败');

        return {
          success: false,
          message: '删除失败',
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
          message: enabled ? '启用成功' : '停用成功',
        };
      } catch (error) {
        console.error('切换资源状态失败:', error);
        message.error('切换资源状态失败');

        return {
          success: false,
          message: '操作失败',
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
          message.success('连接测试成功');
          return {
            success: true,
            message: '连接测试成功',
          };
        } else {
          message.error('连接测试失败');
          return {
            success: false,
            message: '连接测试失败',
          };
        }
      } catch (error) {
        console.error('测试资源连接失败:', error);
        message.error('测试资源连接失败');

        return {
          success: false,
          message: '测试失败',
        };
      } finally {
        setLoading(false);
      }
    }, []);

  // 当项目数据源变化时，自动刷新资源列表
  useEffect(() => {
    if (projectDataSources) {
      fetchResources();
    }
  }, [projectDataSources]); // 移除 fetchResources 依赖，避免无限循环

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
