import { XProTable } from '@/components/ProComponents';
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
  ModelPricingInfo,
  SkillPricingInfo,
  ToolPricingInfo,
} from '@/types/interfaces/subscription';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Segmented,
  Select,
  Switch,
  Tag,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'umi';

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

function formatPrice(v: number) {
  return v < 0.01 ? v.toFixed(4) : v.toFixed(2);
}

// ─── Tool modal selector data ───

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
  const [list, setList] = useState<ModelPricingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ModelPricingInfo | null>(null);
  const [selectedModelTiers, setSelectedModelTiers] = useState<
    {
      label: string;
      inputPrice: number;
      outputPrice: number;
      cachePrice: number;
    }[]
  >([]);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiListModelPricing(spaceId);
      if (res?.data) setList(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [spaceId]);

  const openAdd = () => {
    setEditItem(null);
    setSelectedModelTiers([]);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (item: ModelPricingInfo) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = { ...values, tiers: editItem?.tiers || selectedModelTiers };
    if (editItem) {
      await apiUpdateModelPricing(editItem.id, payload);
      message.success(dict('PC.Pages.SpaceResourcePricing.editSuccess'));
    } else {
      await apiCreateModelPricing(spaceId, payload);
      message.success(dict('PC.Pages.SpaceResourcePricing.addSuccess'));
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = (item: ModelPricingInfo) => {
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.name,
      async () => {
        await apiDeleteModelPricing(item.id);
        message.success(dict('PC.Pages.SpaceResourcePricing.deleteSuccess'));
        load();
      },
    );
  };

  const handleToggle = async (item: ModelPricingInfo, enabled: boolean) => {
    await apiToggleModelPricing(item.id, enabled);
    setList((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, enabled } : p)),
    );
    message.success(dict('PC.Pages.SpaceResourcePricing.toggleSuccess'));
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {record.tiers?.map((t, i) => (
            <Tag
              key={i}
              color="blue"
              style={{ fontSize: 11, whiteSpace: 'nowrap' }}
            >
              {t.label} | 入¥{formatPrice(t.inputPrice)} | 出¥
              {formatPrice(t.outputPrice)}
              {t.cachePrice > 0 ? ` | 缓存¥{formatPrice(t.cachePrice)}` : ''}
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
          onChange={(v) => handleToggle(record, v)}
        />
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <span>
          <a onClick={() => openEdit(record)} style={{ marginRight: 12 }}>
            {dict('PC.Common.Global.edit')}
          </a>
          <a onClick={() => handleDelete(record)} style={{ color: '#ff4d4f' }}>
            {dict('PC.Common.Global.delete')}
          </a>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
          {dict('PC.Pages.SpaceResourcePricing.modelTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {dict('PC.Pages.SpaceResourcePricing.addModel')}
        </Button>
      </div>
      <XProTable<ModelPricingInfo>
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        request={async () => ({
          data: list,
          total: list.length,
          success: true,
        })}
        search={false}
      />
      <Modal
        title={
          editItem
            ? dict('PC.Pages.SpaceResourcePricing.editModelPricing')
            : dict('PC.Pages.SpaceResourcePricing.addModel')
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={dict('PC.Pages.SpaceResourcePricing.modelName')}
            rules={[{ required: true }]}
          >
            {editItem ? (
              <Input disabled />
            ) : (
              <Select
                placeholder={dict(
                  'PC.Pages.SpaceResourcePricing.selectPlaceholder',
                )}
                onChange={(v) => {
                  const m = MODEL_CATALOG.find((c) => c.name === v);
                  if (m) {
                    form.setFieldsValue({ name: m.name, provider: m.provider });
                    setSelectedModelTiers([
                      {
                        label: '≤32K',
                        inputPrice: 0,
                        outputPrice: 0,
                        cachePrice: 0,
                      },
                    ]);
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
            <Input disabled={!editItem} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════
//  ToolPricingTab
// ═══════════════════════════════════════════

const ToolPricingTab: React.FC<{ spaceId: number }> = ({ spaceId }) => {
  const [list, setList] = useState<ToolPricingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ToolPricingInfo | null>(null);
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiListToolPricing(spaceId);
      if (res?.data) setList(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [spaceId]);

  const filteredList = keyword
    ? list.filter((t) => t.name.includes(keyword))
    : list;

  const openAdd = () => {
    setEditItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (item: ToolPricingInfo) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editItem) {
      await apiUpdateToolPricing(editItem.id, values);
      message.success(dict('PC.Pages.SpaceResourcePricing.editSuccess'));
    } else {
      await apiCreateToolPricing(spaceId, values);
      message.success(dict('PC.Pages.SpaceResourcePricing.addSuccess'));
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = (item: ToolPricingInfo) => {
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.name,
      async () => {
        await apiDeleteToolPricing(item.id);
        message.success(dict('PC.Pages.SpaceResourcePricing.deleteSuccess'));
        load();
      },
    );
  };

  const handleToggle = async (item: ToolPricingInfo, enabled: boolean) => {
    await apiToggleToolPricing(item.id, enabled);
    setList((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, enabled } : p)),
    );
    message.success(dict('PC.Pages.SpaceResourcePricing.toggleSuccess'));
  };

  const columns: ProColumns<ToolPricingInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.toolName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
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
        <span style={{ fontWeight: 600 }}>
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
          <span style={{ fontWeight: 600 }}>¥{formatPrice(record.price)}</span>
          <span style={{ color: '#999', marginLeft: 4 }}>
            / {record.period}
          </span>
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
          onChange={(v) => handleToggle(record, v)}
        />
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <span>
          <a onClick={() => openEdit(record)} style={{ marginRight: 12 }}>
            {dict('PC.Common.Global.edit')}
          </a>
          <a onClick={() => handleDelete(record)} style={{ color: '#ff4d4f' }}>
            {dict('PC.Common.Global.delete')}
          </a>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
          {dict('PC.Pages.SpaceResourcePricing.toolTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {dict('PC.Pages.SpaceResourcePricing.addTool')}
        </Button>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Input
          placeholder="搜索工具名称..."
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
      </div>
      <XProTable<ToolPricingInfo>
        rowKey="id"
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        pagination={false}
        request={async () => ({
          data: filteredList,
          total: filteredList.length,
          success: true,
        })}
        search={false}
      />
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: '#999',
          background: '#fffbe6',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <span style={{ color: '#faad14' }}>ⓘ</span>
        <span>{dict('PC.Pages.SpaceResourcePricing.billingNotice')}</span>
      </div>
      <Modal
        title={
          editItem
            ? dict('PC.Pages.SpaceResourcePricing.editTool')
            : dict('PC.Pages.SpaceResourcePricing.addTool')
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={dict('PC.Pages.SpaceResourcePricing.toolName')}
            rules={[{ required: true }]}
          >
            {editItem ? (
              <Input disabled />
            ) : (
              <Select
                placeholder={dict(
                  'PC.Pages.SpaceResourcePricing.selectPlaceholder',
                )}
                onChange={(v) => {
                  const t = TOOL_CATALOG.find((c) => c.name === v);
                  if (t)
                    form.setFieldsValue({
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
            <InputNumber
              min={0}
              step={0.001}
              style={{ width: '100%' }}
              placeholder={dict(
                'PC.Pages.SpaceResourcePricing.pricePlaceholder',
              )}
            />
          </Form.Item>
          <Form.Item
            name="period"
            label={dict('PC.Pages.SpaceResourcePricing.period')}
            initialValue="次"
          >
            <Select>
              <Select.Option value="次">次</Select.Option>
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
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════
//  SkillPricingTab
// ═══════════════════════════════════════════

const SkillPricingTab: React.FC<{ spaceId: number }> = ({ spaceId }) => {
  const [list, setList] = useState<SkillPricingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SkillPricingInfo | null>(null);
  const [pricingModel, setPricingModel] = useState<'buyout' | 'monthly'>(
    'buyout',
  );
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiListSkillPricing(spaceId);
      if (res?.data) setList(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [spaceId]);

  const openAdd = () => {
    setEditItem(null);
    setPricingModel('buyout');
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (item: SkillPricingInfo) => {
    setEditItem(item);
    setPricingModel(item.pricingModel);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = { ...values, pricingModel };
    if (editItem) {
      await apiUpdateSkillPricing(editItem.id, payload);
      message.success(dict('PC.Pages.SpaceResourcePricing.editSuccess'));
    } else {
      await apiCreateSkillPricing(spaceId, payload);
      message.success(dict('PC.Pages.SpaceResourcePricing.addSuccess'));
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = (item: SkillPricingInfo) => {
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.name,
      async () => {
        await apiDeleteSkillPricing(item.id);
        message.success(dict('PC.Pages.SpaceResourcePricing.deleteSuccess'));
        load();
      },
    );
  };

  const handleToggle = async (item: SkillPricingInfo, enabled: boolean) => {
    await apiToggleSkillPricing(item.id, enabled);
    setList((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, enabled } : p)),
    );
    message.success(dict('PC.Pages.SpaceResourcePricing.toggleSuccess'));
  };

  const columns: ProColumns<SkillPricingInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.skillName'),
      dataIndex: 'name',
      key: 'name',
      width: 180,
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
        <span style={{ fontWeight: 600 }}>
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
          <span style={{ fontWeight: 600 }}>¥{record.price.toFixed(2)}</span>
          {record.pricingModel === 'monthly' && (
            <span style={{ color: '#999', marginLeft: 2 }}>/月</span>
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
          onChange={(v) => handleToggle(record, v)}
        />
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <span>
          <a onClick={() => openEdit(record)} style={{ marginRight: 12 }}>
            {dict('PC.Common.Global.edit')}
          </a>
          <a onClick={() => handleDelete(record)} style={{ color: '#ff4d4f' }}>
            {dict('PC.Common.Global.delete')}
          </a>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
          {dict('PC.Pages.SpaceResourcePricing.skillTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {dict('PC.Pages.SpaceResourcePricing.addSkill')}
        </Button>
      </div>
      <XProTable<SkillPricingInfo>
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        request={async () => ({
          data: list,
          total: list.length,
          success: true,
        })}
        search={false}
      />
      <Modal
        title={
          editItem
            ? dict('PC.Pages.SpaceResourcePricing.editSkill')
            : dict('PC.Pages.SpaceResourcePricing.addSkill')
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={dict('PC.Pages.SpaceResourcePricing.skillName')}
            rules={[{ required: true }]}
          >
            {editItem ? (
              <Input disabled />
            ) : (
              <Select
                placeholder={dict(
                  'PC.Pages.SpaceResourcePricing.selectPlaceholder',
                )}
                onChange={(v) => {
                  const s = SKILL_CATALOG.find((c) => c.name === v);
                  if (s)
                    form.setFieldsValue({
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
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                type={pricingModel === 'buyout' ? 'primary' : 'default'}
                onClick={() => setPricingModel('buyout')}
                style={{ flex: 1 }}
              >
                {dict('PC.Pages.SpaceResourcePricing.pricingModeBuyout')}
              </Button>
              <Button
                type={pricingModel === 'monthly' ? 'primary' : 'default'}
                onClick={() => setPricingModel('monthly')}
                style={{ flex: 1 }}
              >
                {dict('PC.Pages.SpaceResourcePricing.pricingModeMonthly')}
              </Button>
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
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
              placeholder={dict(
                'PC.Pages.SpaceResourcePricing.pricePlaceholder',
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
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
    <div style={{ padding: '16px 16px 16px 24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 4,
        }}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #1a6bff, #0d9488)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {dict('PC.Pages.SpaceResourcePricing.pageTitle')}
        </h3>
        <span style={{ fontSize: 13, color: '#8a9bb0', fontWeight: 400 }}>
          {dict('PC.Pages.SpaceResourcePricing.pageSubtitle')}
        </span>
      </div>

      <Segmented
        options={tabOptions}
        value={activeTab}
        onChange={(v) => setActiveTab(v as string)}
        style={{ margin: '16px 0' }}
      />

      {renderTabContent()}
    </div>
  );
};

export default SpaceResourcePricing;
