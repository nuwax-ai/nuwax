import { dict } from '@/services/i18nRuntime';
import { Space } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { memo, useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

type TagType = 'success' | 'processing' | 'error' | 'warning' | 'default';

interface PointStatusTag {
  type: TagType;
  text: string;
}

interface PointStatusCardProps {
  totalAmount: number;
  usedAmount: number;
  created: string | number | Date;
  expireTime: string | number | Date;

  /**
   * 是否显示多个 tag
   * true:
   *   有效期2年 + 即将用完
   *
   * false:
   *   只显示优先级最高的状态
   */
  multiple?: boolean;
}

/**
 * 获取有效期年数
 */
function getValidYears(createdTime: any, expireTime: any) {
  if (!createdTime || !expireTime) return 0;
  return dayjs(expireTime).diff(dayjs(createdTime), 'year');
}

/**
 * 获取多个 tags
 */
function getTags(params: PointStatusCardProps): PointStatusTag[] {
  const { totalAmount = 0, usedAmount = 0, created, expireTime } = params;

  const tags: PointStatusTag[] = [];

  const now = dayjs();
  const expireDate = dayjs(expireTime);

  // =========================
  // 时间状态
  // =========================

  if (expireDate.isBefore(now)) {
    tags.push({
      type: 'error',
      text: dict('PC.Pages.MorePage.MySubscriptions.expired'),
    });
  } else {
    const years = getValidYears(created, expireTime);

    if (years >= 1) {
      tags.push({
        type: 'processing',
        text: dict(
          'PC.Pages.MorePage.MySubscriptions.validityYears',
          Math.min(years, 5),
        ),
      });
    }
  }

  // =========================
  // 使用状态
  // =========================

  const ratio = totalAmount > 0 ? usedAmount / totalAmount : 0;

  // 已用完
  if (ratio >= 1) {
    tags.push({
      type: 'error',
      text: dict('PC.Pages.MorePage.MySubscriptions.fullyUsed'),
    });
  }
  // 即将用完
  else if (ratio >= 0.8) {
    tags.push({
      type: 'warning',
      text: dict('PC.Pages.MorePage.MySubscriptions.aboutToUseUp'),
    });
  }

  return tags;
}

/**
 * 获取单个最高优先级状态
 */
function getSingleTag(params: PointStatusCardProps): PointStatusTag | null {
  const { totalAmount = 0, usedAmount = 0, created, expireTime } = params;

  const now = dayjs();
  const expireDate = dayjs(expireTime);

  // 1. 已过期
  if (expireDate.isBefore(now)) {
    return {
      type: 'error',
      text: dict('PC.Pages.MorePage.MySubscriptions.expired'),
    };
  }

  const ratio = totalAmount > 0 ? usedAmount / totalAmount : 0;

  // 2. 已用完
  if (ratio >= 1) {
    return {
      type: 'error',
      text: dict('PC.Pages.MorePage.MySubscriptions.fullyUsed'),
    };
  }

  // 3. 即将用完
  if (ratio >= 0.8) {
    return {
      type: 'warning',
      text: dict('PC.Pages.MorePage.MySubscriptions.aboutToUseUp'),
    };
  }

  // 4. 有效期
  const years = getValidYears(created, expireTime);

  if (years >= 1) {
    return {
      type: 'processing',
      text: dict(
        'PC.Pages.MorePage.MySubscriptions.validityYears',
        Math.min(years, 5),
      ),
    };
  }

  return {
    type: 'default',
    text: dict('PC.Pages.MorePage.MySubscriptions.normalUsage'),
  };
}

/**
 * 积分状态 Tag 组件
 */
const PointStatusTags: React.FC<PointStatusCardProps> = ({
  multiple = false,
  ...props
}) => {
  const { totalAmount, usedAmount, created, expireTime } = props;
  const tags = useMemo(() => {
    const params = { totalAmount, usedAmount, created, expireTime };
    if (multiple) {
      return getTags(params);
    }

    const tag = getSingleTag(params);

    return tag ? [tag] : [];
  }, [multiple, totalAmount, usedAmount, created, expireTime]);

  if (!tags.length) {
    return null;
  }

  return (
    <div className={cx(styles['status-tags-container'])}>
      <Space size={8} wrap>
        {tags.map((tag, index) => (
          <span
            key={`${tag.text}-${index}`}
            className={cx(styles['status-text'], styles[`status-${tag.type}`])}
          >
            {tag.text}
          </span>
        ))}
      </Space>
    </div>
  );
};

export default memo(PointStatusTags);
