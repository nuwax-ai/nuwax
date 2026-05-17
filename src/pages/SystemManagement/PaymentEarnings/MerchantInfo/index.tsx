import { BankAccountInput } from '@/components/base';
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
  Spin,
  Timeline,
  Upload,
  message,
} from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

type UploadRequestOption = Parameters<
  NonNullable<UploadProps['customRequest']>
>[0];

const statusMap = {
  [MerchantOnboardingStatusEnum.DRAFT]: {
    icon: (
      <ClockCircleFilled className={cx(styles['status-icon'], styles.draft)} />
    ),
    color: 'warning' as const,
    text: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.statusDraft',
    ),
  },
  [MerchantOnboardingStatusEnum.PENDING_REVIEW]: {
    icon: (
      <ClockCircleFilled
        className={cx(styles['status-icon'], styles.reviewing)}
      />
    ),
    color: 'info' as const,
    text: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.statusPendingReview',
    ),
  },
  [MerchantOnboardingStatusEnum.UNDER_REVIEW]: {
    icon: (
      <ClockCircleFilled
        className={cx(styles['status-icon'], styles.reviewing)}
      />
    ),
    color: 'info' as const,
    text: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.statusUnderReview',
    ),
  },
  [MerchantOnboardingStatusEnum.APPROVED]: {
    icon: (
      <CheckCircleFilled
        className={cx(styles['status-icon'], styles.approved)}
      />
    ),
    color: 'success' as const,
    text: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.statusApproved',
    ),
  },
  [MerchantOnboardingStatusEnum.REJECTED]: {
    icon: (
      <CloseCircleFilled
        className={cx(styles['status-icon'], styles.rejected)}
      />
    ),
    color: 'error' as const,
    text: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.statusRejected',
    ),
  },
};

const mk = (key: string) =>
  `PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.${key}`;

