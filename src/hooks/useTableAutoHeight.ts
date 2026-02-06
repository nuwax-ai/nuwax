import { useCallback, useEffect, useState } from 'react';

/**
 * 获取元素的垂直外边距
 */
function getMarginHeight(el: Element) {
  if (!el) return 0;
  const style = window.getComputedStyle(el);
  return (parseInt(style.marginTop) || 0) + (parseInt(style.marginBottom) || 0);
}

/**
 * 自动计算表格高度 Hook
 * @param tableRef 表格容器的 ref
 * @param enabled 是否启用
 * @param scrollYOffset 修正的高度偏移量 (默认 50，即表格底部预留 50px 空隙)
 */
export const useTableAutoHeight = (
  tableRef: React.MutableRefObject<HTMLDivElement | null | undefined>,
  enabled: boolean = true,
  scrollYOffset: number = 50,
) => {
  const [scrollY, setScrollY] = useState<number | string>('100%');

  const calculateHeight = useCallback(() => {
    if (!enabled || !tableRef.current) return;

    const container = tableRef.current;

    // 尝试获取 ProTable 内部的各个组成部分
    // 注意类名可能会随版本变化，这里使用常见的 Antd Pro 类名
    const searchForm =
      container.querySelector('.ant-pro-query-filter') ||
      container.querySelector('.ant-form');
    const toolbar = container.querySelector('.ant-pro-table-list-toolbar');
    const alert = container.querySelector('.ant-pro-table-alert');
    const thead = container.querySelector('.ant-table-thead');
    const pagination =
      container.querySelector('.ant-pagination') ||
      container.querySelector('.ant-pro-table-pagination');

    // 计算各部分高度 (包含 margin)
    const searchHeight = searchForm
      ? searchForm.clientHeight + getMarginHeight(searchForm)
      : 0;
    const toolbarHeight = toolbar
      ? toolbar.clientHeight + getMarginHeight(toolbar)
      : 0;
    const alertHeight = alert ? alert.clientHeight + getMarginHeight(alert) : 0;
    const theadHeight = thead ? thead.clientHeight : 47; // 默认表头高度
    const paginationHeight = pagination
      ? pagination.clientHeight + getMarginHeight(pagination)
      : 24 + 32; // 预估分页高度

    // 计算可用空间
    const containerRect = container.getBoundingClientRect();
    const top = containerRect.top;
    const windowHeight = window.innerHeight;

    // 核心计算公式：
    // ScrollY = 视口总高 - 容器顶部距离 - 容器底部留白 - 内部各组件高度
    // scrollYOffset 用于调整底部留白或修正高度 (height = available - scrollYOffset)
    let height =
      windowHeight -
      top -
      scrollYOffset -
      searchHeight -
      toolbarHeight -
      alertHeight -
      theadHeight -
      paginationHeight;

    // 设置最小高度，防止显示异常
    const minHeight = 200;

    // 确保高度非负且不小于最小值
    height = Math.max(height, minHeight);

    setScrollY(height);
  }, [enabled, scrollYOffset, tableRef]);

  useEffect(() => {
    if (!enabled) return;

    // 初始计算，延迟以确保 DOM 渲染
    const timer = setTimeout(calculateHeight, 100);

    // 监听窗口大小变化
    window.addEventListener('resize', calculateHeight);

    // 监听搜索表单大小变化 (展开/收起)
    let observer: ResizeObserver | null = null;
    if (tableRef.current) {
      observer = new ResizeObserver(() => {
        calculateHeight();
      });

      const searchForm = tableRef.current.querySelector(
        '.ant-pro-query-filter',
      );
      if (searchForm) {
        observer.observe(searchForm);
      }
      // 也可以监听容器本身，以防其他因素引起变化
      observer.observe(tableRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateHeight);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [calculateHeight, enabled, tableRef]);

  return scrollY;
};
