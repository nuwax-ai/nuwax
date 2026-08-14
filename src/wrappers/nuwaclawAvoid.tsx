import { NUWA_CLAW_PADDING_TOP } from '@/layouts/DynamicMenusLayout';
import { isNuwaClaw } from '@/utils/nuwaClawBridge';
import React from 'react';
import { Outlet } from 'umi';

/**
 * nuwaclaw 桌面端全屏路由（layout:false）顶部避让 wrapper。
 *
 * 这些路由不走 @/layouts（主内容区的避让覆盖不到），页面返回栏顶到窗口上沿，
 * 会被 nuwaclaw 工具栏浮层遮挡（macOS 左侧红绿灯 + Win/Linux 左侧自绘按钮组，
 * 及右侧更新入口）。本 wrapper 由 config 层按「layout:false + 非白名单」规则
 * 自动注入（见 config/config.ts），新增全屏业务路由自动获得避让；
 * 内部 isNuwaClaw() 门控，浏览器端零影响。
 */
const NuwaclawAvoidWrapper: React.FC = () => {
  if (!isNuwaClaw()) return <Outlet />;
  return (
    <div
      style={{
        height: '100%',
        paddingTop: NUWA_CLAW_PADDING_TOP,
        boxSizing: 'border-box',
      }}
    >
      <Outlet />
    </div>
  );
};

export default NuwaclawAvoidWrapper;
