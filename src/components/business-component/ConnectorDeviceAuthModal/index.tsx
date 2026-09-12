import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiConnectorOauthDeviceAuthorize,
  apiConnectorOauthDevicePoll,
} from '@/services/systemManage';
import type { ConnectorOauthDeviceAuthorizeResult } from '@/types/interfaces/systemManage';
import { Button, message, Modal, Spin } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';

/**
 * 扫码连接（设备码 oauth2_device）弹窗（共享组件）
 * @description 连接器「连接」的扫描授权流程弹窗，连接器详情抽屉
 * （ConnectorProviderDetailDrawer）与专家·技能·连接器广场页卡片连接
 * （useConnectorConnect）共用：
 * open 展开后自动 GET /api/connector/oauth/device/authorize 拿二维码 /
 * 核对码并按 expiresIn 倒计时；弹窗展开期间轮询
 * POST /api/connector/oauth/device/poll（body 回传 state + interval），
 * 响应 status 为 authorized / already_completed 即连接成功自动关弹窗
 * 并回调 onConnected（成功提示由本组件完成）；倒计时结束或点
 * 「重新获取二维码」重新调 authorize（旧 state 作废，重新获取失败
 * 沿用旧二维码，首次获取失败自动关闭弹窗）。
 */

export interface ConnectorDeviceAuthModalProps {
  /** 是否打开（true 时自动获取二维码并启动倒计时与授权轮询） */
  open: boolean;
  /** 连接器 service 标识 */
  service: string;
  /** 空间 ID（团队空间维度传当前空间；系统广场/管理侧不传） */
  spaceId?: number;
  /** 关闭回调（手动关闭 / 授权成功自动关闭 / 首次获取失败自动关闭） */
  onClose: () => void;
  /** 连接成功回调（触发前已先 onClose，父级只需更新连接状态） */
  onConnected: () => void;
}