const MerchantInfo: React.FC = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onboardingId, setOnboardingId] = useState<number | undefined>(
    undefined,
  );
  const [status, setStatus] = useState<MerchantOnboardingStatusEnum>(
    MerchantOnboardingStatusEnum.DRAFT,
  );
  const [auditTimeline, setAuditTimeline] = useState<any[]>([]);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const [upLoadingFront, setUpLoadingFront] = useState(false);
  const [upLoadingBack, setUpLoadingBack] = useState(false);
  const [upLoadingLicense, setUpLoadingLicense] = useState(false);
  const [upLoadingFinance, setUpLoadingFinance] = useState(false);
  const [upLoadingGate, setUpLoadingGate] = useState(false);
  const [upLoadingLandmark, setUpLoadingLandmark] = useState(false);
  const [upLoadingBankProof, setUpLoadingBankProof] = useState(false);

  const legalPersonIdCardFrontUrl = Form.useWatch(
    'legalPersonIdCardFrontUrl',
    form,
  );
  const legalPersonIdCardBackUrl = Form.useWatch(
    'legalPersonIdCardBackUrl',
    form,
  );
  const orgCertificateUrl = Form.useWatch('orgCertificateUrl', form);
  const photoFinanceRoomUrl = Form.useWatch('photoFinanceRoomUrl', form);
  const photoGateUrl = Form.useWatch('photoGateUrl', form);
  const photoLandmarkUrl = Form.useWatch('photoLandmarkUrl', form);
  const bankAccountProofUrl = Form.useWatch('bankAccountProofUrl', form);

  const uploadingMap: Record<
    string,
    { uploading: boolean; setUploading: (v: boolean) => void }
  > = {
    legalPersonIdCardFrontUrl: {
      uploading: upLoadingFront,
      setUploading: setUpLoadingFront,
    },
    legalPersonIdCardBackUrl: {
      uploading: upLoadingBack,
      setUploading: setUpLoadingBack,
    },
    orgCertificateUrl: {
      uploading: upLoadingLicense,
      setUploading: setUpLoadingLicense,
    },
    photoFinanceRoomUrl: {
      uploading: upLoadingFinance,
      setUploading: setUpLoadingFinance,
    },
    photoGateUrl: { uploading: upLoadingGate, setUploading: setUpLoadingGate },
    photoLandmarkUrl: {
      uploading: upLoadingLandmark,
      setUploading: setUpLoadingLandmark,
    },
    bankAccountProofUrl: {
      uploading: upLoadingBankProof,
      setUploading: setUpLoadingBankProof,
    },
  };

  const watchMap: Record<string, string | undefined> = {
    legalPersonIdCardFrontUrl: legalPersonIdCardFrontUrl,
    legalPersonIdCardBackUrl: legalPersonIdCardBackUrl,
    orgCertificateUrl: orgCertificateUrl,
    photoFinanceRoomUrl: photoFinanceRoomUrl,
    photoGateUrl: photoGateUrl,
    photoLandmarkUrl: photoLandmarkUrl,
    bankAccountProofUrl: bankAccountProofUrl,
  };

  const fetchMerchantOnboarding = async () => {
    setLoading(true);
    try {
      const res = await apiGetMerchantOnboardingByTenantId();
      if (res?.code === SUCCESS_CODE && res.data) {
        const data = res.data;
        setOnboardingId(data.id);
        setStatus(data.status);
        form.setFieldsValue({
          ...data,
          bankAccountNo: data.bankAccountNo
            ? data.bankAccountNo
                .replace(/\s/g, '')
                .replace(/(\d{4})(?=\d)/g, '$1 ')
            : undefined,
        });
        const timeline: any[] = [];
        const currentStatus = data.status;

        // Step 1: 草稿
        timeline.push({
          action: dict(mk('statusDraft')),
          time: data.created
            ? dayjs(data.created).format('YYYY-MM-DD HH:mm:ss')
            : '',
          status: 'done',
        });

        // Step 2: 待审核
        const pastPendingReview = [
          MerchantOnboardingStatusEnum.UNDER_REVIEW,
          MerchantOnboardingStatusEnum.APPROVED,
          MerchantOnboardingStatusEnum.REJECTED,
        ].includes(currentStatus);
        timeline.push({
          action: dict(mk('statusPendingReview')),
          time: '',
          status:
            currentStatus === MerchantOnboardingStatusEnum.PENDING_REVIEW
              ? 'processing'
              : pastPendingReview
              ? 'done'
              : 'pending',
        });

        // Step 3: 审核中
        const pastUnderReview = [
          MerchantOnboardingStatusEnum.APPROVED,
          MerchantOnboardingStatusEnum.REJECTED,
        ].includes(currentStatus);
        timeline.push({
          action: dict(mk('statusUnderReview')),
          time: '',
          status:
            currentStatus === MerchantOnboardingStatusEnum.UNDER_REVIEW
              ? 'processing'
              : pastUnderReview
              ? 'done'
              : 'pending',
        });

        // Step 4: 已通过 or 已拒绝
        if (currentStatus === MerchantOnboardingStatusEnum.REJECTED) {
          timeline.push({
            action: dict(mk('statusRejected')),
            time: data.auditedAt
              ? dayjs(data.auditedAt).format('YYYY-MM-DD HH:mm:ss')
              : '',
            status: 'rejected',
            remark: data.auditRemark,
          });
        } else {
          timeline.push({
            action: dict(mk('statusApproved')),
            time:
              currentStatus === MerchantOnboardingStatusEnum.APPROVED &&
              data.auditedAt
                ? dayjs(data.auditedAt).format('YYYY-MM-DD HH:mm:ss')
                : '',
            status:
              currentStatus === MerchantOnboardingStatusEnum.APPROVED
                ? 'done'
                : 'pending',
          });
        }
        setAuditTimeline(timeline);
        setIsFormDirty(false);
      } else {
        setOnboardingId(undefined);
        setStatus(MerchantOnboardingStatusEnum.DRAFT);
        form.resetFields();
        setAuditTimeline([]);
        setIsFormDirty(false);
      }
    } catch (error) {
      console.error('Fetch onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantOnboarding();
  }, [location]);

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
    fieldName: string,
  ) => {
    const { file, onSuccess, onError } = options;
    uploadingMap[fieldName]?.setUploading(true);

    try {
      const res = await apiSystemUploadFile(file as File);
      if (res.success && res.data?.url) {
        form.setFieldValue(fieldName, res.data.url);
        onSuccess?.(res.data);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      onError?.(error as any);
      message.error(dict('PC.Common.Global.error'));
    } finally {
      uploadingMap[fieldName]?.setUploading(false);
    }
  };

  const handleSave = async (targetStatus?: MerchantOnboardingStatusEnum) => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<MerchantOnboardingData> = {
        ...values,
        bankAccountNo: values.bankAccountNo?.replace(/\s/g, ''),
        id: onboardingId,
        onboardingType: 'TENANT',
        status: targetStatus,
      };

      const api = onboardingId
        ? apiUpdateMerchantOnboarding
        : apiAddMerchantOnboarding;
      const res = await api(payload);

      if (res?.code === SUCCESS_CODE) {
        message.success(dict('PC.Common.Global.saveSuccess'));
        setIsFormDirty(false);
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

  const isFormEditable =
    status === MerchantOnboardingStatusEnum.DRAFT ||
    status === MerchantOnboardingStatusEnum.REJECTED;

  const renderUploadBox = (fieldName: string, imageUrl?: string) => {
    const isUploading = uploadingMap[fieldName]?.uploading;
    const isIdCard =
      fieldName === 'legalPersonIdCardFrontUrl' ||
      fieldName === 'legalPersonIdCardBackUrl';

    if (imageUrl) {
      return (
        <div
          className={cx(
            styles['upload-box'],
            isIdCard ? styles.front : styles.license,
            styles.hasImage,
            !isFormEditable && styles.disabled,
          )}
        >
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
      <div
        className={cx(
          styles['upload-box'],
          isIdCard ? styles.front : styles.license,
          !isFormEditable && styles.disabled,
        )}
      >
        <div className={cx(styles['icon-wrapper'])}>
          {isUploading ? (
            <LoadingOutlined className={cx(styles['upload-icon'])} />
          ) : isIdCard ? (
            <IdcardOutlined className={cx(styles['upload-icon'])} />
          ) : (
            <PictureOutlined className={cx(styles['upload-icon'])} />
          )}
        </div>
        <div className={cx(styles['upload-text'])}>{dict(mk(fieldName))}</div>
        <div className={cx(styles['upload-hint'])}>
          {dict('PC.Pages.Setting.DeveloperProfile.uploadBtn')} ·{' '}
          {dict('PC.Pages.Setting.DeveloperProfile.uploadHint')}
        </div>
      </div>
    );
  };

  const renderUploadField = (
    fieldName: string,
    label: string,
    required = true,
  ) => {
    const isIdCard =
      fieldName === 'legalPersonIdCardFrontUrl' ||
      fieldName === 'legalPersonIdCardBackUrl';
    return (
      <Form.Item
        label={label}
        required={required}
        className={cx(styles['form-item-no-margin'])}
      >
        <Form.Item
          name={fieldName}
          valuePropName="data-url"
          getValueFromEvent={(e) => {
            if (typeof e === 'string') return e;
            if (e?.file?.status === 'done' && e.file.response?.url) {
              return e.file.response.url;
            }
            return watchMap[fieldName];
          }}
          rules={
            required
              ? [{ required: true, message: dict('PC.Common.Global.required') }]
              : []
          }
        >
          <Upload
            className={cx(
              isIdCard ? styles['id-card-upload'] : styles['license-upload'],
            )}
            maxCount={1}
            accept=".jpg,.jpeg,.png"
            showUploadList={false}
            beforeUpload={beforeUpload}
            customRequest={(opt) => handleUpload(opt, fieldName)}
            disabled={!isFormEditable}
          >
            {renderUploadBox(fieldName, watchMap[fieldName])}
          </Upload>
        </Form.Item>
      </Form.Item>
    );
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.paymentMerchantInfo')}
      rightSlot={
        <div className={cx(styles['actions-wrapper'])}>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchMerchantOnboarding}
          >
            {dict('PC.Common.Global.refresh')}
          </Button>
          <Button
            loading={saving}
            disabled={loading || !isFormEditable}
            onClick={() => handleSave(MerchantOnboardingStatusEnum.DRAFT)}
          >
            {dict(mk('saveDraft'))}
          </Button>
          <Button
            type="primary"
            loading={saving}
            disabled={loading || !isFormEditable || isFormDirty}
            onClick={() =>
              handleSave(MerchantOnboardingStatusEnum.UNDER_REVIEW)
            }
          >
            {dict(mk('submitReview'))}
          </Button>
        </div>
      }
    >
      <Spin spinning={loading}>
        <div className={cx(styles['page-content'])}>
          <Alert
            className={cx(styles['status-alert'])}
            type={statusInfo.color}
            icon={statusInfo.icon}
            showIcon
            message={statusInfo.text}
            description={
              status === MerchantOnboardingStatusEnum.REJECTED
                ? dict(mk('rejectedHint'))
                : undefined
            }
          />

          <Row gutter={24}>
            <Col span={16}>
              <Form
                form={form}
                layout="vertical"
                onValuesChange={() => setIsFormDirty(true)}
                disabled={!isFormEditable}
              >
                {/* 分组1: 商户信息 */}
                <Card
                  title={dict(mk('sectionMerchant'))}
                  className={cx(styles['form-card'])}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="merchantName"
                        label={dict(mk('merchantName'))}
                        rules={[{ required: true }]}
                      >
                        <Input
                          maxLength={100}
                          showCount
                          placeholder={dict(mk('placeholderMerchantName'))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="merchantShortName"
                        label={dict(mk('merchantShortName'))}
                        rules={[{ required: true }]}
                      >
                        <Input
                          maxLength={50}
                          showCount
                          placeholder={dict(mk('placeholderShortName'))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="creditCode"
                    label={dict(mk('creditCode'))}
                    rules={[
                      { required: true },
                      {
                        pattern: /^[A-Z0-9]{18}$/,
                        message: dict(mk('invalidCreditCode')),
                      },
                    ]}
                  >
                    <Input
                      maxLength={18}
                      showCount
                      placeholder={dict(mk('placeholderCreditCode'))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="registeredAddress"
                    label={dict(mk('registeredAddress'))}
                    rules={[{ required: true }]}
                  >
                    <Input
                      maxLength={200}
                      showCount
                      placeholder={dict(mk('placeholderAddress'))}
                    />
                  </Form.Item>
                  {renderUploadField(
                    'orgCertificateUrl',
                    dict(mk('licensePhoto')),
                  )}
                </Card>

                {/* 分组2: 法人信息 */}
                <Card
                  title={dict(mk('sectionLegalPerson'))}
                  className={cx(styles['form-card'])}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="legalPersonName"
                        label={dict(mk('legalPersonName'))}
                        rules={[{ required: true }]}
                      >
                        <Input
                          maxLength={50}
                          showCount
                          placeholder={dict(mk('placeholderName'))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="legalPersonIdNo"
                        label={dict(mk('legalPersonId'))}
                        rules={[
                          { required: true },
                          {
                            pattern:
                              /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
                            message: dict(mk('invalidIdCard')),
                          },
                        ]}
                      >
                        <Input
                          maxLength={18}
                          showCount
                          placeholder={dict(mk('placeholderIdCard'))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={12}>
                      {renderUploadField(
                        'legalPersonIdCardFrontUrl',
                        dict(mk('idCardFront')),
                      )}
                    </Col>
                    <Col span={12}>
                      {renderUploadField(
                        'legalPersonIdCardBackUrl',
                        dict(mk('idCardBack')),
                      )}
                    </Col>
                  </Row>
                </Card>

                {/* 分组3: 经办联系人 */}
                <Card
                  title={dict(mk('sectionContact'))}
                  className={cx(styles['form-card'])}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="contactName"
                        label={dict(mk('contactName'))}
                        rules={[{ required: true }]}
                      >
                        <Input
                          maxLength={50}
                          showCount
                          placeholder={dict(mk('placeholderContactName'))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="contactPhone"
                        label={dict(mk('contactPhone'))}
                        rules={[
                          { required: true },
                          {
                            pattern: /^1[3-9]\d{9}$/,
                            message: dict(mk('invalidPhone')),
                          },
                        ]}
                      >
                        <Input
                          maxLength={20}
                          showCount
                          placeholder={dict(mk('placeholderContactPhone'))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="contactEmail"
                    label={dict(mk('contactEmail'))}
                    rules={[
                      { required: true },
                      {
                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: dict(mk('invalidEmail')),
                      },
                    ]}
                  >
                    <Input
                      maxLength={100}
                      showCount
                      placeholder={dict(mk('placeholderContactEmail'))}
                    />
                  </Form.Item>
                </Card>

                {/* 分组4: 银行账户 */}
                <Card
                  title={dict(mk('sectionBankAccount'))}
                  className={cx(styles['form-card'])}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="bankAccountName"
                        label={dict(mk('bankAccountName'))}
                        rules={[{ required: true }]}
                      >
                        <Input
                          maxLength={100}
                          showCount
                          placeholder={dict(mk('placeholderBankAccountName'))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="bankName"
                        label={dict(mk('bankName'))}
                        rules={[{ required: true }]}
                      >
                        <Input
                          maxLength={100}
                          showCount
                          placeholder={dict(mk('placeholderBankName'))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="bankBranchName"
                    label={dict(mk('bankBranchName'))}
                    rules={[{ required: true }]}
                  >
                    <Input
                      maxLength={100}
                      showCount
                      placeholder={dict(mk('placeholderBranchName'))}
                    />
                  </Form.Item>
                  <BankAccountInput />
                  <Form.Item
                    name="bankReceiptRemark"
                    label={dict(mk('bankReceiptRemark'))}
                    rules={[{ required: true }]}
                  >
                    <Input
                      maxLength={100}
                      showCount
                      placeholder={dict(mk('placeholderBankReceiptRemark'))}
                    />
                  </Form.Item>
                </Card>

                {/* 分组5: 证件与场地影像 */}
                <Card
                  title={dict(mk('sectionPhotos'))}
                  className={cx(styles['form-card'])}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      {renderUploadField(
                        'photoFinanceRoomUrl',
                        dict(mk('photoFinanceRoomUrl')),
                      )}
                    </Col>
                    <Col span={12}>
                      {renderUploadField(
                        'photoGateUrl',
                        dict(mk('photoGateUrl')),
                      )}
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={12}>
                      {renderUploadField(
                        'photoLandmarkUrl',
                        dict(mk('photoLandmarkUrl')),
                      )}
                    </Col>
                    <Col span={12}>
                      {renderUploadField(
                        'bankAccountProofUrl',
                        dict(mk('bankAccountProofUrl')),
                      )}
                    </Col>
                  </Row>
                </Card>

                {/* 分组6: 备注 */}
                <Card
                  title={dict(mk('sectionRemark'))}
                  className={cx(styles['form-card'])}
                >
                  <Form.Item
                    name="remark"
                    label={dict(mk('remark'))}
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea
                      rows={4}
                      maxLength={500}
                      showCount
                      placeholder={dict(mk('placeholderRemark'))}
                    />
                  </Form.Item>
                </Card>
              </Form>
            </Col>

            <Col span={8}>
              <Card title={dict(mk('sectionAuditProgress'))}>
                {auditTimeline.length > 0 ? (
                  <Timeline
                    items={auditTimeline.map((item) => ({
                      children: (
                        <div className={cx(styles['audit-item'])}>
                          <div className={cx(styles['audit-action'])}>
                            {item.action}
                          </div>
                          {item.remark && (
                            <div className={cx(styles['audit-remark'])}>
                              {item.remark}
                            </div>
                          )}
                          {item.time && (
                            <div className={cx(styles['audit-time'])}>
                              {item.time}
                            </div>
                          )}
                        </div>
                      ),
                      color:
                        item.status === 'done'
                          ? 'green'
                          : item.status === 'rejected'
                          ? 'red'
                          : item.status === 'processing'
                          ? 'blue'
                          : 'gray',
                    }))}
                  />
                ) : (
                  <div className={cx(styles['no-data'])}>
                    {dict('PC.Components.ChatInputHomeMentionPopup.noData')}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </Spin>
    </WorkspaceLayout>
  );
};

export default MerchantInfo;
