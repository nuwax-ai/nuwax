import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiAddMerchantOnboarding,
  apiGetMerchantOnboardingByTenantId,
  apiUpdateMerchantOnboarding,
} from '@/services/subscriptionService';
import { apiSystemUploadFile } from '@/services/systemManage';
import {
  MerchantOnboardingData,
  MerchantOnboardingStatusEnum,
} from '@/types/interfaces/subscription';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  IdcardOutlined,
  LoadingOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Timeline,
  Upload,
  message,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

type UploadRequestOption = Parameters<
  NonNullable<UploadProps['customRequest']>
>[0];

const statusMap = {
  [MerchantOnboardingStatusEnum.DRAFT]: {
    icon: <ClockCircleFilled style={{ color: '#faad14' }} />,
    color: 'warning' as const,
    text: dict('PC.Pages.SystemMerchantInfo.statusDraft'),
  },
  [MerchantOnboardingStatusEnum.UNDER_REVIEW]: {
    icon: <ClockCircleFilled style={{ color: '#1890ff' }} />,
    color: 'info' as const,
    text: dict('PC.Pages.SystemMerchantInfo.statusUnderReview'),
  },
  [MerchantOnboardingStatusEnum.APPROVED]: {
    icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
    color: 'success' as const,
    text: dict('PC.Pages.SystemMerchantInfo.statusApproved'),
  },
  [MerchantOnboardingStatusEnum.REJECTED]: {
    icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
    color: 'error' as const,
    text: dict('PC.Pages.SystemMerchantInfo.statusRejected'),
  },
};

