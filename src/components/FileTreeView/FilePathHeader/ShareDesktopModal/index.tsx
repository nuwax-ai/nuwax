import { XModalForm } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentConversationShare } from '@/services/agentConfig';
import { AgentConversationShareParams } from '@/types/interfaces/agent';
import { copyTextToClipboard } from '@/utils/clipboard';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { Alert, message } from 'antd';
import React, { useRef } from 'react';

import { dict } from '@/services/i18nRuntime';

/**
 * 时间选项配置
 * value: 秒数（0表示永久）
 * label: 显示文本
 */
const TIME_OPTIONS = [
  { label: dict('PC.Components.ShareDesktopModal.permanent'), value: 0 },
  { label: dict('PC.Components.ShareDesktopModal.minute1'), value: 60 },
  {
    label: dict('PC.Components.ShareDesktopModal.minute5'),
    value: 5 * 60,
  },
  {
    label: dict('PC.Components.ShareDesktopModal.minute10'),
    value: 10 * 60,
  },
  {
    label: dict('PC.Components.ShareDesktopModal.minute20'),
    value: 20 * 60,
  },
  {
    label: dict('PC.Components.ShareDesktopModal.minute30'),
    value: 30 * 60,
  },
  {
    label: dict('PC.Components.ShareDesktopModal.minute40'),
    value: 40 * 60,
  },
  {
    label: dict('PC.Components.ShareDesktopModal.minute50'),
    value: 50 * 60,
  },
  { label: dict('PC.Components.ShareDesktopModal.hour1'), value: 60 * 60 },
  {
    label: dict('PC.Components.ShareDesktopModal.hour2'),
    value: 2 * 60 * 60,
  },
  {
    label: dict('PC.Components.ShareDesktopModal.hour4'),
    value: 4 * 60 * 60,
  },
  {
    label: dict('PC.Components.ShareDesktopModal.hour8'),
    value: 8 * 60 * 60,
  },
  {
    label: dict('PC.Components.ShareDesktopModal.hour16'),
    value: 16 * 60 * 60,
  },
  {
    label: dict('PC.Components.ShareDesktopModal.day1'),
    value: 24 * 60 * 60,
  },
];

/**
 * 表单数据类型
 */
interface ShareFormValues {
  expireSeconds: number;
  allowDownload?: boolean;
}

interface ShareDesktopModalProps {
  /** 文件代理URL */
  fileProxyUrl: string | null;
  /** 分享类型 */
  shareType: 'CONVERSATION' | 'DESKTOP';
  /** 是否显示弹窗 */
  visible: boolean;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 会话ID */
  conversationId: string;
}

/**
 * 远程桌面分享弹窗组件
 * 使用 ProForm 管理表单状态和提交
 *
 * @param visible - 是否显示弹窗
 * @param onClose - 关闭弹窗回调
 * @param conversationId - 会话ID
 */
