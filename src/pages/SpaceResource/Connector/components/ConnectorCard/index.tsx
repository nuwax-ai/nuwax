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
 *   3. 徽章行：已连接（仅已连接时展示）/ 已启用(已禁用) / 认证方式 / 分类 / N 个工具
 *   4. 底部条（米灰底）：左侧 baseUrl 截断展示，右侧两行操作按钮
 *      （查看工具 / 编辑 / 停用(启用) + 导出 / 删除）
 *
 * 注意：操作按钮暂为视觉占位，功能后续实现。
 */
const ConnectorCard: React.FC<{ record: ConnectorProviderInfo }> = ({
  record,
}) => {
  const isConnected = record.connected === true;
  const isEnabled = record.status === 'enabled';
  const authBadge =
    (record.authType && AUTH_BADGE_MAP[record.authType]) ||
    record.authType ||
    '';

  return (
    <div className={styles.card}>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{record.displayName || '-'}</div>
        {record.service ? (
          <div className={styles.cardService}>{record.service}</div>
        ) : null}
        <div className={styles.cardDesc}>
          {record.description || '暂无介绍'}
        </div>
        <div className={styles.cardBadges}>
          {isConnected ? <span className={styles.badge}>已连接</span> : null}
          <span className={styles.badge}>
            {isEnabled ? '已启用' : '已禁用'}
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
            {/* TODO: 查看工具 / 编辑 / 停用(启用) 功能待实现 */}
            <button type="button" className={styles.miniBtn}>
              查看工具
            </button>
            <button type="button" className={styles.miniBtn}>
              编辑
            </button>
            <button type="button" className={styles.miniBtn}>
              {isEnabled ? '停用' : '启用'}
            </button>
          </div>
          <div className={styles.cardBtnRow}>
            {/* TODO: 导出 / 删除 功能待实现 */}
            <button type="button" className={styles.miniBtn}>
              导出
            </button>
            <button
              type="button"
              className={`${styles.miniBtn} ${styles.dangerBtn}`}
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
