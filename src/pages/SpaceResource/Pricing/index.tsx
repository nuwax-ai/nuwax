import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  apiCreateModelPricing,
  apiCreateSkillPricing,
  apiCreateToolPricing,
  apiDeleteModelPricing,
  apiDeleteSkillPricing,
  apiDeleteToolPricing,
  apiListModelPricing,
  apiListSkillPricing,
  apiListToolPricing,
  apiToggleModelPricing,
  apiToggleSkillPricing,
  apiToggleToolPricing,
  apiUpdateModelPricing,
  apiUpdateSkillPricing,
  apiUpdateToolPricing,
} from '@/services/subscriptionService';
import type {
  ModelPriceTier,
  ModelPricingInfo,
  SkillPricingInfo,
  ToolPricingInfo,
} from '@/types/interfaces/subscription';
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
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { useParams } from 'umi';
import styles from './index.less';
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

function getCatTag(cat: string) {
  const c = CATEGORY_MAP[cat];
  return c ? <Tag color={c.color}>{c.label}</Tag> : <Tag>{cat}</Tag>;
}

// ─── Modal selector catalogs ───

const TOOL_CATALOG: { name: string; category: string; description: string }[] =
  [
    {
      name: 'GPT-4o 文本生成',
      category: 'plugin',
      description: '支持多轮对话与复杂推理任务，高精度自然语言生成',
    },
    {
      name: 'DALL·E 图像生成',
      category: 'plugin',
      description: '根据文本描述生成高质量图像，支持多种风格',
    },
    {
      name: '语音识别引擎',
      category: 'plugin',
      description: '多语种语音转文字，支持实时流式识别',
    },
    {
      name: '视频分析插件',
      category: 'plugin',
      description: '视频内容识别、场景检测与物体追踪',
    },
    {
      name: '数据可视化引擎',
      category: 'plugin',
      description: '将原始数据转换为交互式图表与仪表盘',
    },
    {
      name: 'PDF 解析插件',
      category: 'plugin',
      description: '高效解析 PDF 文档，提取文本、表格与图片',
    },
    {
      name: 'Claude 长文本分析',
      category: 'workflow',
      description: '超长上下文窗口，适合文档分析与摘要',
    },
    {
      name: '日报自动生成',
      category: 'workflow',
      description: '每日自动汇总数据并生成结构化报告',
    },
    {
      name: '客户支持工作流',
      category: 'workflow',
      description: '自动分类、分配和响应客户工单',
    },
    {
      name: '数据ETL工作流',
      category: 'workflow',
      description: '定时抽取、转换和加载数据到目标系统',
    },
    {
      name: '文件搜索 MCP',
      category: 'mcp',
      description: '通过 MCP 协议提供本地文件智能搜索能力',
    },
    {
      name: '数据库查询 MCP',
      category: 'mcp',
      description: '通过 MCP 协议执行数据库查询与结果返回',
    },
    {
      name: '网络抓取 MCP',
      category: 'mcp',
      description: '通过 MCP 协议抓取网页内容并结构化输出',
    },
  ];

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

const MODEL_CATALOG: { name: string; provider: string }[] = [
  { name: 'GPT-4o', provider: 'OpenAI' },
  { name: 'GPT-4o-mini', provider: 'OpenAI' },
  { name: 'GPT-4.1', provider: 'OpenAI' },
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { name: 'Claude Opus 4', provider: 'Anthropic' },
  { name: 'DeepSeek-V3', provider: 'DeepSeek' },
  { name: 'DeepSeek-R1', provider: 'DeepSeek' },
  { name: 'Gemini 1.5 Pro', provider: 'Google' },
  { name: 'Gemini 2.0 Flash', provider: 'Google' },
  { name: 'Qwen-Max', provider: '阿里云' },
  { name: 'Qwen-Plus', provider: '阿里云' },
  { name: 'GLM-4', provider: '智谱AI' },
  { name: 'Moonshot-v1', provider: '月之暗面' },
];

// ═══════════════════════════════════════════
//  ModelPricingTab
// ═══════════════════════════════════════════

