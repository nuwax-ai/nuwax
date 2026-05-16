import {
  apiGetDeveloperAccountCurrent,
  apiSaveDeveloperAccount,
} from '@/services/developerAccount';
import { dict } from '@/services/i18nRuntime';
import { apiSystemUploadFile } from '@/services/systemManage';
import type { DeveloperAccount } from '@/types/interfaces/developerAccount';
import {
  CheckOutlined,
  IdcardOutlined,
  LoadingOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Form, Input, Modal, Spin, Upload, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

type UploadRequestOption = Parameters<
  NonNullable<UploadProps['customRequest']>
>[0];

/**
 * 开发者资料设置组件
 * 用于展示和修改开发者的基本信息、身份验证以及银行账户信息
 */
const DeveloperProfile: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [upLoadingFront, setUpLoadingFront] = useState<boolean>(false);
  const [upLoadingBack, setUpLoadingBack] = useState<boolean>(false);
  const [accountId, setAccountId] = useState<number | undefined>(undefined);

  // 监听表单字段以触发重绘
  const realName = Form.useWatch('realName', form);
  const idCardFrontPhotoUrl = Form.useWatch('idCardFrontPhotoUrl', form);
  const idCardBackPhotoUrl = Form.useWatch('idCardBackPhotoUrl', form);

  // 银行卡号 4 位分组格式化函数
  const formatBankCardNo = (val?: string) => {
    if (!val) return '';
    return val
      .replace(/\s/g, '')
      .replace(/\D/g, '')
      .replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // 初始化获取开发者账户信息
  const fetchAccountInfo = async () => {
    setLoading(true);
    try {
      const res = await apiGetDeveloperAccountCurrent();
      if (res.success && res.data) {
        const data = res.data;
        setAccountId(data.id);
        // 将后端字段映射到表单字段
        form.setFieldsValue({
          realName: data.realName,
          idCardNo: data.idCardNo,
          phone: data.phone,
          email: data.email,
          bankName: data.bankName,
          branchName: data.branchName,
          bankCardNo: formatBankCardNo(data.bankCardNo),
          idCardFrontPhotoUrl: data.idCardFrontPhotoUrl,
          idCardBackPhotoUrl: data.idCardBackPhotoUrl,
        });
      }
    } catch (error) {
      console.error('Fetch developer account error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  // 自动同步真实姓名到持卡人姓名
  useEffect(() => {
    if (realName) {
      form.setFieldValue('cardholderName', realName);
    }
  }, [realName, form]);

  // 文件上传前校验
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

  // 自定义上传逻辑
  const handleUpload = async (
    options: UploadRequestOption,
    type: 'front' | 'back',
  ) => {
    const { file, onSuccess, onError } = options;
    const isFront = type === 'front';
    if (isFront) {
      setUpLoadingFront(true);
    } else {
      setUpLoadingBack(true);
    }

    try {
      const res = await apiSystemUploadFile(file as File);
      if (res.success && res.data?.url) {
        const url = res.data.url;
        form.setFieldValue(
          isFront ? 'idCardFrontPhotoUrl' : 'idCardBackPhotoUrl',
          url,
        );
        onSuccess?.(res.data);
        message.success(dict('PC.Constants.AppDev.successFileUploaded'));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      onError?.(error as any);
      message.error(
        dict(
          'PC.Components.ChatInputHome.uploadFailedWithName',
          (file as File).name,
        ),
      );
    } finally {
      if (isFront) {
        setUpLoadingFront(false);
      } else {
        setUpLoadingBack(false);
      }
    }
  };

  // 执行保存操作
  const handleSave = async (values: any) => {
    try {
      const payload: DeveloperAccount = {
        ...values,
        id: accountId,
        // 处理卡号，去掉空格
        bankCardNo: values.bankCardNo?.replace(/\s/g, ''),
      };
      const res = await apiSaveDeveloperAccount(payload);
      if (res.success) {
        message.success(dict('PC.Pages.Setting.DeveloperProfile.saveSuccess'));
        fetchAccountInfo(); // 刷新数据
      }
    } catch (error) {
      console.error('Save developer account error:', error);
    }
  };

  // 表单提交前的确认弹窗
  const onFinish = (values: any) => {
    Modal.confirm({
      title: dict('PC.Pages.Setting.DeveloperProfile.saveConfirm'),
      centered: true,
      onOk: () => handleSave(values),
    });
  };

  // 渲染上传区域内容
  const renderUploadBox = (type: 'front' | 'back', imageUrl?: string) => {
    const isFront = type === 'front';
    const isUploading = isFront ? upLoadingFront : upLoadingBack;

    if (imageUrl) {
      return (
        <div className={cx(styles['upload-box'], styles.hasImage)}>
          <img
            src={imageUrl}
            alt="idCard"
            className={cx(styles['preview-image'])}
          />
          <div className={cx(styles['image-mask'])}>
            {isUploading ? <LoadingOutlined /> : <PlusOutlined />}
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
          ) : (
            <IdcardOutlined className={cx(styles['upload-icon'])} />
          )}
        </div>
        <div className={cx(styles['upload-text'])}>
          {isFront
            ? dict('PC.Pages.Setting.DeveloperProfile.idCardFront')
            : dict('PC.Pages.Setting.DeveloperProfile.idCardBack')}
        </div>
        <div className={cx(styles['upload-hint'])}>
          {dict('PC.Pages.Setting.DeveloperProfile.uploadBtn')} ·{' '}
          {dict('PC.Pages.Setting.DeveloperProfile.uploadHint')}
        </div>
      </div>
    );
  };

  return (
    <div className={cx(styles.container)}>
      {/* 固定标题栏 */}
      <div className={cx(styles.title)}>
        {dict('PC.Pages.Setting.DeveloperProfile.title')}
      </div>

      {/* 可滚动内容区域 */}
      <Spin
        spinning={loading}
        tip={dict('PC.Components.ChatInputHomeMentionPopup.loading')}
        wrapperClassName={cx(styles.spinWrapper)}
      >
        <div className={cx(styles.content)}>
          {/* 顶部头部卡片：展示头像、名称和认证状态 */}
          <div className={cx(styles['header-card'])}>
            <div className={cx(styles['avatar-wrapper'])}>
              <UserOutlined />
            </div>
            <div className={cx(styles.info)}>
              <div className={cx(styles.name)}>
                {realName || dict('PC.Components.UserMenu.defaultUserName')}
              </div>
              <div className={cx(styles.status)}>
                <CheckOutlined className={cx(styles['icon-check'])} />
                {dict('PC.Pages.Setting.DeveloperProfile.verified')}
              </div>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            requiredMark={true}
            onFinish={onFinish}
          >
            {/* 开发者信息区块：基础资料和身份证明上传 */}
            <div className={cx(styles['section-card'])}>
              <div className={cx(styles['section-title'])}>
                {dict('PC.Pages.Setting.DeveloperProfile.sectionProfile')}
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  label={dict('PC.Pages.Setting.DeveloperProfile.name')}
                  name="realName"
                  style={{ flex: 1 }}
                  rules={[
                    {
                      required: true,
                      message: dict('PC.Pages.Setting.inputNickName'),
                    },
                  ]}
                >
                  <Input
                    placeholder={dict('PC.Pages.Setting.inputNickName')}
                    maxLength={50}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  label={dict('PC.Pages.Setting.DeveloperProfile.idCardNo')}
                  name="idCardNo"
                  style={{ flex: 1 }}
                  rules={[
                    {
                      required: true,
                      message: dict(
                        'PC.Pages.Setting.DeveloperProfile.idCardNoRequired',
                      ),
                    },
                    {
                      pattern:
                        /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
                      message: dict(
                        'PC.Pages.Setting.DeveloperProfile.idCardNoInvalid',
                      ),
                    },
                  ]}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.Setting.DeveloperProfile.idCardNo',
                    )}
                    maxLength={18}
                    showCount
                  />
                </Form.Item>
              </div>

              {/* 身份证上传：包含正反面 */}
              <div className={cx(styles['upload-group'])}>
                {/* 身份证正面 */}
                <div className={cx(styles['upload-item'])}>
                  <Form.Item
                    name="idCardFrontPhotoUrl"
                    label={dict(
                      'PC.Pages.Setting.DeveloperProfile.idCardFront',
                    )}
                    valuePropName="data-url"
                    rules={[
                      {
                        required: true,
                        message: dict(
                          'PC.Pages.Setting.DeveloperProfile.uploadError',
                        ),
                      },
                    ]}
                    getValueFromEvent={(e) => {
                      if (typeof e === 'string') return e;
                      if (e?.file?.status === 'done' && e.file.response?.url) {
                        return e.file.response.url;
                      }
                      return idCardFrontPhotoUrl;
                    }}
                  >
                    <Upload
                      accept=".jpg,.jpeg,.png"
                      showUploadList={false}
                      beforeUpload={beforeUpload}
                      customRequest={(options) =>
                        handleUpload(options, 'front')
                      }
                    >
                      {renderUploadBox('front', idCardFrontPhotoUrl)}
                    </Upload>
                  </Form.Item>
                </div>
                {/* 身份证反面 */}
                <div className={cx(styles['upload-item'])}>
                  <Form.Item
                    name="idCardBackPhotoUrl"
                    label={dict('PC.Pages.Setting.DeveloperProfile.idCardBack')}
                    valuePropName="data-url"
                    rules={[
                      {
                        required: true,
                        message: dict(
                          'PC.Pages.Setting.DeveloperProfile.uploadError',
                        ),
                      },
                    ]}
                    getValueFromEvent={(e) => {
                      if (typeof e === 'string') return e;
                      if (e?.file?.status === 'done' && e.file.response?.url) {
                        return e.file.response.url;
                      }
                      return idCardBackPhotoUrl;
                    }}
                  >
                    <Upload
                      accept=".jpg,.jpeg,.png"
                      showUploadList={false}
                      beforeUpload={beforeUpload}
                      customRequest={(options) => handleUpload(options, 'back')}
                    >
                      {renderUploadBox('back', idCardBackPhotoUrl)}
                    </Upload>
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 银行信息区块：用于收益结算 */}
            <div className={cx(styles['section-card'])}>
              <div className={cx(styles['section-title'])}>
                {dict('PC.Pages.Setting.DeveloperProfile.sectionBank')}
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                {/* 开户银行 */}
                <Form.Item
                  label={dict('PC.Pages.Setting.DeveloperProfile.bankName')}
                  name="bankName"
                  style={{ flex: 1 }}
                  rules={[
                    {
                      required: true,
                      message: dict(
                        'PC.Pages.Setting.DeveloperProfile.bankName',
                      ),
                    },
                  ]}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.Setting.DeveloperProfile.bankName',
                    )}
                    maxLength={50}
                    showCount
                  />
                </Form.Item>

                {/* 支行名称 */}
                <Form.Item
                  label={dict('PC.Pages.Setting.DeveloperProfile.branchName')}
                  name="branchName"
                  style={{ flex: 1 }}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.Setting.DeveloperProfile.branchName',
                    )}
                    maxLength={50}
                    showCount
                  />
                </Form.Item>
              </div>

              {/* 卡号与持卡人姓名：左右布局 */}
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  label={dict('PC.Pages.Setting.DeveloperProfile.cardNumber')}
                  name="bankCardNo"
                  style={{ flex: 1 }}
                  getValueFromEvent={(e) => formatBankCardNo(e.target.value)}
                  rules={[
                    {
                      required: true,
                      message: dict(
                        'PC.Pages.Setting.DeveloperProfile.cardNumber',
                      ),
                    },
                    {
                      validator: (_, value) => {
                        const actualVal = value?.replace(/\s/g, '');
                        if (actualVal && !/^\d{16,19}$/.test(actualVal)) {
                          return Promise.reject(
                            dict(
                              'PC.Pages.Setting.DeveloperProfile.bankCardNoInvalid',
                            ),
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                  extra={
                    <div className={cx(styles['field-desc'])}>
                      {dict('PC.Pages.Setting.DeveloperProfile.cardNumberDesc')}
                    </div>
                  }
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.Setting.DeveloperProfile.cardNumber',
                    )}
                    maxLength={23} // 19位卡号 + 4个空格
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  label={dict(
                    'PC.Pages.Setting.DeveloperProfile.cardholderName',
                  )}
                  name="cardholderName"
                  style={{ flex: 1 }}
                  rules={[
                    {
                      required: true,
                      message: dict(
                        'PC.Pages.Setting.DeveloperProfile.cardholderName',
                      ),
                    },
                  ]}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.Setting.DeveloperProfile.cardholderName',
                    )}
                    maxLength={50}
                    disabled
                    showCount
                  />
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                {/* 预留手机号 */}
                <Form.Item
                  label={dict('PC.Pages.Setting.DeveloperProfile.phone')}
                  name="phone"
                  style={{ flex: 1 }}
                  rules={[
                    {
                      required: true,
                      message: dict('PC.Pages.Setting.DeveloperProfile.phone'),
                    },
                    {
                      pattern: /^1[3-9]\d{9}$/,
                      message: dict(
                        'PC.Pages.Setting.DeveloperProfile.phoneInvalid',
                      ),
                    },
                  ]}
                  extra={
                    <div className={cx(styles['field-desc'])}>
                      {dict('PC.Pages.Setting.DeveloperProfile.phoneDesc')}
                    </div>
                  }
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.Setting.DeveloperProfile.phone',
                    )}
                    maxLength={11}
                    showCount
                  />
                </Form.Item>

                {/* 邮箱 */}
                <Form.Item
                  label={dict('PC.Pages.Setting.DeveloperProfile.email')}
                  name="email"
                  style={{ flex: 1 }}
                  rules={[
                    {
                      type: 'email',
                      message: dict('PC.Common.Global.error'), // 这里通常有通用的邮箱验证错误
                    },
                  ]}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.Setting.DeveloperProfile.email',
                    )}
                    maxLength={100}
                    showCount
                  />
                </Form.Item>
              </div>
            </div>

            {/* 底部操作栏：提交保存 */}
            <div className={cx(styles.footer)}>
              <Button type="primary" htmlType="submit">
                {dict('PC.Pages.Setting.DeveloperProfile.saveBtn')}
              </Button>
            </div>
          </Form>
        </div>
      </Spin>
    </div>
  );
};

export default DeveloperProfile;
