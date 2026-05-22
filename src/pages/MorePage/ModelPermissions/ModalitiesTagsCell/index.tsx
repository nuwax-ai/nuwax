import { Tag, Tooltip } from 'antd';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

export interface ModalitiesTagsCellProps {
  /** 模型能力类型值列表（如 Text、Image） */
  types: string[];
  /** 能力类型 value -> 展示文案映射 */
  labelMap: Record<string, string>;
}

/**
 * 模型模态标签单元格
 *
 * 功能：在表格「模态」列中展示模型支持的能力类型 Tag。
 * 布局：每行固定 3 个 Tag，最多展示 2 行（共 6 个可见）。
 *
 * 注意事项：
 * - 内容超出 2 行时自动裁剪，并在 Hover 时通过 Tooltip 展示完整列表
 * - 使用 ResizeObserver 监听列宽变化，动态判断是否溢出
 */
const ModalitiesTagsCell: React.FC<ModalitiesTagsCellProps> = ({
  types,
  labelMap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  /** 内容是否被 max-height 裁剪 */
  const [isTruncated, setIsTruncated] = useState(false);

  /** Tooltip 展示的完整模态文案，顿号分隔 */
  const fullListText = useMemo(
    () => types.map((t) => labelMap[t] ?? t).join('、'),
    [types, labelMap],
  );

  /** 比较 scrollHeight 与 clientHeight，判断是否发生溢出 */
  const measureTruncation = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    setIsTruncated(el.scrollHeight > el.clientHeight + 1);
  }, []);

  useLayoutEffect(() => {
    measureTruncation();
  }, [measureTruncation, fullListText]);

  /** 列宽变化时重新测量溢出状态（如表格横向滚动、窗口缩放） */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return () => {};
    }
    const ro = new ResizeObserver(() => measureTruncation());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureTruncation]);

  const tags = (
    <div ref={containerRef} className={styles['types-tags-cell']}>
      {types.map((t) => (
        <Tag key={t}>{labelMap[t] ?? t}</Tag>
      ))}
    </div>
  );

  if (isTruncated) {
    return <Tooltip title={fullListText}>{tags}</Tooltip>;
  }

  return tags;
};

export default ModalitiesTagsCell;
