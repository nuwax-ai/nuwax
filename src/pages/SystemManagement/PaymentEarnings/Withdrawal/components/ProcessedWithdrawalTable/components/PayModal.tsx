import { dict } from '@/services/i18nRuntime';
import { apiSystemUploadFile } from '@/services/systemManage';
import type { BillWithdrawRecordInfo } from '@/types/interfaces/subscription';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { ModalForm, ProFormTextArea } from '@ant-design/pro-components';
import type { UploadFile, UploadProps } from 'antd';
import { Form, Upload, message } from 'antd';
import React, { useState } from 'react';

interface PayModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (values: { remark: string; images: string[] }) => Promise<void>;
  record: BillWithdrawRecordInfo | null;
}

const PayModal: React.FC<PayModalProps> = ({
  open,
  onCancel,
  onConfirm,
  record,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleBeforeUpload = (file: File) => {
    const isImage = ['image/jpeg', 'image/png', 'image/jpg'].includes(
      file.type,
    );
    if (!isImage) {
      message.error(
        dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payUploadTypeError',
        ),
      );
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error(
        dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payUploadSizeError',
        ),
      );
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const res = await apiSystemUploadFile(file as File);
      if (res.success && res.data?.url) {
        onSuccess?.(res.data);
        setFileList((prev) =>
          prev.map((item) =>
            item.uid === file.uid
              ? {
                  ...item,
                  status: 'done',
                  url: res.data.url,
                  thumbUrl: res.data.url,
                }
              : item,
          ),
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      onError?.(error as any);
      message.error(
        dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payUploadFailed',
        ),
      );
      setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange: UploadProps['onChange'] = ({
    fileList: newFileList,
  }) => {
    const list = newFileList.map((file) => {
      // 提取服务端成功返回的完整网络地址
      if (file.response && file.response.url) {
        file.url = file.response.url;
        file.thumbUrl = file.response.url;
      }
      // 本地即时预览兜底
      if (!file.url && file.originFileObj) {
        const localUrl = URL.createObjectURL(file.originFileObj);
        file.url = localUrl;
        file.thumbUrl = localUrl;
      }
      return file;
    });
    setFileList(list);
  };

  const handleConfirmPay = async (values: any) => {
    // 提取所有上传成功图片的 url
    const imageUrls = fileList
      .filter((file) => file.status === 'done' && file.url)
      .map((file) => file.url as string);

    await onConfirm({
      remark: values.remark,
      images: imageUrls,
    });
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>
        {dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payUploadBtn',
        )}
      </div>
    </div>
  );

  return (
    <ModalForm
      form={form}
      title={dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payModalTitle',
      )}
      open={open}
      modalProps={{
        onCancel: () => {
          form.resetFields();
          setFileList([]);
          onCancel();
        },
        destroyOnHidden: true,
        okButtonProps: { loading: uploading },
      }}
      width={480}
      submitter={{
        searchConfig: {
          submitText: dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.pay',
          ),
        },
      }}
      onFinish={handleConfirmPay}
    >
      <div style={{ paddingTop: 16 }} />

      {/* 提现信息卡片，展示提现人和金额，增强用户视觉体验 */}
      <div
        style={{
          background: '#f5f7fa',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ color: '#8c8c8c' }}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colDeveloper',
            )}
          </span>
          <span style={{ fontWeight: 500, color: '#262626' }}>
            {record?.userName || '-'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8c8c8c' }}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colAmount',
            )}
          </span>
          <span style={{ fontWeight: 600, color: '#ff4d4f', fontSize: 16 }}>
            ¥{(record?.amount ?? 0).toLocaleString()}
          </span>
        </div>
      </div>

      <ProFormTextArea
        name="remark"
        label={dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payRemarkLabel',
        )}
        placeholder={dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payRemarkPlaceholder',
        )}
        rules={[
          {
            required: true,
            message: dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payRemarkPlaceholder',
            ),
          },
        ]}
        fieldProps={{
          rows: 4,
          maxLength: 1000,
          showCount: true,
        }}
      />

      <Form.Item
        label={dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payImagesLabel',
        )}
      >
        <Upload
          listType="picture-card"
          fileList={fileList}
          beforeUpload={handleBeforeUpload}
          customRequest={handleUpload}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png"
          maxCount={3}
        >
          {fileList.length >= 3 ? null : uploadButton}
        </Upload>
      </Form.Item>
    </ModalForm>
  );
};

export default PayModal;
