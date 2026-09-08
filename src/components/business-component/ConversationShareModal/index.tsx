import { XModalForm } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiConversationShareMd } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { copyTextToClipboard } from '@/utils/clipboard';
import { sanitizeShareTitle } from '@/utils/conversationShareMd';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { Alert, message } from 'antd';
import React, { useRef } from 'react';

/** 有效期精简档(复用 ShareDesktopModal 词条,7/30 天为新增) */
const TIME_OPTIONS = [
  { label: dict('PC.Components.ShareDesktopModal.permanent'), value: 0 },
  { label: dict('PC.Components.ShareDesktopModal.hour1'), value: 60 * 60 },
  { label: dict('PC.Components.ShareDesktopModal.day1'), value: 24 * 60 * 60 },
  {
    label: dict('PC.Components.ConversationShareModal.day7'),
    value: 7 * 24 * 60 * 60,
  },
  {
    label: dict('PC.Components.ConversationShareModal.day30'),
    value: 30 * 24 * 60 * 60,
  },
];

interface ShareFormValues {
  expireSeconds: number;
  allowDownload?: boolean;
}

export interface ConversationShareModalProps {
  visible: boolean;
  onClose: () => void;
  /** 消息分享 / 会话分享 */
  kind: 'message' | 'conversation';
  conversationId?: string | number | null;
  /** 落地页标题(会话主题/消息兜底文案) */
  title: string;
  /** 组装好的分享 markdown(utils/conversationShareMd) */
  markdown: string;
}

/**
 * 会话/消息分享弹窗(需求 5c):有效期 + 允许下载 → 生成
 * file-preview.html?sk= 链接并复制剪贴板;分享产物为 markdown,
 * 由静态页渲染,双端共用。mock 链路见 mock/conversationShareMd.ts。
 */
const ConversationShareModal: React.FC<ConversationShareModalProps> = ({
  visible,
  onClose,
  kind,
  conversationId,
  title,
  markdown,
}) => {
  const formRef = useRef<ProFormInstance>();

  const handleFinish = async (values: ShareFormValues) => {
    if (!conversationId) {
      message.error(
        dict('PC.Components.ShareDesktopModal.conversationIdMissing'),
      );
      return false;
    }
    try {
      const { data: shareData, code } = await apiConversationShareMd({
        conversationId,
        kind: kind === 'message' ? 'MESSAGE' : 'CONVERSATION',
        title: sanitizeShareTitle(title),
        markdown,
        expireSeconds: values.expireSeconds ? values.expireSeconds : null,
        allowDownload: Boolean(values.allowDownload),
      });
      if (code !== SUCCESS_CODE || !shareData?.shareKey) {
        message.error(dict('PC.Components.ShareDesktopModal.shareFailedRetry'));
        return false;
      }

      const baseUrl = window?.location?.origin || '';
      const query = new URLSearchParams();
      query.set('sk', shareData.shareKey);
      if (values.allowDownload) {
        query.set('dl', '1');
      }
      copyTextToClipboard(`${baseUrl}/static/file-preview.html?${query}`);
      message.success(
        dict('PC.Components.ConversationShareModal.shareSuccess'),
      );
      return true;
    } catch (error) {
      console.error('[ConversationShare] generate failed:', error);
      message.error(dict('PC.Components.ShareDesktopModal.shareFailedRetry'));
      return false;
    }
  };

  return (
    <XModalForm<ShareFormValues>
      title={dict(
        kind === 'message'
          ? 'PC.Components.ConversationShareModal.titleMessage'
          : 'PC.Components.ConversationShareModal.titleConversation',
      )}
      open={visible}
      formRef={formRef}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      onFinish={handleFinish}
      modalProps={{ width: 480, destroyOnHidden: true, zIndex: 99999 }}
      submitTimeout={2000}
      submitter={{
        searchConfig: {
          submitText: dict('PC.Components.ShareDesktopModal.generateShareLink'),
          resetText: dict('PC.Common.Global.cancel'),
        },
      }}
      initialValues={{ expireSeconds: 0, allowDownload: true }}
    >
      <ProFormSelect
        name="expireSeconds"
        label={dict('PC.Components.ShareDesktopModal.validDuration')}
        placeholder={dict(
          'PC.Components.ShareDesktopModal.selectValidDuration',
        )}
        options={TIME_OPTIONS}
        rules={[
          {
            required: true,
            message: dict(
              'PC.Components.ShareDesktopModal.selectValidDuration',
            ),
          },
        ]}
      />
      <ProFormDependency name={['expireSeconds']}>
        {({ expireSeconds }) => (
          <div style={{ marginTop: -16, marginBottom: 16, color: '#00000073' }}>
            {expireSeconds
              ? dict(
                  'PC.Components.ShareDesktopModal.linkExpiresIn',
                  TIME_OPTIONS.find((opt) => opt.value === expireSeconds)
                    ?.label ?? '',
                )
              : dict('PC.Components.ShareDesktopModal.linkPermanent')}
          </div>
        )}
      </ProFormDependency>
      <ProFormSwitch
        name="allowDownload"
        label={dict('PC.Components.ShareDesktopModal.allowDownload')}
        tooltip={dict('PC.Components.ShareDesktopModal.allowDownloadTooltip')}
      />
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

export default ConversationShareModal;
