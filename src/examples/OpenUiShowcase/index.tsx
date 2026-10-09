import OpenUiArtifactView from '@/components/business-component/OpenUiArtifactView';
import type { RenderOpenUiInput } from '@nuwax-ai/openui-mcp/contracts';
import { Typography } from 'antd';
import React from 'react';

/**
 * OpenUI 宿主样式回归示例页
 *
 * 在 `.ds-markdown` 容器内渲染 OpenUiArtifactView 的 inline 分支（直喂 DSL，
 * 不依赖会话/后端），复现会话区宿主层叠环境，用于验证 openui-host-reset.css
 * 的隔离规则不误伤组件库样式：
 * - MarkDownRenderer 无序列表（缩进/bullet/行距——历史回归：被宿主 reset 扒光）
 * - PieChart donut / KPI 卡片（对照组）
 */
const { Title, Paragraph } = Typography;

/** 复刻用户反馈的「个人空间·资料列表」看板：统计卡 + donut + 概览面板（含列表） */
const DASHBOARD_SOURCE = [
  'root = Stack([header, cards, row])',
  'header = CardHeader("个人空间 · 资料列表", "共 73 份资料 · 数据截至 2026-09-01")',
  'cards = Stack([c1, c2, c3, c4, c5], "row", "s")',
  'c1 = Card([TextContent("全部资料", "small"), TextContent("73", "large-heavy")])',
  'c2 = Card([TextContent("文档", "small"), TextContent("42", "large-heavy")])',
  'c3 = Card([TextContent("幻灯片", "small"), TextContent("20", "large-heavy")])',
  'c4 = Card([TextContent("表格", "small"), TextContent("7", "large-heavy")])',
  'c5 = Card([TextContent("文件夹", "small"), TextContent("4", "large-heavy")])',
  'row = Stack([pieCard, overviewCard], "row", "m")',
  'pieCard = Card([CardHeader("资料类型分布"), PieChart(["文档", "幻灯片", "表格", "文件夹"], [42, 20, 7, 4], "donut")])',
  'overviewCard = Card([overview])',
  'overview = MarkDownRenderer(overviewText)',
  'overviewText = "## 概览\\n### 资料构成\\n- 文档：42 份\\n- 幻灯片：20 份\\n- 表格：7 份\\n- 文件夹：4 份\\n### 最近更新（08-31）\\n精电RFQ AI辅助系统需求评估、报价单、财报示例、锦上映封窗143户型、问题记录等。"',
].join('\n');

const INLINE_INPUT: RenderOpenUiInput = {
  schemaVersion: 'nuwax.openui/v1',
  title: '个人空间·资料列表（宿主样式回归）',
  presentation: { mode: 'inline', preferredWidth: 'wide' },
  document: {
    language: 'openui-lang',
    specVersion: '0.5',
    source: DASHBOARD_SOURCE,
  },
  fallback: { markdown: '' },
};

const OpenUiShowcase: React.FC = () => (
  <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
    <Title level={4}>OpenUI 宿主样式回归</Title>
    <Paragraph type="secondary">
      下方看板渲染在 <code>.ds-markdown</code>{' '}
      容器内（模拟会话区宿主层叠环境）。 验收点：「概览」面板的无序列表应有 20px
      缩进、bullet 正常、行距不挤 （回归项）；统计卡/环形图样式正常（对照项）。
    </Paragraph>
    {/* ds-markdown：会话区 markdown 宿主类名，openui-host-reset.css 的隔离规则按此作用 */}
    <div className="ds-markdown">
      <OpenUiArtifactView
        inlineInput={INLINE_INPUT}
        inlineArtifactId="openui-showcase"
      />
    </div>
  </div>
);

export default OpenUiShowcase;
