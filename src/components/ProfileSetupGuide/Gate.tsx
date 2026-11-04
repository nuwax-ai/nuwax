import { consumeLoginJustCompleted } from '@/utils/profileSetupGate';
import {
  needsProfileSetup,
  type ProfileSetupUserLike,
} from '@/utils/profileSetupPrompt';
import React, { useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
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
  const { getUserInfo } = useModel('userInfo');
  // 重用判定请求，避免 StrictMode 的 effect 重放消费标记后丢掉引导。
  const pendingUser = useRef<Promise<ProfileSetupUserLike | null> | null>(null);

  useEffect(() => {
    if (!active) {
      pendingUser.current = null;
      setOpen(false);
      return;
    }
    if (!pendingUser.current) {
      if (!consumeLoginJustCompleted()) return;
      // 由模型入口初始化 userInfo，确保弹窗可保存，而非只读到存储缓存。
      pendingUser.current = getUserInfo();
    }
    const request = pendingUser.current;
    if (!request) return;
    let current = true;
    request
      .then((userInfo) => {
        if (current && needsProfileSetup(userInfo || {})) setOpen(true);
      })
      .catch(() => {
        // 拿不到用户信息时不弹引导，不影响登录主流程。
      });
    return () => {
      current = false;
    };
  }, [active, getUserInfo]);

  return <ProfileSetupGuide open={open} onClose={() => setOpen(false)} />;
};

export default ProfileSetupGuideGate;
