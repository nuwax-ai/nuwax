import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetWechatIlinkQrStatus,
  apiStartWechatIlinkQr,
} from '@/services/imChannel';
import {
  CheckCircleFilled,
  QrcodeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Form,
  FormInstance,
  message,
  QRCode,
  Space,
  Spin,
  Tag,
} from 'antd';
import cx from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

interface WechatIlinkFormProps {
  form: FormInstance;
}

const WechatIlinkForm: React.FC<WechatIlinkFormProps> = ({ form }) => {
  const [qrInfo, setQrInfo] = useState<{
    sessionId: string;
    qrcode: string;
    qrcodeImgContent: string;
    status: string;
    configData?: string;
  } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const isMountedRef = React.useRef(true);
  const timerRef = React.useRef<any>(null);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const startPolling = (sessionId: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const startTime = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    const performPoll = async () => {
      try {
        // 检查轮询是否超时 (5分钟)
        if (Date.now() - startTime > FIVE_MINUTES) {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          setQrInfo((prev) => (prev ? { ...prev, status: 'expired' } : null));
          message.warning(
            dict('PC.Pages.IMChannel.WechatIlinkForm.qrTimeoutWarning'),
          );
          return;
        }

        const res = await apiGetWechatIlinkQrStatus({ sessionId });

        // 若组件已卸载或定时器已被清理（说明已有并行请求处理了成功/失败），则不再处理
        if (!isMountedRef.current || !timerRef.current) return;

        if (res.code === SUCCESS_CODE && res.data) {
          const { status, configData } = res.data;

          if (status === 'connected' || status === 'confirmed') {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setQrInfo((prev) =>
              prev ? { ...prev, status, configData } : null,
            );
            if (status === 'connected') {
              message.success(
                dict('PC.Pages.IMChannel.WechatIlinkForm.connectionSuccess'),
              );
            } else {
              message.success(
                dict('PC.Pages.IMChannel.WechatIlinkForm.scanConfirmSuccess'),
              );
            }
            return;
          } else if (status === 'expired') {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setQrInfo((prev) =>
              prev ? { ...prev, status, configData } : null,
            );
            message.error(dict('PC.Pages.IMChannel.WechatIlinkForm.qrExpired'));
            return;
          } else {
            setQrInfo((prev) =>
              prev ? { ...prev, status, configData } : null,
            );
            // 本次请求完成后，安排下一次轮询 (串行模式)
            timerRef.current = setTimeout(performPoll, 2000);
          }
        } else {
          // 异常情况也尝试继续重试
          timerRef.current = setTimeout(performPoll, 2000);
        }
      } catch (error) {
        if (!isMountedRef.current || !timerRef.current) return;
        console.error('Polling failed:', error);
        // 网络错误也尝试继续
        timerRef.current = setTimeout(performPoll, 2000);
      }
    };

    // 立即发起第一次轮询
    timerRef.current = setTimeout(performPoll, 2000);
  };

  // 微信扫码逻辑
  const handleGetQr = async () => {
    // 立即停止之前的轮询
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setQrLoading(true);
    setQrInfo(null);
    try {
      const res = await apiStartWechatIlinkQr();
      if (res.code === SUCCESS_CODE && res.data) {
        setQrInfo({
          sessionId: res.data.sessionId,
          qrcode: res.data.qrcode,
          qrcodeImgContent: res.data.qrcodeImgContent,
          status: 'wait',
        });
        message.success(
          dict('PC.Pages.IMChannel.WechatIlinkForm.getQrSuccess'),
        );
        startPolling(res.data.sessionId);
      }
    } catch (error) {
      console.error('Get QR failed:', error);
    } finally {
      setQrLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'none':
        return (
          <Tag color="default">
            {dict('PC.Pages.IMChannel.WechatIlinkForm.statusNone')}
          </Tag>
        );
      case 'wait':
        return (
          <Tag color="default">
            {dict('PC.Pages.IMChannel.WechatIlinkForm.statusWait')}
          </Tag>
        );
      case 'scaned':
        return (
          <Tag color="processing">
            {dict('PC.Pages.IMChannel.WechatIlinkForm.statusScanned')}
          </Tag>
        );
      case 'confirmed':
      case 'connected':
        return (
          <Tag color="success">
            {dict('PC.Pages.IMChannel.WechatIlinkForm.statusConnected')}
          </Tag>
        );
      case 'expired':
        return (
          <Tag color="error">
            {dict('PC.Pages.IMChannel.WechatIlinkForm.statusExpired')}
          </Tag>
        );
      default:
        return null;
    }
  };

  const isSuccess =
    qrInfo?.status === 'connected' || qrInfo?.status === 'confirmed';

  // 监听成功状态，同步 configData 到 Form
  React.useEffect(() => {
    if (isSuccess && qrInfo?.configData) {
      try {
        const config = JSON.parse(qrInfo.configData);
        // 微信的 configData 配置
        form.setFieldsValue({ configData: config });
        // 启用状态设置为启用
        form.setFieldsValue({ enabled: true });
      } catch (e) {
        console.error('Parse configData failed:', e);
      }
    }
  }, [isSuccess, qrInfo?.configData, form]);

  return (
    <>
      <Form.Item name="configData" hidden>
        <div />
      </Form.Item>
      <Form.Item
        label={dict('PC.Pages.IMChannel.WechatIlinkForm.scanToConnect')}
        tooltip={dict('PC.Pages.IMChannel.WechatIlinkForm.scanTooltip')}
      >
        <div className={styles['wechat-qr-container']}>
          <div className={styles['qr-wrapper']}>
            {/* 加载中状态 */}
            {qrLoading ? (
              <Spin
                tip={dict('PC.Pages.IMChannel.WechatIlinkForm.fetchingQr')}
              />
            ) : qrInfo && (qrInfo.qrcode || qrInfo.qrcodeImgContent) ? (
              <div className={styles['qr-content']}>
                <QRCode
                  value={qrInfo.qrcodeImgContent}
                  size={200}
                  bordered={false}
                  status={qrInfo.status === 'expired' ? 'expired' : 'active'}
                  onRefresh={handleGetQr}
                  className={cx(styles['qr-code'], {
                    [styles.expired]: qrInfo.status === 'expired',
                  })}
                />

                {/* 扫码成功蒙层 */}
                {isSuccess && (
                  <div className={styles['overlay-success']}>
                    <CheckCircleFilled className={styles['success-icon']} />
                    <div className={styles['success-title']}>
                      {dict('PC.Pages.IMChannel.WechatIlinkForm.scanSuccess')}
                    </div>
                    <div className={styles['success-desc']}>
                      {dict(
                        'PC.Pages.IMChannel.WechatIlinkForm.clickConfirmToSave',
                      )}
                    </div>
                  </div>
                )}

                {/* 过期蒙层 */}
                {qrInfo.status === 'expired' && (
                  <div
                    className={styles['overlay-expired']}
                    onClick={handleGetQr}
                  >
                    <Button type="link" icon={<ReloadOutlined />}>
                      {dict(
                        'PC.Pages.IMChannel.WechatIlinkForm.qrExpiredRefresh',
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* 初始占位状态 */
              <div className={styles['placeholder-area']}>
                <QrcodeOutlined className={styles['placeholder-icon']} />
                <div className={styles['placeholder-text']}>
                  {dict('PC.Pages.IMChannel.WechatIlinkForm.clickToGetQr')}
                </div>
              </div>
            )}
          </div>

          <div className={styles['status-info']}>
            {dict('PC.Pages.IMChannel.WechatIlinkForm.status')}：
            {getStatusTag(qrInfo?.status || 'none')}
          </div>

          {isSuccess && (
            <div className={styles['alert-area']}>
              <Alert
                message={dict(
                  'PC.Pages.IMChannel.WechatIlinkForm.importantNotice',
                )}
                description={dict(
                  'PC.Pages.IMChannel.WechatIlinkForm.importantNoticeDesc',
                )}
                type="warning"
                showIcon
              />
            </div>
          )}

          <Space size={12}>
            <Button type="primary" onClick={handleGetQr} loading={qrLoading}>
              {qrInfo
                ? dict('PC.Pages.IMChannel.WechatIlinkForm.reGetQr')
                : dict('PC.Pages.IMChannel.WechatIlinkForm.getQr')}
            </Button>
          </Space>
        </div>
      </Form.Item>
    </>
  );
};

export default WechatIlinkForm;
