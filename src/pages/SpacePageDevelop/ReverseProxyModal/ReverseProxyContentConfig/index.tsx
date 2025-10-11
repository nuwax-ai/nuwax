import { apiPageBatchConfigProxy } from '@/services/pageDev';
import {
  ProxyConfig,
  ReverseProxyContentConfigProps,
} from '@/types/interfaces/pageDev';
import { hasDuplicate } from '@/utils/common';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Input, message, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 反向代理内容配置
 */
const ReverseProxyContentConfig: React.FC<ReverseProxyContentConfigProps> = ({
  projectId,
  reverseProxyType,
  proxyConfigs,
  onConfirm,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  // 所有反向代理配置（包括开发环境和生产环境）
  const [allProxyConfigs, setAllProxyConfigs] = useState<ProxyConfig[]>([]);

  useEffect(() => {
    // 添加key值
    const _list =
      proxyConfigs?.map((item) => {
        return {
          ...item,
          key: uuidv4(),
        };
      }) || [];
    setAllProxyConfigs(_list);
  }, [reverseProxyType, proxyConfigs]);

  // 当前反向代理配置
  const currentProxyConfigs = useMemo(() => {
    return (
      allProxyConfigs?.filter((item) => item.env === reverseProxyType) || []
    );
  }, [allProxyConfigs, reverseProxyType]);

  // 配置反向代理
  const { run: runSave } = useRequest(apiPageBatchConfigProxy, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('保存成功');
      setLoading(false);
      onConfirm(allProxyConfigs);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 保存
  const handleSave = async () => {
    setLoading(true);
    // 判断路径是否存在重复
    const isExistSamePath = hasDuplicate(currentProxyConfigs || [], 'path');
    if (isExistSamePath) {
      message.error('路径不能相同');
      setLoading(false);
      return;
    }

    runSave({
      projectId,
      proxyConfigs: allProxyConfigs,
    });
  };

  // 更新节点字段
  const updateNodeField = (key: React.Key, field: string, value: React.Key) => {
    return allProxyConfigs.map((node) => {
      if (node.key === key) {
        // 后端地址字段
        if (field === 'backends') {
          const _backends = [
            {
              backend: value.toString(),
              weight: 1,
            },
          ];
          return { ...node, backends: _backends };
        }

        // 路径字段
        return { ...node, [field]: value };
      }
      return node;
    });
  };

  // 输入框值改变
  const handleInputValue = (key: string, attr: string, value: string) => {
    const _proxyConfig = updateNodeField(key, attr, value);
    console.log(_proxyConfig, ' _proxyConfig');
    setAllProxyConfigs(_proxyConfig);
  };

  // 新增配置
  const handleAddConfig = () => {
    setAllProxyConfigs([
      ...allProxyConfigs,
      {
        key: uuidv4(),
        env: reverseProxyType,
        path: '',
        backends: [
          {
            backend: '',
            weight: 1,
          },
        ],
        healthCheckPath: '',
        requireAuth: false,
      },
    ]);
  };

  const handleDeleteConfig = (key: string) => {
    const _proxyConfig = allProxyConfigs.filter((item) => item.key !== key);
    setAllProxyConfigs(_proxyConfig);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<ProxyConfig> = [
    {
      title: '路径',
      dataIndex: 'path',
      render: (_, record) => (
        <Input
          placeholder="请输入路径"
          value={record.path}
          onChange={(e) => handleInputValue(record.key, 'path', e.target.value)}
        />
      ),
    },
    {
      title: '后端地址',
      dataIndex: 'backends',
      render: (_, record) => (
        <Input
          placeholder="请输入后端地址"
          value={record.backends[0].backend}
          onChange={(e) =>
            handleInputValue(record.key, 'backends', e.target.value)
          }
        />
      ),
    },
    {
      title: () => (
        <Button icon={<PlusOutlined />} onClick={handleAddConfig}>
          新增配置
        </Button>
      ),
      dataIndex: 'action',
      width: 150,
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteConfig(record.key)}
          ></Button>
        </div>
      ),
    },
  ];

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <Table<ProxyConfig>
        className={cx('flex-1')}
        columns={inputColumns}
        dataSource={proxyConfigs}
        loading={loading}
        pagination={false}
        virtual
        scroll={{
          y: 320,
        }}
      />
      <footer className={cx('text-right', 'mb-16', 'px-16')}>
        <Button type="primary" onClick={handleSave} loading={loading}>
          保存
        </Button>
      </footer>
    </div>
  );
};

export default ReverseProxyContentConfig;
