import type {
  CreateDataResourceRequest,
  DataResource,
  DataResourceOperationResult,
  DataResourceQueryParams,
  UpdateDataResourceRequest,
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
    async (params?: DataResourceQueryParams) => {
      try {
        setLoading(true);

        // 模拟API调用
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 500);
        });

        // 模拟数据 - 只包含工作流、插件、反向代理三种类型
        const mockResources: DataResource[] = [
          {
            id: '1',
            name: '站内消息发送',
            description: '发送站内消息的工作流',
            type: 'workflow',
            status: 'active',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            config: {
              filePath: '/workflows/message-sender.yaml',
              triggerType: 'event',
            },
            tags: ['消息', '通知'],
            enabled: true,
          },
          {
            id: '2',
            name: '数据处理插件',
            description: '用于数据清洗和转换的插件',
            type: 'plugin',
            status: 'active',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date(Date.now() - 7200000).toISOString(),
            config: {
              packagePath: '/plugins/data-processor',
              version: '1.0.0',
              entry: 'index.js',
            },
            tags: ['数据', '处理'],
            enabled: true,
          },
          {
            id: '3',
            name: 'API代理服务',
            description: '代理外部API服务的反向代理',
            type: 'reverse_proxy',
            status: 'active',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            updatedAt: new Date(Date.now() - 10800000).toISOString(),
            config: {
              targetUrl: 'https://api.external.com',
              proxyPath: '/api/v1',
              timeout: 30,
            },
            tags: ['API', '代理'],
            enabled: true,
          },
          {
            id: '4',
            name: '文件处理工作流',
            description: '处理文件上传和转换的工作流',
            type: 'workflow',
            status: 'configuring',
            createdAt: new Date(Date.now() - 345600000).toISOString(),
            updatedAt: new Date(Date.now() - 14400000).toISOString(),
            config: {
              filePath: '/workflows/file-processor.yaml',
              triggerType: 'manual',
            },
            tags: ['文件', '处理'],
            enabled: false,
          },
        ];

        // 根据查询参数过滤数据
        let filteredResources = mockResources;

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
    [],
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
          status: 'active',
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
    async (resourceId: string): Promise<DataResourceOperationResult> => {
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
      resourceId: string,
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
                  status: enabled ? 'active' : 'inactive',
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