const ShareDesktopModal: React.FC<ShareDesktopModalProps> = ({
  fileProxyUrl,
  shareType,
  visible,
  onClose,
  conversationId,
}) => {
  // 表单实例引用
  const formRef = useRef<ProFormInstance>();

  /**
   * 根据分享类型获取时间选项
   * 远程桌面分享不包含"永久"选项
   */
  const getTimeOptions = () => {
    if (shareType === 'DESKTOP') {
      // 远程桌面分享：过滤掉"永久"选项（value为0）
      return TIME_OPTIONS.filter((opt) => opt.value !== 0);
    }
    // 文件分享：包含所有选项
    return TIME_OPTIONS;
  };

  /**
   * 获取默认有效时间
   * 远程桌面分享默认1小时，文件分享默认永久
   */
  const getDefaultExpireSeconds = () => {
    if (shareType === 'DESKTOP') {
      return 60 * 60; // 1小时
    }
    return 0; // 永久
  };

  /**
   * 格式化时间显示
   * @param seconds 秒数
   * @returns 格式化后的时间文本
   */
  const formatTimeDisplay = (seconds: number): string => {
    const option = TIME_OPTIONS.find((opt) => opt.value === seconds);
    return (
      option?.label ||
      dict('PC.Components.ShareDesktopModal.secondsUnit', `${seconds}`)
    );
  };

  const generateDesktopShareUrl = async (values: ShareFormValues) => {
    if (!conversationId) {
      message.error(
        dict('PC.Components.ShareDesktopModal.conversationIdMissing'),
      );
      return false;
    }

    try {
      // 构造远程桌面URL 仅观看
      const desktopUrl = `/computer/desktop/${conversationId}/vnc.html?resize=scale&autoconnect=true&view_only=true`;

      // 调用分享接口
      const data: AgentConversationShareParams = {
        conversationId: Number(conversationId),
        type: 'DESKTOP',
        content: desktopUrl,
        expireSeconds: values.expireSeconds ? values.expireSeconds : null, // 0转换为null表示永久
      };

      const { data: shareData, code } = await apiAgentConversationShare(data);

      if (code === SUCCESS_CODE) {
        const baseUrl = window?.location?.origin || '';
        const path = '/static/desktop-preview.html';

        const query = new URLSearchParams();
        query.set('sk', shareData?.shareKey);

        const shareUrl = baseUrl + path + '?' + query.toString();

        // 复制到剪切板
        copyTextToClipboard(shareUrl);
        message.success(
          dict('PC.Components.ShareDesktopModal.desktopShareSuccess'),
        );

        return true; // 返回 true 关闭弹窗
      } else {
        message.error(dict('PC.Components.ShareDesktopModal.shareFailedRetry'));
        return false; // 返回 false 保持弹窗打开
      }
    } catch (error) {
      console.error('Failed to share remote desktop:', error);
      message.error(dict('PC.Components.ShareDesktopModal.shareFailedRetry'));
      return false;
    }
  };
  const generateFileShareUrl = async (values: ShareFormValues) => {
    if (!conversationId) {
      message.error(
        dict('PC.Components.ShareDesktopModal.conversationIdMissing'),
      );
      return false;
    }

    try {
      const data: AgentConversationShareParams = {
        conversationId,
        type: 'CONVERSATION',
        content: fileProxyUrl || '',
        expireSeconds: values.expireSeconds ? values.expireSeconds : null, // 0转换为null表示永久
      };

      const { data: shareData, code } = await apiAgentConversationShare(data);
      if (code === SUCCESS_CODE) {
        const baseUrl = window?.location?.origin || '';
        const path = '/static/file-preview.html';

        const query = new URLSearchParams();
        query.set('sk', shareData?.shareKey);
        // 如果允许下载，拼接 dl=1
        if (values.allowDownload) {
          query.set('dl', '1');
        }
        const previewUrl = baseUrl + path + '?' + query.toString();

        // 复制到剪切板
        copyTextToClipboard(previewUrl);
        message.success(
          dict('PC.Components.ShareDesktopModal.fileShareSuccess'),
        );
        return true;
      } else {
        message.error(dict('PC.Components.ShareDesktopModal.shareFailedRetry'));
        return false;
      }
    } catch (error) {
      console.error('Failed to share file:', error);
      message.error(dict('PC.Components.ShareDesktopModal.shareFailedRetry'));
      return false;
    }
  };

  /**
   * 处理表单提交
   * 生成分享链接并复制到剪切板
   */
  const handleFinish = async (values: ShareFormValues) => {
    if (shareType === 'DESKTOP') {
      return generateDesktopShareUrl(values);
    } else {
      return generateFileShareUrl(values);
    }
  };

  return (
    <XModalForm<ShareFormValues>
      title={
        shareType === 'DESKTOP'
          ? dict('PC.Components.ShareDesktopModal.titleDesktop')
          : dict('PC.Components.ShareDesktopModal.titleFile')
      }
      open={visible}
      formRef={formRef}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      onFinish={handleFinish}
      modalProps={{
        width: 480,
        destroyOnHidden: true,
        zIndex: 99999,
      }}
      submitTimeout={2000}
      submitter={{
        searchConfig: {
          submitText: dict('PC.Components.ShareDesktopModal.generateShareLink'),
          resetText: dict('PC.Common.Global.cancel'),
        },
      }}
      initialValues={{
        expireSeconds: getDefaultExpireSeconds(), // 远程桌面默认1小时，文件分享默认永久
        allowDownload: true, // 默认开启下载
      }}
    >
      {/* 有效时间选择 */}
      <ProFormSelect
        name="expireSeconds"
        label={dict('PC.Components.ShareDesktopModal.validDuration')}
        placeholder={dict(
          'PC.Components.ShareDesktopModal.selectValidDuration',
        )}
        options={getTimeOptions()}
        rules={[
          {
            required: true,
            message: dict(
              'PC.Components.ShareDesktopModal.selectValidDuration',
            ),
          },
        ]}
      />

      {/* 实时显示有效时间提示 */}
      <ProFormDependency name={['expireSeconds']}>
        {({ expireSeconds }) => (
          <div style={{ marginTop: -16, marginBottom: 16, color: '#00000073' }}>
            {expireSeconds
              ? dict(
                  'PC.Components.ShareDesktopModal.linkExpiresIn',
                  formatTimeDisplay(expireSeconds || 5 * 60),
                )
              : dict('PC.Components.ShareDesktopModal.linkPermanent')}
          </div>
        )}
      </ProFormDependency>

      {/* 允许下载开关 - 仅文件分享显示 */}
      {shareType === 'CONVERSATION' && (
        <ProFormSwitch
          name="allowDownload"
          label={dict('PC.Components.ShareDesktopModal.allowDownload')}
          tooltip={dict('PC.Components.ShareDesktopModal.allowDownloadTooltip')}
        />
      )}

      {/* 温馨提示 */}
      <Alert
        message={dict('PC.Components.ShareDesktopModal.noticeTitle')}
        description={dict('PC.Components.ShareDesktopModal.noticeDescription')}
        type="info"
        showIcon
        style={{ marginTop: 8 }}
      />
    </XModalForm>
  );
};

export default ShareDesktopModal;
