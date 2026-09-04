import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import React from 'react';
import styles from './index.less';

/**
 * 认证方式徽章文案（设计稿样式：拉丁字母全大写）
 * 与管理端筛选用的 AUTH_TYPE_LABEL_MAP（'Api Key' / 'Outh 2.0'）展示风格不同，
 * 因此单独维护卡片徽章文案，避免影响管理端。
 */
const AUTH_BADGE_MAP: Record<string, string> = {
  no_auth: '免鉴权',
  api_key: 'API KEY',
  bearer: 'BEARER',
  oauth2: 'OAUTH 2.0',
  custom: '自定义',
};

/**
 * 空间连接器卡片
 *
 * 结构（自上而下）：
 *   1. 标题 displayName + service（等宽小字）
 *   2. 描述（空值兜底「暂无介绍」）
 *   3. 徽章行：已连接（仅已连接时展示，绿色同已启用）/ 已启用(已停用) /
 *      认证方式 / 分类 / N 个工具
 *   4. 底部条（米灰底）：左侧 baseUrl 截断展示，右侧两行操作按钮
 *      （查看工具 / 编辑 / 停用(启用) + 导出 / 删除）
 *
 * 注意：全部操作按钮均为受控回调，由页面实现（删除的二次确认、接口调用、
 * 导出下载、启停刷新列表、编辑/查看工具打开复用抽屉）。
 */
const ConnectorCard: React.FC<{
  record: ConnectorProviderInfo;
  /** 删除回调：页面负责 Modal.confirm 二次确认与接口调用 */
  onDelete?: (record: ConnectorProviderInfo) => void;
  /** 导出回调：页面负责调接口并触发下载（{service}.connector.json） */
  onExport?: (record: ConnectorProviderInfo) => void;
  /** 停用/启用回调：页面负责调接口并刷新列表 */
  onToggleStatus?: (record: ConnectorProviderInfo) => void;
  /** 编辑回调：页面负责打开编辑抽屉（复用管理端 ConnectorProviderEditDrawer） */
  onEdit?: (record: ConnectorProviderInfo) => void;
  /** 查看工具回调：页面负责打开详情抽屉（复用管理端 ConnectorProviderDetailDrawer） */
  onView?: (record: ConnectorProviderInfo) => void;
}> = ({ record, onDelete, onExport, onToggleStatus, onEdit, onView }) => {
  const isConnected = record.connected === true;
  const isEnabled = record.status === 'enabled';
  const authBadge =
    (record.authType && AUTH_BADGE_MAP[record.authType]) ||
    record.authType ||
    '';

  return (
    <div
      className={
        isEnabled ? styles.card : `${styles.card} ${styles.cardDisabled}`
      }
    >
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{record.displayName || '-'}</div>
        {record.service ? (
          <div className={styles.cardService}>{record.service}</div>
        ) : null}
        <div className={styles.cardDesc}>
          {record.description || '暂无介绍'}
        </div>
        <div className={styles.cardBadges}>
          {isConnected ? (
            <span className={`${styles.badge} ${styles.badgeConnected}`}>
              已连接
            </span>
          ) : null}
          <span
            className={`${styles.badge} ${
              isEnabled ? styles.badgeEnabled : styles.badgeDisabled
            }`}
          >
            {isEnabled ? '已启用' : '已停用'}
          </span>
          {authBadge ? <span className={styles.badge}>{authBadge}</span> : null}
          {record.category ? (
            <span className={styles.badge}>{record.category}</span>
          ) : null}
          {record.actionCount !== undefined && record.actionCount !== null ? (
            <span className={styles.badge}>{record.actionCount} 个工具</span>
          ) : null}
        </div>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardUrl} title={record.baseUrl}>
          {record.baseUrl || '-'}
        </span>
        <div className={styles.cardBtns}>
          <div className={styles.cardBtnRow}>
            {/* 查看工具：交给页面层打开详情抽屉（复用管理端抽屉，spaceId 用选中空间） */}
            <button
              type="button"
              className={styles.miniBtn}
              onClick={() => onView?.(record)}
            >
              查看工具
            </button>
            {/* 编辑：交给页面层打开编辑抽屉（复用管理端抽屉，接口走 space 维度） */}
            <button
              type="button"
              className={styles.miniBtn}
              onClick={() => onEdit?.(record)}
            >
              编辑
            </button>
            {/* 停用/启用：交给页面层调接口并刷新列表（按钮样式与其他按钮一致） */}
            <button
              type="button"
              className={styles.miniBtn}
              onClick={() => onToggleStatus?.(record)}
            >
              {isEnabled ? '停用' : '启用'}
            </button>
          </div>
          <div className={styles.cardBtnRow}>
            {/* 导出：交给页面层调接口并触发下载 */}
            <button
              type="button"
              className={styles.miniBtn}
              onClick={() => onExport?.(record)}
            >
              导出
            </button>
            {/* 删除：交给页面层做二次确认与接口调用 */}
            <button
              type="button"
              className={`${styles.miniBtn} ${styles.dangerBtn}`}
              onClick={() => onDelete?.(record)}
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectorCard;
