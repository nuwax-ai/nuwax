/**
 * 沉浸式壳避让路由包装层：layout:false 独立路由（无菜单详情页——工作流详情/
 * 智能体编排/网页应用开发/agent-dev 会话）的顶部退让统一在此承担。
 *
 * - 非沉浸（浏览器/桌面独立窗口）：直出 <Outlet/>，零包裹零影响。
 * - 沉浸态：两层 div 挂 .nuwaclaw-shell-page / -inner，全部几何在
 *   styles/nuwaclawShell.less（CSS 变量消费，本组件零内联样式、零尺寸数字）。
 *   同规则收口工作流编辑器 v1/v3 的 fixed 返栏（.fold-header-style 的 top）。
 *
 * 嵌套复用安全性：v3 WorkflowLayout 既可作独立路由渲染、也被 EditAgent 内嵌，
 * 两种宿主的路由各自经过本 wrapper，组件内部不再携带任何避让代码——不存在
 * 「wrapper 不知道自己被嵌入」的双重退让问题。
 */
import { Outlet } from 'umi';

import {
  isImmersiveShell,
  syncShellAvoidanceCss,
} from '@/utils/nuwaClawBridge';

// 首帧渲染前把 html 类/CSS 变量就位（幂等；app.tsx 启动时也会调一次）。
syncShellAvoidanceCss();

export default function ImmersiveShellAvoid() {
  if (!isImmersiveShell()) {
    return <Outlet />;
  }
  return (
    <div className="nuwaclaw-shell-page">
      <div className="nuwaclaw-shell-page-inner">
        <Outlet />
      </div>
    </div>
  );
}
