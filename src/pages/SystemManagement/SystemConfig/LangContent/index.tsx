import WorkspaceLayout from '@/components/WorkspaceLayout';
import { apiI18nConfigList } from '@/services/i18n';
import type { I18nSlideLangInfo } from '@/types/interfaces/i18n';
import {
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { Button, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { history, useParams, useRequest } from 'umi';

/**
 * 语言内容页面
 */
const LangContent: React.FC = () => {
  const { lang } = useParams();
  const [moduleKeyword, setModuleKeyword] = useState<string>('');
  const [keyKeyword, setKeyKeyword] = useState<string>('');
  const [valueKeyword, setValueKeyword] = useState<string>('');

  const side = String(history.location.query?.side || 'PC');
  const langName = String(
    history.location.query?.langName || lang.toUpperCase(),
  );

  const { data: configList = [], loading } = useRequest(
    () => apiI18nConfigList(side, lang),
    {
      refreshDeps: [side, lang],
    },
  );

  const filteredData = useMemo(() => {
    return (configList || []).filter((item: I18nSlideLangInfo) => {
      const moduleText = String(item.key || '').split('.')[0] || '-';
      const matchModule = moduleText
        .toLowerCase()
        .includes(moduleKeyword.trim().toLowerCase());
      const matchKey = String(item.key || '')
        .toLowerCase()
        .includes(keyKeyword.trim().toLowerCase());
      const matchValue = String(item.value || '')
        .toLowerCase()
        .includes(valueKeyword.trim().toLowerCase());
      return matchModule && matchKey && matchValue;
    });
  }, [configList, moduleKeyword, keyKeyword, valueKeyword]);

  const columns: ColumnsType<I18nSlideLangInfo> = [
    {
      title: '模块',
      key: 'module',
      width: 120,
      render: (_, record) => {
        const moduleText = String(record.key || '').split('.')[0] || '-';
        return <Tag>{moduleText}</Tag>;
      },
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 220,
    },
    {
      title: '文本内容',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: () => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} />
          <Button type="text" icon={<TranslationOutlined />} />
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <WorkspaceLayout
      title={`${langName} (${lang}) - 键值对管理`}
      rightSlot={
        <>
          <Button icon={<DownOutlined />}>翻译全部</Button>
          <Button type="primary" icon={<PlusOutlined />}>
            添加键值对
          </Button>
          <Button icon={<CloseOutlined />} onClick={() => history.back()}>
            关闭
          </Button>
        </>
      }
    >
      <Space style={{ width: '100%', marginBottom: 12 }} size="middle">
        <Input
          allowClear
          placeholder="搜索模块..."
          value={moduleKeyword}
          onChange={(e) => setModuleKeyword(e.target.value)}
        />
        <Input
          allowClear
          placeholder="搜索 Key..."
          value={keyKeyword}
          onChange={(e) => setKeyKeyword(e.target.value)}
        />
        <Input
          allowClear
          placeholder="搜索文本内容..."
          value={valueKeyword}
          onChange={(e) => setValueKeyword(e.target.value)}
        />
      </Space>

      <Table<I18nSlideLangInfo>
        rowKey={(record) => `${record.key || ''}-${record.lang || ''}`}
        loading={loading}
        dataSource={filteredData}
        pagination={false}
        columns={columns}
      />
    </WorkspaceLayout>
  );
};

export default LangContent;
