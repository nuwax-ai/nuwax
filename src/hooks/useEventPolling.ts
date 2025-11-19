import { APP_VERSION } from '@/constants/home.constants';
import {
  apiClearEvent,
  apiCollectEvent,
  ApiCollectEventResponse,
} from '@/services/event';
import { modalConfirm } from '@/utils/ant-custom';
import eventBus from '@/utils/eventBus';
import { useRef } from 'react';
import { useRequest } from 'umi';

export default function useEventPolling(): void {
  // 使用ref记录当前是否正在处理事件，避免并发处理
  const isProcessingRef = useRef<boolean>(false);
  // 使用ref记录是否已经显示过版本更新弹窗，确保弹窗唯一性
  const versionModalShownRef = useRef<boolean>(false);
  // 使用ref记录当前版本号
  const currentVersionRef = useRef<string | null>(null);

  /**
   * 检查版本更新
   * @param newVersion 新版本号
   */
  const checkVersionUpdate = (newVersion: string | undefined) => {
    // 如果没有版本号，跳过检查
    if (!newVersion) {
      return;
    }

    // 获取存储的版本号（使用 sessionStorage，仅在当前会话有效）
    const storedVersion = sessionStorage.getItem(APP_VERSION);

    // 如果是第一次获取版本号，保存并跳过检查
    if (!storedVersion) {
      sessionStorage.setItem(APP_VERSION, newVersion);
      currentVersionRef.current = newVersion;
      return;
    }

    // 如果版本号一致，更新当前版本引用并返回
    if (storedVersion === newVersion) {
      currentVersionRef.current = newVersion;
      return;
    }

    // 版本号不一致，需要检查是否应该显示弹窗
    // 如果当前版本引用和新区本号一致，说明已经提示过这个版本，不再重复显示
    if (
      currentVersionRef.current === newVersion &&
      versionModalShownRef.current
    ) {
      return;
    }

    // 如果版本号再次更新（比如从 1.0.3 更新到 1.0.4），重置弹窗标记，允许再次提示
    if (
      currentVersionRef.current !== newVersion &&
      versionModalShownRef.current
    ) {
      versionModalShownRef.current = false;
    }

    // 标记已显示弹窗，确保唯一性
    versionModalShownRef.current = true;
    // 更新当前版本引用
    currentVersionRef.current = newVersion;

    // 显示版本更新提示
    modalConfirm(
      '发现新版本',
      `检测到新版本 ${newVersion}，是否立即更新？`,
      () => {
        // 用户点击更新，重新加载页面
        // 更新存储的版本号（使用 sessionStorage）
        sessionStorage.setItem(APP_VERSION, newVersion);
        // 重新加载页面
        window.location.reload();
      },
      () => {
        // 用户点击取消，更新存储的版本号但不刷新页面
        // 更新 sessionStorage，这样下次轮询时不会再次提示同一版本
        sessionStorage.setItem(APP_VERSION, newVersion);
        currentVersionRef.current = newVersion;
        // 不重置弹窗标记，保持本次会话中不再重复显示
        // 如果版本号再次更新（比如从 1.0.3 更新到 1.0.4），会再次提示
      },
    );
  };

  const { run: startPolling, cancel: stopPolling } = useRequest(
    apiCollectEvent,
    {
      loading: false,
      pollingInterval: 5000, // 轮询间隔，单位ms
      // 在屏幕不可见时，暂时暂停定时任务。
      pollingWhenHidden: false,
      // 轮询错误重试次数。如果设置为 -1，则无限次
      pollingErrorRetryCount: -1,
      throwOnError: true,
      onSuccess: async (data: ApiCollectEventResponse) => {
        // 检查版本更新（优先处理，不阻塞事件处理）
        if (data?.version) {
          checkVersionUpdate(data.version);
        }

        // 如果已经在处理事件，则跳过本次回调
        if (isProcessingRef.current) {
          console.log('跳过重复的事件处理');
          return;
        }

        if (data?.hasEvent) {
          try {
            // 标记开始处理事件
            isProcessingRef.current = true;

            // 停止轮询，避免在处理过程中重复调用
            stopPolling();

            // 遍历所有事件，发布到 eventBus
            for (const event of data.eventList) {
              eventBus.emit(event.type, event.event);
            }

            // 事件处理完后清除
            await apiClearEvent();
          } catch (error) {
            console.error('处理事件时出错:', error);
          } finally {
            // 重新开始轮询
            startPolling();
            // 处理完成，重置标记
            isProcessingRef.current = false;
          }
        }
      },
      onError: () => {},
    },
  );
}
