import { isImmersiveShell, shellAvoid } from '@/utils/nuwaClawBridge';
import React from 'react';
import { Outlet } from 'umi';

/**
 * 无菜单独立路由（layout:false 二级页：工作流详情/智能体编排/网页应用开发等）
 * 的沉浸式顶部避让容器。
 *
 * 这些路由与 @/layouts 平级，page-container 的 marginTop 避让够不到它们；
 * 同窗承载（nuwaclaw 主 webview 内打开）时由本 wrapper 提供同款外边距退让：
 * - 仅沉浸式主窗口生效：独立窗口（_shell=1 带系统标题栏）与浏览器原样直出，
 *   不加任何包裹层，零回归风险；
 * - marginTop 下移整个容器（与 page-container 同思路），高度同步扣除避让量，
 *   不产生底部溢出滚动条；
 * - position:relative 使其成为包含块：Antv-X6 #container 等 absolute; top:0
 *   的根容器随之下移，否则它们锚定视口、包裹层对其无效。
 */
const ImmersiveShellAvoid: React.FC = () => {
  // 非沉浸（浏览器/独立窗口）直出，不引入包裹层
  if (!isImmersiveShell()) {
    return <Outlet />;
  }

  const avoid = shellAvoid.TOOLBAR;
  return (
    <div
      style={{
        position: 'relative',
        height: `calc(100vh - ${avoid}px)`,
        marginTop: avoid,
      }}
    >
      <Outlet />
    </div>
  );
};

export default ImmersiveShellAvoid;
