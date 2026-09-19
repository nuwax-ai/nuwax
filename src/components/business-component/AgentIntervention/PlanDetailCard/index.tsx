/**
 * PlanDetailCard — 计划方案卡（消息流置尾渲染）
 *
 * 职责：条目清单展示 + 三个动作（全屏预览 / 下载 .md / 拷贝）。
 * 由 V2 WorkTraceDisclosure 从轨迹中抽出 plan 节点后置尾渲染（不受轨迹折叠影响），
 * 也供其它场景复用。数据与 V2 投影同源（entries: content/status）。
 */

import CopyIconButton from '@/components/base/CopyIconButton';
import { dict } from '@/services/i18nRuntime';
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  ExpandOutlined,
  LoadingOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import { Button, Modal, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface PlanDetailEntry {
  content: string;
  priority?: string;
  status?: string;
}

export interface PlanDetailCardProps {
  entries: PlanDetailEntry[];
  /** 卡片标题，缺省取 i18n「执行计划」 */
  title?: string;
  /** 正文默认是否展开（消息流置尾场景传 true） */
  defaultExpanded?: boolean;
}

/** 条目 → Markdown 文本（下载/拷贝同源） */
export function buildPlanMarkdown(
  entries: PlanDetailEntry[],
  title: string,
): string {
  const lines: string[] = [`# ${title}`, ''];
  entries.forEach((entry, index) => {
    const done = entry.status === 'completed';
    const mark = done ? '[x]' : '[ ]';
    lines.push(`${index + 1}. ${mark} ${entry.content}`);
  });
  lines.push('');
  return lines.join('\n');
}

function buildDownloadFileName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `plan-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}-${pad(now.getHours())}${pad(now.getMinutes())}.md`;
}

function downloadMarkdown(markdown: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildDownloadFileName();
  anchor.click();
  URL.revokeObjectURL(url);
}

const EntryStatusIcon: React.FC<{ status?: string }> = ({ status }) => {
  if (status === 'completed') {
    return (
      <CheckSquareOutlined
        className={cx(styles['entry-done'])}
        aria-hidden="true"
      />
    );
  }
  if (status === 'in_progress') {
    return (
      <LoadingOutlined
        className={cx(styles['entry-running'])}
        spin
        aria-hidden="true"
      />
    );
  }
  if (status === 'failed') {
    return (
      <CloseCircleOutlined
        className={cx(styles['entry-failed'])}
        aria-hidden="true"
      />
    );
  }
  return (
    <ClockCircleOutlined
      className={cx(styles['entry-pending'])}
      aria-hidden="true"
    />
  );
};

const PlanDetailCard: React.FC<PlanDetailCardProps> = ({
  entries,
  title,
  defaultExpanded = false,
}) => {
  const resolvedTitle = title || dict('PC.Components.PlanDetailCard.title');
  const [bodyExpanded, setBodyExpanded] = useState(defaultExpanded);
  const [previewOpen, setPreviewOpen] = useState(false);

  const markdown = useMemo(
    () => buildPlanMarkdown(entries, resolvedTitle),
    [entries, resolvedTitle],
  );
  const completedCount = useMemo(
    () => entries.filter((entry) => entry.status === 'completed').length,
    [entries],
  );

  const handleDownload = () => downloadMarkdown(markdown);

  const entryList = (large?: boolean) => (
    <ol className={cx(styles['plan-entries'], { [styles['is-large']]: large })}>
      {entries.map((entry, index) => (
        <li
          key={`${entry.content}-${index}`}
          className={cx(styles['plan-entry'])}
        >
          <EntryStatusIcon status={entry.status} />
          <span className={cx(styles['plan-entry-index'])}>{index + 1}</span>
          <span className={cx(styles['plan-entry-content'])}>
            {entry.content}
          </span>
        </li>
      ))}
    </ol>
  );

  return (
    <div
      className={cx(styles['plan-detail-card'])}
      data-plan-detail-card="true"
    >
      <header
        className={cx(styles['plan-detail-header'])}
        onClick={() => setBodyExpanded((previous) => !previous)}
      >
        <OrderedListOutlined
          className={cx(styles['plan-detail-icon'])}
          aria-hidden="true"
        />
        <span className={cx(styles['plan-detail-title'])}>{resolvedTitle}</span>
        <span className={cx(styles['plan-detail-progress'])}>
          {completedCount}/{entries.length}
        </span>
        {/* 动作组：阻断头部折叠点击 */}
        <span
          className={cx(styles['plan-detail-actions'])}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title={dict('PC.Components.PlanDetailCard.fullscreen')}>
            <Button
              type="text"
              size="small"
              icon={<ExpandOutlined />}
              aria-label={dict('PC.Components.PlanDetailCard.fullscreen')}
              onClick={() => setPreviewOpen(true)}
            />
          </Tooltip>
          <Tooltip title={dict('PC.Components.PlanDetailCard.download')}>
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              aria-label={dict('PC.Components.PlanDetailCard.download')}
              onClick={handleDownload}
            />
          </Tooltip>
          <CopyIconButton
            text={markdown}
            tooltipTitle={dict('PC.Components.PlanDetailCard.copy')}
          />
        </span>
      </header>
      {bodyExpanded ? (
        <div className={cx(styles['plan-detail-body'])}>{entryList()}</div>
      ) : null}
      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width="min(960px, 92vw)"
        title={
          <span className={cx(styles['plan-preview-title'])}>
            {resolvedTitle}
            <span
              className={cx(styles['plan-detail-actions'])}
              onClick={(e) => e.stopPropagation()}
            >
              <CopyIconButton
                text={markdown}
                tooltipTitle={dict('PC.Components.PlanDetailCard.copy')}
              />
              <Tooltip title={dict('PC.Components.PlanDetailCard.download')}>
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  aria-label={dict('PC.Components.PlanDetailCard.download')}
                  onClick={handleDownload}
                />
              </Tooltip>
            </span>
          </span>
        }
      >
        <div className={cx(styles['plan-preview-body'])}>{entryList(true)}</div>
      </Modal>
    </div>
  );
};

export default PlanDetailCard;
