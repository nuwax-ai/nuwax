import { needsProfileSetup } from '@/utils/profileSetupPrompt';
import { consumeLoginJustCompleted } from '@/utils/profileSetupGate';
import React, { useEffect, useRef, useState } from 'react';
import { UserService } from '@/services/userService';
import ProfileSetupGuide from './index';

/**
 * L2 引导全局 Gate：挂在 AppContainer，随登录态就位触发。
 *
 * - 只在 loggedIn 由 false→true 时消费「刚完成登录」标记并判定一次
 *   （持久会话冷启动：loggedIn 首值即 true 且无标记 → 不弹）；
 * - 判定失败（用户信息拿不到）按「宁可不弹」处理，不影响主流程；
 * - 弹框关闭即结束本轮：标记已消费，下次登录才会再判定（无冷却口径）。
 */
const ProfileSetupGuideGate: React.FC<{ active: boolean }> = ({ active }) => {
  const [open, setOpen] = useState(false);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (!active) {
      // 登出/回登录页时复位，下一次登录（false→true）再判定一次
      wasActiveRef.current = false;
      return;
    }
    if (wasActiveRef.current) return;
    wasActiveRef.current = true;
    if (!consumeLoginJustCompleted()) return;
    UserService.getUserInfo()
      .then((userInfo) => {
        if (needsProfileSetup(userInfo || {})) {
          setOpen(true);
        }
      })
      .catch(() => {
        // 拿不到用户信息时不弹引导，不影响登录主流程
      });
  }, [active]);

  return <ProfileSetupGuide open={open} onClose={() => setOpen(false)} />;
};

export default ProfileSetupGuideGate;
