import { ICON_MORE } from '@/constants/images.constants';
import { Button, Dropdown, Space } from 'antd';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import OperationBtn from '../OperationBtn';
import type { OperationBtnProps } from '../OperationBtn/types';
import styles from './index.less';

/** 单个操作项配置 */
export interface ActionItem<T>
  extends Omit<OperationBtnProps<T>, 'label' | 'record'> {
  /** 唯一标识 */
  key: string;
  /** 按钮文本，展示在文字链接或 Tooltip 下拉菜单中 */
  label: string;
}

interface TableActionsProps<T> {
  /** 渲染模式：link (文字链接，默认) | button (图标按钮) */
  type?: 'link' | 'button';
  /** 当前行数据 */
  record: T;
  /** 操作列表配置 */
  actions: ActionItem<T>[];
  /** 容器最大宽度（可选，未设置时自动检测父容器） */
  maxWidth?: number;
  /** 按钮间距，默认：link 模式下为 4，button 模式下为 8 */
  gap?: number;
  /** "更多"按钮文本，默认为图标 */
  moreText?: string;
}

/** 预估单个按钮宽度 */
const estimateButtonWidth = (
  label: string,
  hasIcon: boolean,
  mode: 'link' | 'button',
): number => {
  if (mode === 'button') {
    return 32; // 固定图标按钮宽度
  }
  // link 模式：文字约 14px + 间距/边距
  const charWidth = 14;
  const padding = 12; // type=link size=small 左右各约 4px + 余裕
  const iconWidth = hasIcon ? 18 : 0;
  return label.length * charWidth + padding + iconWidth;
};

/**
 * TableActions - 自适应宽度的表格操作列组件
 * @description 支持 'link' (经典) 和 'button' (现代) 两种展现形式
 */
function TableActions<T extends object>({
  type = 'link',
  record,
  actions,
  maxWidth,
  gap: propsGap,
  moreText,
}: TableActionsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(maxWidth ?? 0);

  // 默认间距
  const gap = propsGap ?? (type === 'button' ? 8 : 0);

  useEffect(() => {
    if (maxWidth) {
      setContainerWidth(maxWidth);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const td = container.closest('td');
      if (td) {
        const tdWidth = td.getBoundingClientRect().width;
        setContainerWidth(tdWidth - 16);
      }
    };

    const timer = setTimeout(updateWidth, 0);
    const observer = new ResizeObserver(updateWidth);

    const td = container.closest('td');
    if (td) observer.observe(td);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [maxWidth]);

  const visibleActions = actions.filter((action) => {
    const isVisible =
      typeof action.visible === 'function'
        ? action.visible(record)
        : action.visible ?? true;
    return isVisible;
  });

  const calculateVisibleCount = useCallback(() => {
    if (visibleActions.length <= 1) return visibleActions.length;
    if (containerWidth <= 0) return 0;

    let totalWidth = 0;
    let count = 0;
    const moreBtnWidth = moreText ? moreText.length * 14 + 16 : 32;

    for (let i = 0; i < visibleActions.length; i++) {
      const action = visibleActions[i];
      const btnWidth = estimateButtonWidth(action.label, !!action.icon, type);
      const nextTotalWidth = totalWidth + btnWidth + (count > 0 ? gap : 0);

      const isLast = i === visibleActions.length - 1;
      const reservedWidth = isLast ? 0 : moreBtnWidth + gap;

      if (nextTotalWidth + reservedWidth <= containerWidth) {
        totalWidth = nextTotalWidth;
        count++;
      } else {
        break;
      }
    }

    // 检查是否全都能放下
    const allWidth = visibleActions.reduce(
      (s, a, idx) =>
        s + estimateButtonWidth(a.label, !!a.icon, type) + (idx > 0 ? gap : 0),
      0,
    );
    if (allWidth <= containerWidth) return visibleActions.length;

    return count;
  }, [visibleActions, containerWidth, gap, moreText, type]);

  const visibleCount = calculateVisibleCount();
  const primaryActions = visibleActions.slice(0, visibleCount);
  const moreActions = visibleActions.slice(visibleCount);

  return (
    <div ref={containerRef} className={styles.container}>
      <Space size={gap} wrap={false}>
        {primaryActions.map(({ key, ...action }) => {
          if (type === 'button') {
            return (
              <OperationBtn
                key={key}
                {...action}
                record={record}
                label={action.label}
              />
            );
          }
          // 默认 link 模式，展示文字
          return (
            <OperationBtn
              key={key}
              {...action}
              record={record}
              label={action.label}
              type="link"
            >
              {action.label}
            </OperationBtn>
          );
        })}

        {moreActions.length > 0 && (
          <Dropdown
            trigger={['hover']}
            menu={{
              items: moreActions.map(({ key, ...action }) => ({
                key,
                label: (
                  <OperationBtn
                    {...action}
                    record={record}
                    label={action.label}
                    type="link"
                    variant="plain"
                    className={styles['dropdown-btn']}
                  >
                    {action.label}
                  </OperationBtn>
                ),
              })),
            }}
          >
            <Button
              type={type === 'button' ? 'text' : 'link'}
              size="small"
              className={classNames(styles['more-btn'], {
                [styles['more-btn-button']]: type === 'button',
                [styles['more-btn-link']]: type === 'link',
              })}
              icon={moreText ? undefined : <ICON_MORE />}
            >
              {moreText}
            </Button>
          </Dropdown>
        )}
      </Space>
    </div>
  );
}

export default TableActions;
