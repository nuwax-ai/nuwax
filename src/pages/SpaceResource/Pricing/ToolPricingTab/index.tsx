import { XProTable } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Input } from 'antd';
import React, { useRef, useState } from 'react';
import { ToolPricingInfo } from '../../types/resource';
import styles from '../index.less';

interface ToolPricingTabProps {
  spaceId: number;
}

/**
 * 工具定价模块
 */
const ToolPricingTab: React.FC<ToolPricingTabProps> = ({ spaceId }) => {
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const actionRef = useRef<ActionType>();

  console.log('ToolPricingTab', spaceId);

  const columns: ProColumns<ToolPricingInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.category'),
      dataIndex: 'category',
      key: 'category',
      width: 100,
      // render: (_, record) => getCatTag(record.category),
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.calls'),
      dataIndex: 'calls',
      key: 'calls',
      width: 100,
      align: 'center',
      render: (v) => (
        <span className={styles.boldValue}>
          {(v as number)?.toLocaleString()}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.price'),
      key: 'price',
      width: 120,
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.billingSwitch'),
      key: 'enabled',
      width: 100,
      align: 'center',
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      width: 120,
      align: 'center',
    },
  ];

  return (
    <div>
      <div className={styles.tabHeader}>
        <h4 className={styles.tabTitle}>
          {dict('PC.Pages.SpaceResourcePricing.toolTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />}>
          {dict('PC.Pages.SpaceResourcePricing.addTool')}
        </Button>
      </div>
      <div className={styles.searchBar}>
        <Input
          placeholder={dict(
            'PC.Pages.SpaceResourcePricing.searchToolPlaceholder',
          )}
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
        <Button
          type={categoryFilter === '' ? 'primary' : 'default'}
          size="small"
          onClick={() => setCategoryFilter('')}
          className={styles.filterBtn}
        >
          {dict('PC.Pages.SpaceResourcePricing.filterAll')}
        </Button>
        <Button
          type={categoryFilter === 'plugin' ? 'primary' : 'default'}
          size="small"
          onClick={() => setCategoryFilter('plugin')}
          className={styles.filterBtn}
        >
          {dict('PC.Pages.SpaceResourcePricing.categoryPlugin')}
        </Button>
        <Button
          type={categoryFilter === 'workflow' ? 'primary' : 'default'}
          size="small"
          onClick={() => setCategoryFilter('workflow')}
          className={styles.filterBtn}
        >
          {dict('PC.Pages.SpaceResourcePricing.categoryWorkflow')}
        </Button>
        <Button
          type={categoryFilter === 'mcp' ? 'primary' : 'default'}
          size="small"
          onClick={() => setCategoryFilter('mcp')}
          className={styles.filterBtn}
        >
          {dict('PC.Pages.SpaceResourcePricing.categoryMCP')}
        </Button>
      </div>
      <XProTable<ToolPricingInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        pagination={false}
        search={false}
      />
      <div className={styles.billingNotice}>
        <span className={styles.noticeIcon}>ⓘ</span>
        <span>{dict('PC.Pages.SpaceResourcePricing.billingNotice')}</span>
      </div>
    </div>
  );
};

export default ToolPricingTab;
