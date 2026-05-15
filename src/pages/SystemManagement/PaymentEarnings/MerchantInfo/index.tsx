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

const MerchantInfo: React.FC = () => {
  const [form] = Form.useForm();
  const location = useLocation();
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
  const legalPersonIdCardFrontUrl = Form.useWatch(
    'legalPersonIdCardFrontUrl',
    form,
  );
  const legalPersonIdCardBackUrl = Form.useWatch(
    'legalPersonIdCardBackUrl',
    form,
  );
  const orgCertificateUrl = Form.useWatch('orgCertificateUrl', form);

  const fetchMerchantOnboarding = async () => {
    // if (!tenantId) return;
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
          licenseExpiry: data.licenseExpiry
            ? dayjs(data.licenseExpiry)
            : undefined,
        });
        // 审核进度逻辑 (固定展示全流程)
        const timeline: any[] = [];
        const currentStatus = data.status;

        // 1. 创建 (草稿) - 始终为完成状态
        timeline.push({
          action: dict(
            'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.statusDraft',
          ),
          time: data.created
            ? dayjs(data.created).format('YYYY-MM-DD HH:mm:ss')
            : '',
          status: 'done',
        });

        // 2. 审核中 - 状态流转高亮
        timeline.push({
          action: dict(
            'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.statusUnderReview',
          ),
          time: '', // 审核中始终不显示时间
          status:
            currentStatus === MerchantOnboardingStatusEnum.UNDER_REVIEW
              ? 'processing'
              : currentStatus === MerchantOnboardingStatusEnum.APPROVED ||
                currentStatus === MerchantOnboardingStatusEnum.REJECTED
              ? 'done'
              : 'pending',
        });

        // 3. 审核结果 (已通过 / 已拒绝)
        if (currentStatus === MerchantOnboardingStatusEnum.REJECTED) {
          timeline.push({
            action: dict(
              'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.statusRejected',
            ),
            time: data.auditedAt
              ? dayjs(data.auditedAt).format('YYYY-MM-DD HH:mm:ss')
              : '',
            status: 'rejected',
            remark: data.auditRemark,
          });
        } else {
          // 默认为“已通过”占位，或如果是已通过状态则显示真实数据
          timeline.push({
            action: dict(
              'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.statusApproved',
            ),
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
      } else {
        setOnboardingId(undefined);
        setStatus(MerchantOnboardingStatusEnum.DRAFT);
        form.resetFields();
        setAuditTimeline([]);
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
            ? 'legalPersonIdCardFrontUrl'
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
        licenseExpiry: values.licenseExpiry
          ? dayjs(values.licenseExpiry).format('YYYY-MM-DD')
          : undefined,
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
        <div
          className={cx(styles['upload-box'], styles[type], styles.hasImage)}
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
      <div className={cx(styles['upload-box'], styles[type])}>
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
            ? dict(
                'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.idCardFront',
              )
            : type === 'back'
            ? dict(
                'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.idCardBack',
              )
            : dict(
                'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.licenseLabel',
              )}
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
            onClick={() => handleSave(MerchantOnboardingStatusEnum.DRAFT)}
          >
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.saveDraft',
            )}
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={() =>
              handleSave(MerchantOnboardingStatusEnum.UNDER_REVIEW)
            }
          >
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.submitReview',
            )}
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
                ? dict(
                    'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.rejectedHint',
                  )
                : undefined
            }
          />

          <Row gutter={24}>
            <Col span={12}>
              <Form form={form} layout="vertical">
                <Card
                  title={dict(
                    'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.sectionLegalPerson',
                  )}
                  className={cx(styles['form-card'])}
                >
                  <Form.Item
                    name="legalPersonName"
                    label={dict(
                      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.legalPersonName',
                    )}
                    rules={[{ required: true }]}
                  >
                    <Input
                      maxLength={50}
                      showCount
                      placeholder={dict(
                        'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.placeholderName',
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    name="legalPersonIdNo"
                    label={dict(
                      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.legalPersonId',
                    )}
                    rules={[
                      { required: true },
                      {
                        pattern:
                          /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
                        message: dict(
                          'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.invalidIdCard',
                        ),
                      },
                    ]}
                  >
                    <Input
                      maxLength={18}
                      showCount
                      placeholder={dict(
                        'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.placeholderIdCard',
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    label={dict(
                      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.idCardPhotos',
                    )}
                    required
                    className={cx(styles['form-item-no-margin'])}
                  >
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item
                          name="legalPersonIdCardFrontUrl"
                          valuePropName="data-url"
                          getValueFromEvent={(e) => {
                            if (typeof e === 'string') return e;
                            if (
                              e?.file?.status === 'done' &&
                              e.file.response?.url
                            ) {
                              return e.file.response.url;
                            }
                            return legalPersonIdCardFrontUrl;
                          }}
                          rules={[
                            {
                              required: true,
                              message: dict('PC.Common.Global.required'),
                            },
                          ]}
                        >
                          <Upload
                            className={cx(styles['id-card-upload'])}
                            maxCount={1}
                            accept=".jpg,.jpeg,.png"
                            showUploadList={false}
                            beforeUpload={beforeUpload}
                            customRequest={(opt) => handleUpload(opt, 'front')}
                          >
                            {renderUploadBox(
                              'front',
                              legalPersonIdCardFrontUrl,
                            )}
                          </Upload>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="legalPersonIdCardBackUrl"
                          valuePropName="data-url"
                          getValueFromEvent={(e) => {
                            if (typeof e === 'string') return e;
                            if (
                              e?.file?.status === 'done' &&
                              e.file.response?.url
                            ) {
                              return e.file.response.url;
                            }
                            return legalPersonIdCardBackUrl;
                          }}
                          rules={[
                            {
                              required: true,
                              message: dict('PC.Common.Global.required'),
                            },
                          ]}
                        >
                          <Upload
                            className={cx(styles['id-card-upload'])}
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
                    'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.sectionBusinessLicense',
                  )}
                  className={cx(styles['form-card'])}
                >
                  <Form.Item
                    name="merchantName"
                    label={dict(
                      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.companyName',
                    )}
                    rules={[{ required: true }]}
                  >
                    <Input
                      maxLength={100}
                      showCount
                      placeholder={dict(
                        'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.placeholderCompanyName',
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    name="creditCode"
                    label={dict(
                      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.creditCode',
                    )}
                    rules={[
                      { required: true },
                      {
                        pattern: /^[A-Z0-9]{18}$/,
                        message: dict(
                          'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.invalidCreditCode',
                        ),
                      },
                    ]}
                  >
                    <Input
                      maxLength={18}
                      showCount
                      placeholder={dict(
                        'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.placeholderCreditCode',
                      )}
                    />
                  </Form.Item>
                  {/* <Form.Item
                    name="licenseExpiry"
                    label={dict(
                      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.licenseExpiry',
                    )}
                    rules={[{ required: true }]}
                  >
                    <DatePicker
                      className={cx(styles['full-width'])}
                      placeholder={dict(
                        'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.placeholderExpiry',
                      )}
                    />
                  </Form.Item> */}
                  <Form.Item
                    label={dict(
                      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.licensePhoto',
                    )}
                    required
                    className={cx(styles['form-item-no-margin'])}
                  >
                    <Form.Item
                      name="orgCertificateUrl"
                      valuePropName="data-url"
                      rules={[
                        {
                          required: true,
                          message: dict('PC.Common.Global.required'),
                        },
                      ]}
                      getValueFromEvent={(e) => {
                        if (typeof e === 'string') return e;
                        if (
                          e?.file?.status === 'done' &&
                          e.file.response?.url
                        ) {
                          return e.file.response.url;
                        }
                        return orgCertificateUrl;
                      }}
                    >
                      <Upload
                        className={cx(styles['license-upload'])}
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
                  title={dict(
                    'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.sectionBankAccount',
                  )}
                  className={cx(styles['form-card'])}
                >
                  <Form.Item
                    name="bankName"
                    label={dict(
                      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.bankName',
                    )}
                    rules={[{ required: true }]}
                  >
                    <Input
                      maxLength={100}
                      showCount
                      placeholder={dict(
                        'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.placeholderBankName',
                      )}
                    />
                  </Form.Item>
                  <BankAccountInput />
                  <Form.Item
                    name="bankBranchName"
                    label={dict(
                      'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.bankBranchCode',
                    )}
                    rules={[{ required: true }]}
                  >
                    <Input
                      maxLength={100}
                      showCount
                      placeholder={dict(
                        'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.placeholderBranchName',
                      )}
                    />
                  </Form.Item>
                </Card>
              </Form>
            </Col>

            <Col span={12}>
              <Card
                title={dict(
                  'PC.Pages.SystemManagement.PaymentEarnings.MerchantInfo.sectionAuditProgress',
                )}
              >
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