const ModelPricingTab: React.FC<{ spaceId: number }> = ({ spaceId }) => {
  const [tiers, setTiers] = useState<ModelPriceTier[]>([]);
  const actionRef = useRef<ActionType>();

  const crud = useCrudTab<ModelPricingInfo>({
    spaceId,
    listApi: apiListModelPricing,
    createApi: apiCreateModelPricing,
    updateApi: apiUpdateModelPricing,
    deleteApi: apiDeleteModelPricing,
    toggleApi: apiToggleModelPricing,
  });

  const openAdd = () => {
    crud.openAdd();
    setTiers([
      { label: '≤32K', inputPrice: 0, outputPrice: 0, cachePrice: 0 },
      { label: '≤128K', inputPrice: 0, outputPrice: 0, cachePrice: 0 },
    ]);
  };

  const openEdit = (item: ModelPricingInfo) => {
    crud.openEdit(item);
    setTiers(item.tiers || []);
  };

  const handleSave = () => {
    crud.handleSave({ tiers });
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      { label: '≤32K', inputPrice: 0, outputPrice: 0, cachePrice: 0 },
    ]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (
    index: number,
    field: keyof ModelPriceTier,
    value: string | number,
  ) => {
    const newTiers = [...tiers];
    if (field === 'label') {
      newTiers[index] = { ...newTiers[index], label: value as string };
    } else {
      newTiers[index] = { ...newTiers[index], [field]: value };
    }
    setTiers(newTiers);
  };

  const columns: ProColumns<ModelPricingInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.modelName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.provider'),
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.pricingTier'),
      key: 'tiers',
      width: 340,
      render: (_, record) => (
        <div className={styles.tierTags}>
          {record.tiers?.map((t, i) => (
            <Tag key={i} color="blue" className={styles.tierTag}>
              {t.label} |{' '}
              {dict('PC.Pages.SpaceResourcePricing.inputPriceLabel')}¥
              {formatPrice(t.inputPrice)} |{' '}
              {dict('PC.Pages.SpaceResourcePricing.outputPriceLabel')}¥
              {formatPrice(t.outputPrice)}
              {t.cachePrice > 0
                ? ` | ${dict(
                    'PC.Pages.SpaceResourcePricing.cachePriceLabel',
                  )}¥${formatPrice(t.cachePrice)}`
                : ''}
            </Tag>
          ))}
        </div>
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
          {dict('PC.Pages.SpaceResourcePricing.modelTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {dict('PC.Pages.SpaceResourcePricing.addModel')}
        </Button>
      </div>
      <XProTable<ModelPricingInfo>
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
            ? dict('PC.Pages.SpaceResourcePricing.editModelPricing')
            : dict('PC.Pages.SpaceResourcePricing.addModel')
        }
        open={crud.modalOpen}
        onClose={() => crud.setModalOpen(false)}
        width={520}
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
            label={dict('PC.Pages.SpaceResourcePricing.modelName')}
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
                  const m = MODEL_CATALOG.find((c) => c.name === v);
                  if (m) {
                    crud.form.setFieldsValue({
                      name: m.name,
                      provider: m.provider,
                    });
                  }
                }}
              >
                {MODEL_CATALOG.map((m) => (
                  <Select.Option key={m.name} value={m.name}>
                    {m.name}
                  </Select.Option>
                ))}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            name="provider"
            label={dict('PC.Pages.SpaceResourcePricing.provider')}
            rules={[{ required: true }]}
          >
            <Input disabled />
          </Form.Item>
        </Form>

        <div className={styles.tierSection}>
          <div className={styles.tierSectionHeader}>
            <span className={styles.tierSectionTitle}>
              {dict('PC.Pages.SpaceResourcePricing.pricingTier')}
              <span className={styles.tierSectionHint}>
                {dict('PC.Pages.SpaceResourcePricing.tierHint')}
              </span>
            </span>
            <Button size="small" icon={<PlusOutlined />} onClick={addTier}>
              {dict('PC.Pages.SpaceResourcePricing.addTier')}
            </Button>
          </div>

          {tiers.map((tier, index) => (
            <div key={index} className={styles.tierCard}>
              <div className={styles.tierCardHeader}>
                <div className={styles.tierThreshold}>
                  <span className={styles.tierThresholdPrefix}>≤</span>
                  <InputNumber
                    value={parseInt(tier.label.replace(/[^0-9]/g, '')) || 32}
                    min={1}
                    precision={0}
                    size="small"
                    className={styles.tierThresholdInput}
                    onChange={(v) => updateTier(index, 'label', `≤${v || 32}K`)}
                  />
                  <span className={styles.tierThresholdSuffix}>K</span>
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<span>✕</span>}
                  onClick={() => removeTier(index)}
                  title={dict('PC.Pages.SpaceResourcePricing.removeTier')}
                />
              </div>
              <div className={styles.tierPrices}>
                <div className={styles.tierPriceItem}>
                  <span className={styles.tierPriceLabel}>
                    {dict('PC.Pages.SpaceResourcePricing.inputPriceLabel')}
                  </span>
                  <InputNumber
                    value={tier.inputPrice}
                    min={0}
                    step={0.001}
                    precision={4}
                    size="small"
                    className={styles.tierPriceInput}
                    onChange={(v) => updateTier(index, 'inputPrice', v || 0)}
                  />
                </div>
                <div className={styles.tierPriceItem}>
                  <span className={styles.tierPriceLabel}>
                    {dict('PC.Pages.SpaceResourcePricing.outputPriceLabel')}
                  </span>
                  <InputNumber
                    value={tier.outputPrice}
                    min={0}
                    step={0.001}
                    precision={4}
                    size="small"
                    className={styles.tierPriceInput}
                    onChange={(v) => updateTier(index, 'outputPrice', v || 0)}
                  />
                </div>
                <div className={styles.tierPriceItem}>
                  <span className={styles.tierPriceLabel}>
                    {dict('PC.Pages.SpaceResourcePricing.cachePriceLabel')}
                  </span>
                  <InputNumber
                    value={tier.cachePrice}
                    min={0}
                    step={0.001}
                    precision={4}
                    size="small"
                    className={styles.tierPriceInput}
                    onChange={(v) => updateTier(index, 'cachePrice', v || 0)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Drawer>
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

  const crud = useCrudTab<ToolPricingInfo>({
    spaceId,
    listApi: apiListToolPricing,
    createApi: apiCreateToolPricing,
    updateApi: apiUpdateToolPricing,
    deleteApi: apiDeleteToolPricing,
    toggleApi: apiToggleToolPricing,
  });

  const filteredList = crud.list.filter((t) => {
    const matchKeyword = !keyword || t.name.includes(keyword);
    const matchCategory = !categoryFilter || t.category === categoryFilter;
    return matchKeyword && matchCategory;
  });

  const columns: ProColumns<ToolPricingInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.toolName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (_, record) => (
        <div className={styles.toolNameCell}>
          <span
            className={styles.toolIcon}
            style={{
              background:
                record.category === 'plugin'
                  ? '#7c3aed'
                  : record.category === 'workflow'
                  ? '#ea580c'
                  : '#0891b2',
            }}
          >
            {record.name.charAt(0)}
          </span>
          <div>
            <div className={styles.toolName}>{record.name}</div>
            <div className={styles.toolDesc}>{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.category'),
      dataIndex: 'category',
      key: 'category',
      width: 100,
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
      width: 120,
      render: (_, record) => (
        <span>
          <span className={styles.boldValue}>¥{formatPrice(record.price)}</span>
          <span className={styles.muted}> / {record.period}</span>
          {record.trialCount > 0 && (
            <Tag color="green" style={{ marginLeft: 6 }}>
              {dict('PC.Pages.SpaceResourcePricing.trialCount')}{' '}
              {record.trialCount}
            </Tag>
          )}
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
              onClick: (r) => crud.openEdit(r),
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
          {dict('PC.Pages.SpaceResourcePricing.toolTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={crud.openAdd}>
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
        dataSource={filteredList}
        loading={crud.loading}
        pagination={false}
        search={false}
      />
      <div className={styles.billingNotice}>
        <span className={styles.noticeIcon}>ⓘ</span>
        <span>{dict('PC.Pages.SpaceResourcePricing.billingNotice')}</span>
      </div>
      <Drawer
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
      </Drawer>
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
