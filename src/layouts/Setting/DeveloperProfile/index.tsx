import { dict } from '@/services/i18nRuntime';
import {
  CheckOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Upload, message } from 'antd';
import React from 'react';
import styles from './index.less';

const DeveloperProfile: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Success:', values);
    message.success(dict('PC.Pages.Setting.saveSuccess'));
  };

  return (
    <div className={styles.container}>
      {/* Fixed Title Bar */}
      <div className={styles.title}>
        {dict('PC.Pages.Setting.DeveloperProfile.title')}
      </div>

      {/* Scrollable Content */}
      <div className={styles.content}>
        {/* Header Section */}
        <div className={styles['header-card']}>
          <div className={styles['avatar-wrapper']}>
            <UserOutlined />
          </div>
          <div className={styles.info}>
            <div className={styles.name}>张明工作室</div>
            <div className={styles.status}>
              <CheckOutlined className={styles['icon-check']} />
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
          {/* Developer Info Section */}
          <div className={styles['section-card']}>
            <div className={styles['section-title']}>
              {dict('PC.Pages.Setting.DeveloperProfile.sectionProfile')}
            </div>
            <Form.Item
              label={dict('PC.Pages.Setting.DeveloperProfile.name')}
              name="name"
              rules={[
                {
                  required: true,
                  message: dict('PC.Pages.Setting.inputNickName'),
                },
              ]}
            >
              <Input placeholder={dict('PC.Pages.Setting.inputNickName')} />
            </Form.Item>

            <Form.Item
              label={dict('PC.Pages.Setting.DeveloperProfile.idCardFront')}
              required
            >
              <div className={styles['upload-group']}>
                <div className={styles['upload-item']}>
                  <Upload
                    name="idCardFront"
                    showUploadList={false}
                    className={styles['uploader']}
                  >
                    <div className={styles['upload-box']}>
                      <div className={styles['icon-wrapper']}>
                        <IdcardOutlined className={styles['upload-icon']} />
                      </div>
                      <div className={styles['upload-text']}>
                        {dict('PC.Pages.Setting.DeveloperProfile.idCardFront')}
                      </div>
                      <div className={styles['upload-hint']}>
                        {dict('PC.Pages.Setting.DeveloperProfile.uploadBtn')} ·{' '}
                        {dict('PC.Pages.Setting.DeveloperProfile.uploadHint')}
                      </div>
                    </div>
                  </Upload>
                </div>
                <div className={styles['upload-item']}>
                  <Upload name="idCardBack" showUploadList={false}>
                    <div className={styles['upload-box']}>
                      <div className={styles['icon-wrapper']}>
                        <IdcardOutlined className={styles['upload-icon']} />
                      </div>
                      <div className={styles['upload-text']}>
                        {dict('PC.Pages.Setting.DeveloperProfile.idCardBack')}
                      </div>
                      <div className={styles['upload-hint']}>
                        {dict('PC.Pages.Setting.DeveloperProfile.uploadBtn')} ·{' '}
                        {dict('PC.Pages.Setting.DeveloperProfile.uploadHint')}
                      </div>
                    </div>
                  </Upload>
                </div>
              </div>
              <div className={styles['error-hint']}>
                <InfoCircleOutlined />
                {dict('PC.Pages.Setting.DeveloperProfile.uploadError')}
              </div>
            </Form.Item>
          </div>

          {/* Bank Info Section */}
          <div className={styles['section-card']}>
            <div className={styles['section-title']}>
              {dict('PC.Pages.Setting.DeveloperProfile.sectionBank')}
            </div>

            <Form.Item
              label={dict('PC.Pages.Setting.DeveloperProfile.bankName')}
              name="openingBank"
              rules={[
                {
                  required: true,
                  message: dict('PC.Pages.Setting.DeveloperProfile.bankName'),
                },
              ]}
            >
              <Input
                placeholder={dict('PC.Pages.Setting.DeveloperProfile.bankName')}
              />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label={dict('PC.Pages.Setting.DeveloperProfile.cardNumber')}
                name="cardNumber"
                style={{ flex: 1 }}
                rules={[
                  {
                    required: true,
                    message: dict(
                      'PC.Pages.Setting.DeveloperProfile.cardNumber',
                    ),
                  },
                ]}
                extra={
                  <div className={styles['field-desc']}>
                    {dict('PC.Pages.Setting.DeveloperProfile.cardNumberDesc')}
                  </div>
                }
              >
                <Input
                  placeholder={dict(
                    'PC.Pages.Setting.DeveloperProfile.cardNumber',
                  )}
                />
              </Form.Item>

              <Form.Item
                label={dict('PC.Pages.Setting.DeveloperProfile.cardholderName')}
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
                />
              </Form.Item>
            </div>

            <Form.Item
              label={dict('PC.Pages.Setting.DeveloperProfile.phone')}
              name="phoneNumber"
              rules={[
                {
                  required: true,
                  message: dict('PC.Pages.Setting.DeveloperProfile.phone'),
                },
              ]}
              extra={
                <div className={styles['field-desc']}>
                  {dict('PC.Pages.Setting.DeveloperProfile.phoneDesc')}
                </div>
              }
            >
              <Input
                placeholder={dict('PC.Pages.Setting.DeveloperProfile.phone')}
              />
            </Form.Item>
          </div>

          <div className={styles.footer}>
            <Button type="primary" htmlType="submit">
              {dict('PC.Pages.Setting.DeveloperProfile.saveBtn')}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default DeveloperProfile;
