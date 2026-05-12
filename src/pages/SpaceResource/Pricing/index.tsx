import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { SkillPricingInfo } from '@/types/interfaces/subscription';
import { modalConfirm } from '@/utils/ant-custom';
import { formatPrice } from '@/utils/format';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  Segmented,
  Select,
  Switch,
  Tag,
  message,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { useParams, useRequest } from 'umi';
import {
  apiCreateSkillPricing,
  apiDeleteSkillPricing,
  apiDeleteToolPricing,
  apiListPricingConfig,
  apiListSkillPricing,
  apiToggleSkillPricing,
  apiUpdateSkillPricing,
  apiUpdateToolPricing,
} from '../services/resource';
import {
  QueryPricingConfigInfo,
  ResourcePricingStatus,
  ToolPricingInfo,
  ToolPricingPricingType,
  ToolPricingTargetType,
} from '../types/resource';
import styles from './index.less';
import ModelPricingModal from './ModelPricingModal';
import { useCrudTab } from './useCrudTab';

// ─── Category helpers ───

const CATEGORY_MAP: Record<string, { color: string; label: string }> = {
  plugin: {
    color: 'purple',
    label: dict('PC.Pages.SpaceResourcePricing.categoryPlugin'),
  },
  workflow: {
    color: 'orange',
    label: dict('PC.Pages.SpaceResourcePricing.categoryWorkflow'),
  },
  mcp: {
    color: 'cyan',
    label: dict('PC.Pages.SpaceResourcePricing.categoryMCP'),
  },
  voice: {
    color: 'purple',
    label: dict('PC.Pages.SpaceResourcePricing.categoryVoice'),
  },
  vision: {
    color: 'blue',
    label: dict('PC.Pages.SpaceResourcePricing.categoryVision'),
  },
  text: {
    color: 'green',
    label: dict('PC.Pages.SpaceResourcePricing.categoryText'),
  },
};

// 定价类型标签映射
const PRICING_TYPE_LABEL_MAP: Record<ToolPricingPricingType, string> = {
  [ToolPricingPricingType.ONE_TIME]: '单次',
  [ToolPricingPricingType.BUYOUT]: '买断',
  [ToolPricingPricingType.MONTHLY]: '包月',
  [ToolPricingPricingType.SUBSCRIPTION_PLAN]: '订阅计划',
  [ToolPricingPricingType.TIERED]: '阶梯计费',
};

function getCatTag(cat: string) {
  const c = CATEGORY_MAP[cat];
  return c ? <Tag color={c.color}>{c.label}</Tag> : <Tag>{cat}</Tag>;
}

const SKILL_CATALOG: { name: string; category: string; description: string }[] =
  [
    {
      name: 'Text-to-Speech',
      category: 'voice',
      description: '将文字转换为自然流畅的语音输出，支持多种音色',
    },
    {
      name: '图像识别',
      category: 'vision',
      description: '识别图像中的物体、场景和文字内容',
    },
    {
      name: '情感分析',
      category: 'text',
      description: '分析文本中的情感倾向，支持正面/负面/中性分类',
    },
    {
      name: '关键词提取',
      category: 'text',
      description: '从文本中自动提取核心关键词和短语',
    },
    {
      name: '人脸检测',
      category: 'vision',
      description: '检测图像中的人脸位置、特征和属性',
    },
    {
      name: '文本翻译',
      category: 'text',
      description: '支持多语种间的文本翻译服务',
    },
    {
      name: '智能问答',
      category: 'text',
      description: '基于知识库的智能问答服务',
    },
    {
      name: '文档比对',
      category: 'text',
      description: '快速比对两份文档的差异与相似度',
    },
    {
      name: 'OCR识别',
      category: 'vision',
      description: '图片中文字识别与提取，支持印刷体和手写体',
    },
  ];