const ConnectorDeviceAuthModal: React.FC<ConnectorDeviceAuthModalProps> = ({
  open,
  service,
  spaceId,
  onClose,
  onConnected,
}) => {
  /** authorize 结果（state / 二维码 / 核对码 / 有效期；重新获取后整体替换） */
  const [deviceAuth, setDeviceAuth] =
    useState<ConnectorOauthDeviceAuthorizeResult | null>(null);
  /** authorize 请求中（二维码区 Spin 与「重新获取二维码」loading，兼防重入） */
  const [deviceAuthLoading, setDeviceAuthLoading] = useState<boolean>(false);
  /** 二维码剩余有效秒数（每秒递减，到 0 自动重新获取二维码） */
  const [deviceCountdown, setDeviceCountdown] = useState<number>(0);
  /**
   * 扫码连接代数标记：重新获取二维码 / 关闭弹窗时 +1，
   * 在飞请求的响应凭代数比对自行作废（请求本身无法取消）
   */
  const deviceGenRef = useRef<number>(0);
  /** 授权结果轮询定时器（链式 setTimeout：上一次落地后再排下一次防叠加） */
  const devicePollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 倒计时定时器（每秒递减，到 0 清除并触发重新获取二维码） */
  const deviceCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  /** 停止扫码连接轮询与倒计时（关弹窗 / 重新获取二维码 / 组件卸载） */
  const stopDeviceTimers = useCallback(() => {
    deviceGenRef.current += 1;
    if (devicePollTimerRef.current) {
      clearTimeout(devicePollTimerRef.current);
      devicePollTimerRef.current = null;
    }
    if (deviceCountdownTimerRef.current) {
      clearInterval(deviceCountdownTimerRef.current);
      deviceCountdownTimerRef.current = null;
    }
  }, []);

  /**
   * 关闭扫码连接弹窗：作废在飞请求与定时器、清空本地展示状态并通知
   * 父级收起弹窗（受控 open 以此回收）
   */
  const closeDeviceAuth = useCallback(() => {
    stopDeviceTimers();
    setDeviceAuth(null);
    setDeviceCountdown(0);
    onClose();
  }, [stopDeviceTimers, onClose]);

  /**
   * 启动二维码倒计时（每秒递减）：
   * 到 0 清除定时器并触发重新获取二维码（onEnd）
   */
  const startDeviceCountdown = (seconds: number, onEnd: () => void) => {
    if (deviceCountdownTimerRef.current) {
      clearInterval(deviceCountdownTimerRef.current);
      deviceCountdownTimerRef.current = null;
    }
    let remain = Math.max(0, Math.floor(seconds));
    setDeviceCountdown(remain);
    if (remain <= 0) {
      onEnd();
      return;
    }
    deviceCountdownTimerRef.current = setInterval(() => {
      remain -= 1;
      if (remain <= 0) {
        setDeviceCountdown(0);
        if (deviceCountdownTimerRef.current) {
          clearInterval(deviceCountdownTimerRef.current);
          deviceCountdownTimerRef.current = null;
        }
        onEnd();
      } else {
        setDeviceCountdown(remain);
      }
    }, 1000);
  };

  /**
   * 启动授权结果轮询（弹窗展开后调用）：
   * POST /api/connector/oauth/device/poll（body 回传 state + interval），
   * 链式 setTimeout —— 上一次请求落地后再排下一次，响应慢（长轮询）也不叠加；
   * 响应 data.status 为 authorized / already_completed 即连接成功：
   * 关弹窗、提示并回调 onConnected（父级就地更新连接状态）；
   * 其余状态（如 pending）按 interval 秒继续轮询
   */
  const startDevicePoll = (stateValue: string, intervalSeconds: number) => {
    const gen = deviceGenRef.current;
    const pollOnce = async () => {
      try {
        const response = await apiConnectorOauthDevicePoll({
          state: stateValue,
          interval: intervalSeconds,
        });
        // 已重新获取二维码 / 已关弹窗：丢弃过期的轮询响应
        if (deviceGenRef.current !== gen) return;
        const status = response?.data?.status ?? '';
        if (status === 'authorized' || status === 'already_completed') {
          closeDeviceAuth();
          message.success('连接成功');
          onConnected();
          return;
        }
        // 其余状态（待授权）：按间隔继续轮询
      } catch {
        // 网络 / 业务异常不中断轮询（授权可能稍后完成，倒计时兜底刷新）
        if (deviceGenRef.current !== gen) return;
      }
      if (deviceGenRef.current !== gen) return;
      devicePollTimerRef.current = setTimeout(
        () => void pollOnce(),
        intervalSeconds * 1000,
      );
    };
    void pollOnce();
  };

  /**
   * 发起 / 重新获取扫码连接（弹窗展开自动调用、「重新获取二维码」按钮与
   * 倒计时结束共用）：GET /api/connector/oauth/device/authorize 拿二维码，
   * 成功后按响应启动倒计时与授权结果轮询；重新获取失败时沿用旧二维码
   * 继续轮询（旧轮询在成功替换前不作废），首次获取失败（无旧二维码可
   * 沿用）自动关闭弹窗回到打开前状态
   */
  const fetchDeviceAuthorize = async () => {
    if (!service) {
      message.error('连接器 service 缺失，无法发起扫码连接');
      return;
    }
    // 防重入：请求飞行中（含倒计时到 0 自动触发）直接忽略
    if (deviceAuthLoading) return;
    try {
      setDeviceAuthLoading(true);
      const response = await apiConnectorOauthDeviceAuthorize({
        service,
        spaceId,
      });
      if (response?.code !== SUCCESS_CODE || !response.data?.state) {
        message.error(response?.message || '获取扫码连接二维码失败');
        // 首次获取失败：无旧二维码可沿用，关闭弹窗（重新获取失败保持旧图）
        if (!deviceAuth) closeDeviceAuth();
        return;
      }
      const data = response.data;
      // 作废旧二维码的轮询与倒计时（gen + 1 后旧轮询链自行失效）
      stopDeviceTimers();
      setDeviceAuth(data);
      const intervalSeconds =
        data.interval && data.interval > 0 ? data.interval : 5;
      startDeviceCountdown(
        data.expiresIn && data.expiresIn > 0 ? data.expiresIn : 300,
        // 倒计时结束：自动重新获取二维码（loading 守卫防重入）
        () => void fetchDeviceAuthorize(),
      );
      startDevicePoll(data.state, intervalSeconds);
    } catch {
      // 业务 / 网络错误：全局 errorHandler 已提示；首次获取失败关闭弹窗，
      // 重新获取失败沿用旧二维码继续轮询
      if (!deviceAuth) closeDeviceAuth();
    } finally {
      setDeviceAuthLoading(false);
    }
  };

  // 弹窗展开自动获取二维码；关闭 / service 变化 / 卸载时停止轮询与倒计时
  // （closeDeviceAuth 已作废在飞请求，此处清理幂等双保险）
  useEffect(() => {
    if (!open || !service) return;
    void fetchDeviceAuthorize();
    return () => stopDeviceTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service]);

  // 弹窗关闭：清空本地展示状态（父级直接置 open=false 的路径不经
  // closeDeviceAuth，兜底清理避免下次打开闪现上一轮旧二维码）
  useEffect(() => {
    if (!open) {
      setDeviceAuth(null);
      setDeviceCountdown(0);
    }
  }, [open]);

  // ---------------- 弹窗展示派生值 ----------------
  /**
   * 二维码图片地址：后端返回相对路径（/api/connector/oauth/device/qr?state=xxx），
   * img 为浏览器原生加载、不经 request 拦截器，需拼 BASE_URL 指向后端
   * （dev server 自身无 /api 路由直接加载会 404；线上同域部署 BASE_URL
   * 为空即同源直连）；dev 下页面与后端跨域，需后端放行该图片接口的
   * 跨域资源加载。该接口凭 state 访问、无需 Bearer
   */
  const deviceQrContent = deviceAuth?.qrUrl
    ? /^https?:\/\//i.test(deviceAuth.qrUrl)
      ? deviceAuth.qrUrl
      : `${process.env.BASE_URL || ''}${deviceAuth.qrUrl}`
    : '';
  /** 核对码（候选字段回退，对齐编辑抽屉 pickString 的容错习惯） */
  const deviceUserCode =
    deviceAuth?.userCode || deviceAuth?.verificationCode || '';
  /** 剩余时间 mm:ss（如 8:16） */
  const deviceCountdownText = `${Math.floor(deviceCountdown / 60)}:${String(
    deviceCountdown % 60,
  ).padStart(2, '0')}`;

  return (
    <Modal
      open={open}
      width={420}
      centered
      destroyOnHidden
      maskClosable={false}
      keyboard={false}
      title={`扫码连接 · ${service}`}
      onCancel={closeDeviceAuth}
      footer={null}
    >
      <div className={styles.deviceBody}>
        <div className={styles.deviceQrWrap}>
          {/* 请求中或尚未拿到 authorize 结果（弹窗刚展开）：Spin 占位 */}
          {deviceAuthLoading || !deviceAuth ? (
            <Spin size="large" />
          ) : !deviceQrContent ? (
            <span className={styles.deviceQrEmpty}>二维码图片缺失</span>
          ) : (
            <img
              src={deviceQrContent}
              alt="扫码连接二维码"
              width={240}
              height={240}
            />
          )}
        </div>
        <div className={styles.deviceHint}>
          请用 App 扫描上方二维码，在手机上确认授权
        </div>
        <div className={styles.deviceMeta}>
          {deviceUserCode ? (
            <>
              核对码 <span className={styles.deviceCode}>{deviceUserCode}</span>
              <span className={styles.deviceMetaDivider}>·</span>
            </>
          ) : null}
          剩余{' '}
          <span className={styles.deviceCountdown}>{deviceCountdownText}</span>
        </div>
        {/* 重新获取二维码：底部通栏主按钮（与项目弹窗底部的提交按钮同款排布） */}
        <Button
          type="primary"
          block
          className={styles.deviceRefreshBtn}
          loading={deviceAuthLoading}
          onClick={() => void fetchDeviceAuthorize()}
        >
          重新获取二维码
        </Button>
      </div>
    </Modal>
  );
};

export default ConnectorDeviceAuthModal;
