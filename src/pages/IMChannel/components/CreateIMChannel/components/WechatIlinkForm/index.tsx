import { SUCCESS_CODE } from '@/constants/codes.constants';
import { QR_CODE_GENERATOR_URL } from '@/constants/imChannel.constants';
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
  Space,
  Spin,
  Tag,
} from 'antd';
import React, { useState } from 'react';

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
          message.warning('本次扫码已由于超时停止，请重新获取二维码');
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
              message.success('连接成功');
            } else {
              message.success('扫码确认成功');
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
            message.error('二维码已过期，请重新获取');
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
        message.success('获取二维码成功');
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
        return <Tag color="default">未开始</Tag>;
      case 'wait':
        return <Tag color="default">等待扫码</Tag>;
      case 'scaned':
        return <Tag color="processing">已扫码，请在手机上确认</Tag>;
      case 'confirmed':
      case 'connected':
        return <Tag color="success">已连接</Tag>;
      case 'expired':
        return <Tag color="error">已过期</Tag>;
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
        form.setFieldsValue({ configData: config });
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
      <Form.Item label="扫码连接" tooltip="点击获取二维码并使用手机微信扫码。">
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              width: 216,
              height: 216,
              margin: '0 auto 16px',
              border: '1px dashed #d9d9d9',
              borderRadius: 8,
              justifyContent: 'center',
              backgroundColor: '#fafafa',
              overflow: 'hidden',
            }}
          >
            {/* 加载中状态 */}
            {qrLoading ? (
              <Spin tip="正在获取二维码..." />
            ) : qrInfo && (qrInfo.qrcode || qrInfo.qrcodeImgContent) ? (
              <div style={{ position: 'relative', width: 216, height: 216 }}>
                <img
                  src={`${QR_CODE_GENERATOR_URL}${encodeURIComponent(
                    qrInfo.qrcodeImgContent,
                  )}`}
                  alt="QR Code"
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: 8,
                    opacity: qrInfo.status === 'expired' ? 0.3 : 1,
                    transition: 'all 0.3s',
                  }}
                />

                {/* 扫码成功蒙层 */}
                {isSuccess && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.95)',
                      zIndex: 10,
                    }}
                  >
                    <CheckCircleFilled
                      style={{
                        fontSize: 48,
                        color: '#52c41a',
                        marginBottom: 12,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#262626',
                      }}
                    >
                      扫码成功
                    </div>
                    <div
                      style={{ fontSize: 13, color: '#8c8c8c', marginTop: 4 }}
                    >
                      请点击下方‘确定’按钮保存
                    </div>
                  </div>
                )}

                {/* 过期蒙层 */}
                {qrInfo.status === 'expired' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      zIndex: 11,
                    }}
                    onClick={handleGetQr}
                  >
                    <Button type="link" icon={<ReloadOutlined />}>
                      二维码过期，点击刷新
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* 初始占位状态 */
              <div
                style={{
                  color: '#bfbfbf',
                  textAlign: 'center',
                  padding: '0 20px',
                }}
              >
                <QrcodeOutlined
                  style={{ fontSize: 48, marginBottom: 12, display: 'block' }}
                />
                <div style={{ fontSize: 13 }}>请点击下方按钮获取二维码</div>
              </div>
            )}
          </div>

          <div style={{ margin: '16px 0' }}>
            状态：{getStatusTag(qrInfo?.status || 'none')}
          </div>

          {isSuccess && (
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <Alert
                message="重要提示"
                description="同一个微信在第二次扫码确认后，原有的机器人连接将立即失效。请务必点击下方的“确定”按钮以保存并生效当前配置。"
                type="warning"
                showIcon
              />
            </div>
          )}

          <Space size={12}>
            <Button type="primary" onClick={handleGetQr} loading={qrLoading}>
              {qrInfo ? '重新获取二维码' : '获取二维码'}
            </Button>
          </Space>
        </div>
      </Form.Item>
    </>
  );
};

export default WechatIlinkForm;