const MerchantInfo: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const tenantId = initialState?.currentUser?.tenantId;
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [onboardingId, setOnboardingId] = useState<number | undefined>(
    undefined,
  );
  const [status, setStatus] = useState<MerchantOnboardingStatusEnum>(
    MerchantOnboardingStatusEnum.DRAFT,
  );
  const [auditTimeline, setAuditTimeline] = useState<any[]>([]);

  // 图片上传状态
  const [upLoadingFront, setUpLoadingFront] = useState(false);
  const [upLoadingBack, setUpLoadingBack] = useState(false);
  const [upLoadingLicense, setUpLoadingLicense] = useState(false);

  // 监听表单字段
  const legalPersonIdCardUrl = Form.useWatch('legalPersonIdCardUrl', form);
  const legalPersonIdCardBackUrl = Form.useWatch(
    'legalPersonIdCardBackUrl',
    form,
  );
  const orgCertificateUrl = Form.useWatch('orgCertificateUrl', form);

  const fetchMerchantOnboarding = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await apiGetMerchantOnboardingByTenantId({ tenantId });
      if (res?.code === SUCCESS_CODE && res.data) {
        const data = res.data;
        setOnboardingId(data.id);
        setStatus(data.status);
        form.setFieldsValue({
          ...data,
        });
        setAuditTimeline([]);
      } else {
        setOnboardingId(undefined);
        setStatus(MerchantOnboardingStatusEnum.DRAFT);
        form.resetFields();
      }
    } catch (error) {
      console.error('Fetch onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantOnboarding();
  }, [tenantId]);

  const beforeUpload = (file: File) => {
    const isAcceptedFormat =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.type === 'image/png';
    if (!isAcceptedFormat) {
      message.error(dict('PC.Common.Global.imageFormatError'));
      return Upload.LIST_IGNORE;
    }
    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error(dict('PC.Common.Global.imageSizeError'));
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleUpload = async (
    options: UploadRequestOption,
    type: 'front' | 'back' | 'license',
  ) => {
    const { file, onSuccess, onError } = options;
    if (type === 'front') setUpLoadingFront(true);
    else if (type === 'back') setUpLoadingBack(true);
    else setUpLoadingLicense(true);

    try {
      const res = await apiSystemUploadFile(file as File);
      if (res.success && res.data?.url) {
        const url = res.data.url;
        const fieldName =
          type === 'front'
            ? 'legalPersonIdCardUrl'
            : type === 'back'
            ? 'legalPersonIdCardBackUrl'
            : 'orgCertificateUrl';
        form.setFieldValue(fieldName, url);
        onSuccess?.(res.data);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      onError?.(error as any);
      message.error(dict('PC.Common.Global.error'));
    } finally {
      if (type === 'front') setUpLoadingFront(false);
      else if (type === 'back') setUpLoadingBack(false);
      else setUpLoadingLicense(false);
    }
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload: Partial<MerchantOnboardingData> = {
        ...values,
        id: onboardingId,
        tenantId,
        status: MerchantOnboardingStatusEnum.UNDER_REVIEW,
      };

      const api = onboardingId
        ? apiUpdateMerchantOnboarding
        : apiAddMerchantOnboarding;
      const res = await api(payload);

      if (res?.code === SUCCESS_CODE) {
        message.success(dict('PC.Common.Global.saveSuccess'));
        fetchMerchantOnboarding();
      }
    } catch (error) {
      console.error('Save onboarding error:', error);
    } finally {
      setSaving(false);
    }
  };

  const statusInfo =
    statusMap[status] || statusMap[MerchantOnboardingStatusEnum.DRAFT];

  const renderUploadBox = (
    type: 'front' | 'back' | 'license',
    imageUrl?: string,
  ) => {
    const isUploading =
      type === 'front'
        ? upLoadingFront
        : type === 'back'
        ? upLoadingBack
        : upLoadingLicense;

    if (imageUrl) {
      return (
        <div className={cx(styles['upload-box'], styles.hasImage)}>
          <img
            src={imageUrl}
            alt="preview"
            className={cx(styles['preview-image'])}
          />
          <div className={cx(styles['image-mask'])}>
            {isUploading ? (
              <LoadingOutlined className={cx(styles['mask-icon'])} />
            ) : (
              <PlusOutlined className={cx(styles['mask-icon'])} />
            )}
            <span>{dict('PC.Pages.Setting.DeveloperProfile.uploadBtn')}</span>
          </div>
        </div>
      );
    }

    return (
      <div className={cx(styles['upload-box'])}>
        <div className={cx(styles['icon-wrapper'])}>
          {isUploading ? (
            <LoadingOutlined className={cx(styles['upload-icon'])} />
          ) : type === 'license' ? (
            <PictureOutlined className={cx(styles['upload-icon'])} />
          ) : (
            <IdcardOutlined className={cx(styles['upload-icon'])} />
          )}
        </div>
        <div className={cx(styles['upload-text'])}>
          {type === 'front'
            ? dict('PC.Pages.SystemMerchantInfo.idCardFront')
            : type === 'back'
            ? dict('PC.Pages.SystemMerchantInfo.idCardBack')
            : dict('PC.Pages.SystemMerchantInfo.licenseLabel')}
        </div>
        <div className={cx(styles['upload-hint'])}>
          {dict('PC.Pages.Setting.DeveloperProfile.uploadBtn')} ·{' '}
          {dict('PC.Pages.Setting.DeveloperProfile.uploadHint')}
        </div>
      </div>
    );
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.paymentMerchantInfo')}
      rightSlot={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchMerchantOnboarding}
          >
            {dict('PC.Common.Global.refresh')}
          </Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {dict('PC.Common.Global.save')}
          </Button>
        </div>
      }
    >
      <div style={{ paddingBottom: 24 }}>
        <Alert
          style={{ marginBottom: 16 }}
          type={statusInfo.color}
          icon={statusInfo.icon}
          showIcon
          message={statusInfo.text}
          description={
            status === MerchantOnboardingStatusEnum.REJECTED
              ? dict('PC.Pages.SystemMerchantInfo.rejectedHint')
              : undefined
          }
        />

        <Row gutter={24}>
          <Col span={12}>
            <Form form={form} layout="vertical">
              <Card
                title={dict('PC.Pages.SystemMerchantInfo.sectionLegalPerson')}
                style={{ marginBottom: 16 }}
              >
                <Form.Item
                  name="legalPersonName"
                  label={dict('PC.Pages.SystemMerchantInfo.legalPersonName')}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="legalPersonIdNo"
                  label={dict('PC.Pages.SystemMerchantInfo.legalPersonId')}
                  rules={[{ required: true }]}
                >
                  <Input maxLength={18} />
                </Form.Item>
                <Form.Item
                  label={dict('PC.Pages.SystemMerchantInfo.idCardPhotos')}
                  required
                  style={{ marginBottom: 0 }}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="legalPersonIdCardUrl"
                        rules={[
                          {
                            required: true,
                            message: dict('PC.Common.Global.required'),
                          },
                        ]}
                      >
                        <Upload
                          className={styles['id-card-upload']}
                          maxCount={1}
                          accept=".jpg,.jpeg,.png"
                          showUploadList={false}
                          beforeUpload={beforeUpload}
                          customRequest={(opt) => handleUpload(opt, 'front')}
                        >
                          {renderUploadBox('front', legalPersonIdCardUrl)}
                        </Upload>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="legalPersonIdCardBackUrl"
                        rules={[
                          {
                            required: true,
                            message: dict('PC.Common.Global.required'),
                          },
                        ]}
                      >
                        <Upload
                          className={styles['id-card-upload']}
                          maxCount={1}
                          accept=".jpg,.jpeg,.png"
                          showUploadList={false}
                          beforeUpload={beforeUpload}
                          customRequest={(opt) => handleUpload(opt, 'back')}
                        >
                          {renderUploadBox('back', legalPersonIdCardBackUrl)}
                        </Upload>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form.Item>
              </Card>

              <Card
                title={dict(
                  'PC.Pages.SystemMerchantInfo.sectionBusinessLicense',
                )}
                style={{ marginBottom: 16 }}
              >
                <Form.Item
                  name="merchantName"
                  label={dict('PC.Pages.SystemMerchantInfo.companyName')}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="creditCode"
                  label={dict('PC.Pages.SystemMerchantInfo.creditCode')}
                  rules={[{ required: true }]}
                >
                  <Input maxLength={18} />
                </Form.Item>
                <Form.Item
                  name="licenseExpiry"
                  label={dict('PC.Pages.SystemMerchantInfo.licenseExpiry')}
                  rules={[{ required: true }]}
                >
                  <Input style={{ width: '100%' }} placeholder="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item
                  label={dict('PC.Pages.SystemMerchantInfo.licensePhoto')}
                  required
                  style={{ marginBottom: 0 }}
                >
                  <Form.Item
                    name="orgCertificateUrl"
                    rules={[
                      {
                        required: true,
                        message: dict('PC.Common.Global.required'),
                      },
                    ]}
                  >
                    <Upload
                      className={styles['license-upload']}
                      maxCount={1}
                      accept=".jpg,.jpeg,.png"
                      showUploadList={false}
                      beforeUpload={beforeUpload}
                      customRequest={(opt) => handleUpload(opt, 'license')}
                    >
                      {renderUploadBox('license', orgCertificateUrl)}
                    </Upload>
                  </Form.Item>
                </Form.Item>
              </Card>

              <Card
                title={dict('PC.Pages.SystemMerchantInfo.sectionBankAccount')}
                style={{ marginBottom: 16 }}
              >
                <Form.Item
                  name="bankName"
                  label={dict('PC.Pages.SystemMerchantInfo.bankName')}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="bankAccountNo"
                  label={dict('PC.Pages.SystemMerchantInfo.bankAccount')}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="bankBranchName"
                  label={dict('PC.Pages.SystemMerchantInfo.bankBranchCode')}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Card>
            </Form>
          </Col>

          <Col span={12}>
            <Card
              title={dict('PC.Pages.SystemMerchantInfo.sectionAuditProgress')}
            >
              {auditTimeline.length > 0 ? (
                <Timeline
                  items={auditTimeline.map((item) => ({
                    children: (
                      <div>
                        <div>{item.action}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {item.time}
                        </div>
                      </div>
                    ),
                    color:
                      item.status === 'done'
                        ? 'green'
                        : item.status === 'rejected'
                        ? 'red'
                        : 'blue',
                  }))}
                />
              ) : (
                <div
                  style={{
                    color: '#999',
                    textAlign: 'center',
                    padding: '40px 0',
                  }}
                >
                  {dict('PC.Components.ChatInputHomeMentionPopup.noData')}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </WorkspaceLayout>
  );
};

export default MerchantInfo;
