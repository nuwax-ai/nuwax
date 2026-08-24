import { isImmersiveShell, shellAvoid } from '@/utils/nuwaClawBridge';
import React from 'react';
import { Outlet } from 'umi';

/**
 * 无菜单独立路由（layout:false 二级页：工作流详情/智能体编排/网页应用开发等）
 * 的沉浸式顶部避让容器。
 *
 * 这些路由与 @/layouts 平级，page-container 的 marginTop 避让够不到它们；
 * 同窗承载（nuwaclaw 主 webview 内打开）时由本 wrapper 提供同款顶部退让：
 * - 仅沉浸式主窗口生效：独立窗口（_shell=1 带系统标题栏）与浏览器原样直出，
 *   不加任何包裹层，零回归风险；
 * - 单盒 100vh + paddingTop（border-box）：内容区即 100vh - avoid，全文档
 *   恒 100vh 无溢出。不用 marginTop——#root→body 祖先链无 border/padding
 *   拦截，margin 会穿透折叠到 body，文档多出 avoid 高度（底部空白+滚动条）；
 *   page-container 用 margin 无事是因为其父级是 flex 容器（flex 项不折叠）；
 * - 内层 position:relative 成为包含块：Antv-X6 #container 等 absolute; top:0
 *   的根容器锚定到 padding 之下的内容区（absolute 的 top:0 取 padding-box
 *   顶缘，直接垫在外层会被算进避让区）。
 */
const ImmersiveShellAvoid: React.FC = () => {
  // 非沉浸（浏览器/独立窗口）直出，不引入包裹层
  if (!isImmersiveShell()) {
    return <Outlet />;
  }

  const avoid = shellAvoid.TOOLBAR;
  return (
    <div
      style={{ height: '100vh', boxSizing: 'border-box', paddingTop: avoid }}
    >
      <div style={{ position: 'relative', height: '100%' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ImmersiveShellAvoid;