const ModelPricingTab: React.FC<{ spaceId: number }> = ({ spaceId }) => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<QueryPricingConfigInfo | null>(null);
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>();

  // 删除定价配置
  const { run: removePricingConfig } = useRequest(apiDeleteToolPricing, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Pages.SpaceResourcePricing.deleteSuccess'));
      actionRef.current?.reload();
    },
    onError: () => {
      message.error(dict('PC.Common.Global.operationFailed'));
    },
  });

  // 更新定价配置（切换收费状态）
  const { run: runUpdateToolPricing } = useRequest(apiUpdateToolPricing, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Common.Global.operationSuccess'));
      actionRef.current?.reload();
    },
    onError: () => {
      message.error(dict('PC.Common.Global.operationFailed'));
    },
  });

  // 新增模型定价
  const openAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  // 编辑模型定价
  const openEdit = (item: QueryPricingConfigInfo) => {
    setEditItem(item);
    setModalOpen(true);
  };

  // 获取模型定价列表
  const request = async () => {
    setLoading(true);
    const res = await apiListPricingConfig({
      targetType: ToolPricingTargetType.MODEL,
      spaceId,
    });
    setLoading(false);

    if (res.code !== SUCCESS_CODE) {
      message.error(
        res.message || dict('PC.Pages.SpaceResourcePricing.fetchDataFailed'),
      );
      return { data: [], total: 0, success: false };
    }

    const data = res.data || [];
    return {
      data,
      total: data.length,
      success: true,
    };
  };

  // 删除模型定价
  const handleDelete = (item: QueryPricingConfigInfo) => {
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.targetObjectInfo?.name || '',
      () => removePricingConfig(item.id),
    );
  };

  /**
   * 切换模型定价状态（开启/关闭收费）
   */
  const handleToggleStatus = (
    item: QueryPricingConfigInfo,
    checked: boolean,
  ) => {
    runUpdateToolPricing({
      ...item,
      status: checked
        ? ResourcePricingStatus.ENABLED
        : ResourcePricingStatus.DISABLED,
    });
  };

  // 模型定价列表列配置
  const columns: ProColumns<QueryPricingConfigInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.modelName'),
      dataIndex: 'targetId',
      key: 'targetId',
      width: 200,
      fixed: 'left',
      render: (_, record) => record.targetId || '',
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.provider'),
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
      render: (_, record) => record.targetObjectInfo?.name || '',
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.pricingType'),
      dataIndex: 'pricingType',
      key: 'pricingType',
      width: 120,
      render: (_, record) =>
        record.pricingType
          ? PRICING_TYPE_LABEL_MAP[
              record.pricingType as ToolPricingPricingType
            ] || record.pricingType
          : '',
    },
    // 定价档位
    {
      title: dict('PC.Pages.SpaceResourcePricing.pricingTier'),
      key: 'tiers',
      render: (_, record) => (
        <div className={styles.tierTags}>
          {/* 模型阶梯价格配置 */}
          {(record.modelPriceTiers || []).map((tier, index) => (
            <Tag key={index} className={styles.tierTag}>
              <span
                className={styles.tierTagContext}
              >{`≤${tier.contextLength}K`}</span>
              <span className={styles.tierTagSeparator}>|</span>
              <span className={styles.tierTagPriceItem}>
                {dict('PC.Pages.SpaceResourcePricing.inputPriceLabel')}¥
                {formatPrice(tier.inputPrice)}
              </span>
              <span className={styles.tierTagSeparator}>|</span>
              <span className={styles.tierTagPriceItem}>
                {dict('PC.Pages.SpaceResourcePricing.outputPriceLabel')}¥
                {formatPrice(tier.outputPrice)}
              </span>
              {/* 缓存价格 */}
              {tier.cachePrice > 0 ? (
                <>
                  <span className={styles.tierTagSeparator}>|</span>
                  <span className={styles.tierTagCachePrice}>
                    {dict('PC.Pages.SpaceResourcePricing.cachePriceLabel')}¥
                    {formatPrice(tier.cachePrice)}
                  </span>
                </>
              ) : (
                ''
              )}
            </Tag>
          ))}
        </div>
      ),
    },
    // 计费开关
    {
      title: dict('PC.Pages.SpaceResourcePricing.billingSwitch'),
      key: 'enabled',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.status === ResourcePricingStatus.ENABLED}
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'edit',
              label: dict('PC.Common.Global.edit'),
              onClick: (row) => openEdit(row),
            },
            {
              key: 'delete',
              label: dict('PC.Common.Global.delete'),
              danger: true,
              onClick: (row) => handleDelete(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className={styles.tabHeader}>
        <h4 className={styles.tabTitle}>
          {dict('PC.Pages.SpaceResourcePricing.modelTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {dict('PC.Pages.SpaceResourcePricing.addModel')}
        </Button>
      </div>
      <XProTable<QueryPricingConfigInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        loading={loading}
        pagination={false}
        request={request}
      />
      <ModelPricingModal
        spaceId={spaceId}
        open={modalOpen}
        isEdit={!!editItem}
        editItem={editItem}
        form={form}
        onCancel={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          actionRef.current?.reload();
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════
//  ToolPricingTab
// ═══════════════════════════════════════════

const ToolPricingTab: React.FC<{ spaceId: number }> = ({ spaceId }) => {
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const actionRef = useRef<ActionType>();

  console.log('ToolPricingTab', spaceId);

  // const crud = useCrudTab<ToolPricingInfo>({
  //   spaceId,
  //   listApi: apiListPricingConfig,
  //   createApi: apiCreateToolPricing,
  //   updateApi: apiUpdateToolPricing,
  //   deleteApi: apiDeleteToolPricing,
  //   toggleApi: apiToggleToolPricing,
  // });

  // const filteredList = crud.list.filter((t) => {
  //   const matchKeyword = !keyword || t.name.includes(keyword);
  //   const matchCategory = !categoryFilter || t.category === categoryFilter;
  //   return matchKeyword && matchCategory;
  // });

  const columns: ProColumns<ToolPricingInfo>[] = [
    // {
    //   title: dict('PC.Pages.SpaceResourcePricing.toolName'),
    //   dataIndex: 'name',
    //   key: 'name',
    //   width: 200,
    //   render: (_, record) => (
    //     <div className={styles.toolNameCell}>
    //       <span
    //         className={styles.toolIcon}
    //         style={{
    //           background:
    //             record.category === 'plugin'
    //               ? '#7c3aed'
    //               : record.category === 'workflow'
    //               ? '#ea580c'
    //               : '#0891b2',
    //         }}
    //       >
    //         {record.name.charAt(0)}
    //       </span>
    //       <div>
    //         <div className={styles.toolName}>{record.name}</div>
    //         <div className={styles.toolDesc}>{record.description}</div>
    //       </div>
    //     </div>
    //   ),
    // },
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
      // render: (_, record) => (
      //   <span>
      //     <span className={styles.boldValue}>¥{formatPrice(record.price)}</span>
      //     <span className={styles.muted}> / {record.period}</span>
      //     {record.trialCount > 0 && (
      //       <Tag color="green" style={{ marginLeft: 6 }}>
      //         {dict('PC.Pages.SpaceResourcePricing.trialCount')}{' '}
      //         {record.trialCount}
      //       </Tag>
      //     )}
      //   </span>
      // ),
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.billingSwitch'),
      key: 'enabled',
      width: 100,
      align: 'center',
      // render: (_, record) => (
      //   // <Switch
      //   //   size="small"
      //   //   checked={record.enabled}
      //   //   onChange={(v) => crud.handleToggle(record, v)}
      //   // />
      // ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      width: 120,
      align: 'center',
      // render: (_, record) => (
      //   <TableActions
      //     record={record}
      //     actions={[
      //       {
      //         key: 'edit',
      //         label: dict('PC.Common.Global.edit'),
      //         onClick: (r) => crud.openEdit(r),
      //       },
      //       {
      //         key: 'delete',
      //         label: dict('PC.Common.Global.delete'),
      //         danger: true,
      //         confirm: { title: dict('PC.Common.Global.confirmDelete') },
      //         onClick: (r) => crud.handleDelete(r),
      //       },
      //     ]}
      //   />
      // ),
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
        // dataSource={filteredList}
        // loading={crud.loading}
        pagination={false}
        search={false}
      />
      <div className={styles.billingNotice}>
        <span className={styles.noticeIcon}>ⓘ</span>
        <span>{dict('PC.Pages.SpaceResourcePricing.billingNotice')}</span>
      </div>
      {/* <Drawer
        title={
          crud.editItem
            ? dict('PC.Pages.SpaceResourcePricing.editTool')
            : dict('PC.Pages.SpaceResourcePricing.addTool')
        }
        open={crud.modalOpen}
        onClose={() => crud.setModalOpen(false)}
        width={480}
        footer={
          <div className={styles.drawerFooter}>
            <Button onClick={() => crud.setModalOpen(false)}>
              {dict('PC.Common.Global.cancel')}
            </Button>
            <Button
              type="primary"
              onClick={() => crud.handleSave()}
              loading={crud.saving}
            >
              {crud.editItem
                ? dict('PC.Common.Global.save')
                : dict('PC.Common.Global.confirm')}
            </Button>
          </div>
        }
      >
        <Form form={crud.form} layout="vertical">
          <Form.Item
            name="name"
            label={dict('PC.Pages.SpaceResourcePricing.toolName')}
            rules={[{ required: true }]}
          >
            {crud.editItem ? (
              <Input disabled />
            ) : (
              <Select
                placeholder={dict(
                  'PC.Pages.SpaceResourcePricing.selectPlaceholder',
                )}
                onChange={(v) => {
                  const t = TOOL_CATALOG.find((c) => c.name === v);
                  if (t)
                    crud.form.setFieldsValue({
                      name: t.name,
                      category: t.category,
                      description: t.description,
                    });
                }}
              >
                {TOOL_CATALOG.map((t) => (
                  <Select.Option key={t.name} value={t.name}>
                    {t.name}
                  </Select.Option>
                ))}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            name="category"
            label={dict('PC.Pages.SpaceResourcePricing.category')}
          >
            <Select disabled>
              <Select.Option value="plugin">
                {dict('PC.Pages.SpaceResourcePricing.categoryPlugin')}
              </Select.Option>
              <Select.Option value="workflow">
                {dict('PC.Pages.SpaceResourcePricing.categoryWorkflow')}
              </Select.Option>
              <Select.Option value="mcp">
                {dict('PC.Pages.SpaceResourcePricing.categoryMCP')}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label={dict('PC.Pages.SpaceResourcePricing.description')}
          >
            <Input.TextArea rows={2} disabled />
          </Form.Item>
          <Form.Item
            name="price"
            label={dict('PC.Pages.SpaceResourcePricing.price')}
            rules={[{ required: true }]}
          >
            <InputNumber min={0} step={0.001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="period"
            label={dict('PC.Pages.SpaceResourcePricing.period')}
            initialValue="次"
          >
            <Select>
              <Select.Option value="次">
                {dict('PC.Pages.SpaceResourcePricing.periodOnce')}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="trialCount"
            label={dict('PC.Pages.SpaceResourcePricing.trialCount')}
            initialValue={0}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Drawer> */}
    </div>
  );
};

// ═══════════════════════════════════════════
//  SkillPricingTab
// ═══════════════════════════════════════════

const SkillPricingTab: React.FC<{ spaceId: number }> = ({ spaceId }) => {
  const [pricingModel, setPricingModel] = useState<'buyout' | 'monthly'>(
    'buyout',
  );
  const actionRef = useRef<ActionType>();

  const crud = useCrudTab<SkillPricingInfo>({
    spaceId,
    listApi: apiListSkillPricing,
    createApi: apiCreateSkillPricing,
    updateApi: apiUpdateSkillPricing,
    deleteApi: apiDeleteSkillPricing,
    toggleApi: apiToggleSkillPricing,
  });

  const handleSave = () => {
    crud.handleSave({ pricingModel });
  };

  const openAdd = () => {
    setPricingModel('buyout');
    crud.openAdd();
  };

  const openEdit = (item: SkillPricingInfo) => {
    setPricingModel(item.pricingModel);
    crud.openEdit(item);
  };

  const columns: ProColumns<SkillPricingInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.skillName'),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (_, record) => (
        <div className={styles.toolNameCell}>
          <span
            className={styles.toolIcon}
            style={{
              background:
                record.category === 'voice'
                  ? '#7c3aed'
                  : record.category === 'vision'
                  ? '#2563eb'
                  : '#16a34a',
            }}
          >
            {record.name.charAt(0)}
          </span>
          <span className={styles.toolName}>{record.name}</span>
        </div>
      ),
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.category'),
      dataIndex: 'category',
      key: 'category',
      width: 90,
      render: (_, record) => getCatTag(record.category),
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
      width: 160,
      render: (_, record) => (
        <span>
          <span className={styles.boldValue}>¥{formatPrice(record.price)}</span>
          {record.pricingModel === 'monthly' && (
            <span className={styles.muted}>
              /{dict('PC.Pages.SpaceAgentSubscriptions.cycleMonthly')}
            </span>
          )}
          <Tag
            color={record.pricingModel === 'monthly' ? 'cyan' : 'orange'}
            style={{ marginLeft: 6 }}
          >
            {record.pricingModel === 'monthly'
              ? dict('PC.Pages.SpaceResourcePricing.pricingModeMonthly')
              : dict('PC.Pages.SpaceResourcePricing.pricingModeBuyout')}
          </Tag>
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.billingSwitch'),
      key: 'enabled',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.enabled}
          onChange={(v) => crud.handleToggle(record, v)}
        />
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'edit',
              label: dict('PC.Common.Global.edit'),
              onClick: (r) => openEdit(r),
            },
            {
              key: 'delete',
              label: dict('PC.Common.Global.delete'),
              danger: true,
              confirm: { title: dict('PC.Common.Global.confirmDelete') },
              onClick: (r) => crud.handleDelete(r),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className={styles.tabHeader}>
        <h4 className={styles.tabTitle}>
          {dict('PC.Pages.SpaceResourcePricing.skillTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {dict('PC.Pages.SpaceResourcePricing.addSkill')}
        </Button>
      </div>
      <XProTable<SkillPricingInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        dataSource={crud.list}
        loading={crud.loading}
        pagination={false}
        search={false}
      />
      <Drawer
        title={
          crud.editItem
            ? dict('PC.Pages.SpaceResourcePricing.editSkill')
            : dict('PC.Pages.SpaceResourcePricing.addSkill')
        }
        open={crud.modalOpen}
        onClose={() => crud.setModalOpen(false)}
        width={480}
        footer={
          <div className={styles.drawerFooter}>
            <Button onClick={() => crud.setModalOpen(false)}>
              {dict('PC.Common.Global.cancel')}
            </Button>
            <Button type="primary" onClick={handleSave} loading={crud.saving}>
              {crud.editItem
                ? dict('PC.Common.Global.save')
                : dict('PC.Common.Global.confirm')}
            </Button>
          </div>
        }
      >
        <Form form={crud.form} layout="vertical">
          <Form.Item
            name="name"
            label={dict('PC.Pages.SpaceResourcePricing.skillName')}
            rules={[{ required: true }]}
          >
            {crud.editItem ? (
              <Input disabled />
            ) : (
              <Select
                placeholder={dict(
                  'PC.Pages.SpaceResourcePricing.selectPlaceholder',
                )}
                onChange={(v) => {
                  const s = SKILL_CATALOG.find((c) => c.name === v);
                  if (s)
                    crud.form.setFieldsValue({
                      name: s.name,
                      category: s.category,
                      description: s.description,
                    });
                }}
              >
                {SKILL_CATALOG.map((s) => (
                  <Select.Option key={s.name} value={s.name}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            name="category"
            label={dict('PC.Pages.SpaceResourcePricing.category')}
          >
            <Select disabled>
              <Select.Option value="voice">
                {dict('PC.Pages.SpaceResourcePricing.categoryVoice')}
              </Select.Option>
              <Select.Option value="vision">
                {dict('PC.Pages.SpaceResourcePricing.categoryVision')}
              </Select.Option>
              <Select.Option value="text">
                {dict('PC.Pages.SpaceResourcePricing.categoryText')}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label={dict('PC.Pages.SpaceResourcePricing.description')}
          >
            <Input.TextArea rows={2} disabled />
          </Form.Item>
          <Form.Item
            label={dict('PC.Pages.SpaceResourcePricing.pricingMode')}
            required
          >
            <Radio.Group
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value)}
              className={styles.pricingModelRadio}
            >
              <Radio value="buyout">
                {dict('PC.Pages.SpaceResourcePricing.pricingModeBuyout')}
              </Radio>
              <Radio value="monthly">
                {dict('PC.Pages.SpaceResourcePricing.pricingModeMonthly')}
              </Radio>
            </Radio.Group>
            <div className={styles.pricingModeHint}>
              {pricingModel === 'buyout'
                ? dict('PC.Pages.SpaceResourcePricing.buyoutHint')
                : dict('PC.Pages.SpaceResourcePricing.monthlyHint')}
            </div>
          </Form.Item>
          <Form.Item
            name="price"
            label={dict('PC.Pages.SpaceResourcePricing.price')}
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              prefix="¥"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

// ═══════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════

const SpaceResourcePricing: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  const tabOptions = useMemo(
    () => [
      {
        value: 'model',
        label: dict('PC.Pages.SpaceResourcePricing.tabModelPricing'),
      },
      {
        value: 'tool',
        label: dict('PC.Pages.SpaceResourcePricing.tabToolPricing'),
      },
      {
        value: 'skill',
        label: dict('PC.Pages.SpaceResourcePricing.tabSkillPricing'),
      },
    ],
    [],
  );

  const [activeTab, setActiveTab] = useState<string>('model');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'model':
        return <ModelPricingTab spaceId={spaceId} />;
      case 'tool':
        return <ToolPricingTab spaceId={spaceId} />;
      case 'skill':
        return <SkillPricingTab spaceId={spaceId} />;
      default:
        return null;
    }
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SpaceResourcePricing.pageTitle')}
      hideScroll
    >
      <Segmented
        options={tabOptions}
        value={activeTab}
        onChange={(v) => setActiveTab(v as string)}
        className={styles.segmented}
      />
      {renderTabContent()}
    </WorkspaceLayout>
  );
};

export default SpaceResourcePricing;
