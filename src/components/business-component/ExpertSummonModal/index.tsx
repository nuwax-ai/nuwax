/**
 * 统一专家卡弹窗（共享包装）
 * @description 专家付费拦截用的 Modal + ExpertSummonCard 组合纯展示包装：
 * 宽度随内容自适应、居中、无 footer；详情复核/套餐订阅/召唤在
 * ExpertSummonCard 内自闭环，外部只需传入专家信息与回调。
 * 消费方：添加能力弹窗（CapabilityModal）付费专家「聘请」、
 * 专家&专家团页（ExpertSkillConnector）付费专家「召唤/付费角标」——
 * 两处拦截口径一致（先按 /agent/:id 详情复核，确认付费未订阅才弹）。
 *
 * 用法：
 * ```tsx
 * <ExpertSummonModal
 *   open={!!expertPaymentItem}
 *   expert={expertPaymentItem ? mapToCardInfo(expertPaymentItem) : null}
 *   onClose={() => setExpertPaymentItem(null)}
 *   onSummon={(expert, subscribed) => ...}
 * />
 * ```
 */

import ExpertSummonCard, {
  type ExpertSummonCardInfo,
} from '@/components/business-component/ExpertSummonCard';
import { Modal } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export type { ExpertSummonCardInfo };

export interface ExpertSummonModalProps {
  /** 弹窗开关（expert 为 null 时强制关闭） */
  open: boolean;
  /** 专家信息（null 时不渲染卡片内容） */
  expert: ExpertSummonCardInfo | null;
  /** 关闭回调（遮罩/关闭按钮/Escape） */
  onClose: () => void;
  /** 卡内召唤放行回调（subscribed=true 表示经卡内复核/订阅确认已订阅） */
  onSummon: (expert: ExpertSummonCardInfo, subscribed?: boolean) => void;
}

const ExpertSummonModal: React.FC<ExpertSummonModalProps> = ({
  open,
  expert,
  onClose,
  onSummon,
}) => (
  <Modal
    open={open && expert !== null}
    onCancel={onClose}
    footer={null}
    // 宽度随内容自适应，不与宿主弹窗/页面对齐
    width="fit-content"
    centered
    destroyOnHidden
    className={cx(styles['expert-summon-modal'])}
  >
    {expert && <ExpertSummonCard expert={expert} onSummon={onSummon} />}
  </Modal>
);

export default ExpertSummonModal;
