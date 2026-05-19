import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ResourceStatDTO } from '@/types/interfaces/systemManage';
import { Tag } from 'antd';
import React from 'react';
import styles from './index.less';

/** Agent 类型行 Token 列占位符 */
export const USAGE_STAT_TOKEN_EMPTY = '-';

type TargetTypeTagConfig = {
  color: string;
  className: string;
  labelKey: string;
};

/** 资源统计 targetType 与 Tag 样式、文案映射 */
const TARGET_TYPE_TAG_MAP: Record<string, TargetTypeTagConfig> = {
  [AgentComponentTypeEnum.Model]: {
    color: 'blue',
    className: styles['type-tag-model'],
    labelKey: 'PC.Pages.UsageStats.typeModel',
  },
  [AgentComponentTypeEnum.Agent]: {
    color: 'purple',
    className: styles['type-tag-agent'],
    labelKey: 'PC.Pages.UsageStats.typeAgent',
  },
  [AgentComponentTypeEnum.ToolCall]: {
    color: 'orange',
    className: styles['type-tag-tool'],
    labelKey: 'PC.Pages.UsageStats.typeToolCall',
  },
  [AgentComponentTypeEnum.Plugin]: {
    color: 'cyan',
    className: styles['type-tag-plugin'],
    labelKey: 'PC.Pages.UsageStats.typePlugin',
  },
  [AgentComponentTypeEnum.Workflow]: {
    color: 'green',
    className: styles['type-tag-workflow'],
    labelKey: 'PC.Pages.UsageStats.typeWorkflow',
  },
};

/**
 * 是否为 Agent 类型（Agent 无 Token 用量，表格展示为 -）
 */
export const isAgentResourceStatRecord = (record: ResourceStatDTO): boolean =>
  record.targetType === AgentComponentTypeEnum.Agent;

/**
 * Token 列渲染：Agent 显示 -，其余类型走 formatter
 */
export const renderUsageStatTokenCell = (
  record: ResourceStatDTO,
  formatValue: () => React.ReactNode,
): React.ReactNode => {
  if (isAgentResourceStatRecord(record)) {
    return USAGE_STAT_TOKEN_EMPTY;
  }
  return formatValue();
};

/**
 * 资源统计「类型」列 Tag
 */
export const ResourceStatTargetTypeTag: React.FC<{ targetType?: string }> = ({
  targetType,
}) => {
  if (!targetType) {
    return <span>{USAGE_STAT_TOKEN_EMPTY}</span>;
  }

  const config = TARGET_TYPE_TAG_MAP[targetType];
  if (!config) {
    return <Tag>{targetType}</Tag>;
  }

  return (
    <Tag color={config.color} className={config.className}>
      {dict(config.labelKey)}
    </Tag>
  );
};
