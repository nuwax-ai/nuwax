import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentConversationShare } from '@/services/agentConfig';
import { AgentConversationShareParams } from '@/types/interfaces/agent';
import { copyTextToClipboard } from '@/utils/clipboard';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDependency,
  ProFormSelect,
} from '@ant-design/pro-components';
import { Alert, message } from 'antd';
import React, { useRef } from 'react';

/**
 * 时间选项配置
 * value: 秒数（0表示永久）
 * label: 显示文本
 */
const TIME_OPTIONS = [
  { label: '永久', value: 0 },
  { label: '1分钟', value: 60 },
  { label: '5分钟', value: 5 * 60 },
  { label: '10分钟', value: 10 * 60 },
  { label: '20分钟', value: 20 * 60 },
  { label: '30分钟', value: 30 * 60 },
  { label: '40分钟', value: 40 * 60 },
  { label: '50分钟', value: 50 * 60 },
  { label: '1小时', value: 60 * 60 },
  { label: '2小时', value: 2 * 60 * 60 },
  { label: '4小时', value: 4 * 60 * 60 },
  { label: '8小时', value: 8 * 60 * 60 },
  { label: '16小时', value: 16 * 60 * 60 },
  { label: '1天', value: 24 * 60 * 60 },
];

/**
 * 表单数据类型
 */
interface ShareFormValues {
  expireSeconds: number;
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
    return option?.label || `${seconds}秒`;
  };

  const generateDesktopShareUrl = async (values: ShareFormValues) => {
    if (!conversationId) {
      message.error('会话ID不存在，无法分享');
      return false;
    }

    try {
      // 构造远程桌面URL
      const desktopUrl = `/computer/desktop/${conversationId}/vnc.html?resize=scale&autoconnect=true`;

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
        message.success('远程桌面分享成功，链接已复制到剪切板');

        return true; // 返回 true 关闭弹窗
      } else {
        message.error('分享失败，请稍后重试');
        return false; // 返回 false 保持弹窗打开
      }
    } catch (error) {
      console.error('分享远程桌面失败:', error);
      message.error('分享失败，请稍后重试');
      return false;
    }
  };
  const generateFileShareUrl = async (values: ShareFormValues) => {
    if (!conversationId) {
      message.error('会话ID不存在，无法分享');
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
        const previewUrl = baseUrl + path + '?' + query.toString();

        // 复制到剪切板
        copyTextToClipboard(previewUrl);
        message.success('分享成功，链接已复制到剪切板');
        return true;
      } else {
        message.error('分享失败，请稍后重试');
        return false;
      }
    } catch (error) {
      console.error('分享文件失败:', error);
      message.error('分享失败，请稍后重试');
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
    <ModalForm<ShareFormValues>
      title={shareType === 'DESKTOP' ? '分享远程桌面' : '分享文件'}
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
      }}
      submitTimeout={2000}
      submitter={{
        searchConfig: {
          submitText: '生成分享链接',
          resetText: '取消',
        },
      }}
      initialValues={{
        expireSeconds: getDefaultExpireSeconds(), // 远程桌面默认1小时，文件分享默认永久
      }}
    >
      {/* 有效时间选择 */}
      <ProFormSelect
        name="expireSeconds"
        label="有效时间"
        placeholder="请选择有效时间"
        options={getTimeOptions()}
        rules={[{ required: true, message: '请选择有效时间' }]}
      />

      {/* 实时显示有效时间提示 */}
      <ProFormDependency name={['expireSeconds']}>
        {({ expireSeconds }) => (
          <div style={{ marginTop: -16, marginBottom: 16, color: '#00000073' }}>
            {expireSeconds
              ? `链接将在 ${formatTimeDisplay(expireSeconds || 5 * 60)} 后失效`
              : `链接永久有效`}
          </div>
        )}
      </ProFormDependency>

      {/* 温馨提示 */}
      <Alert
        message="温馨提示："
        description="分享链接生成后将自动复制到剪切板；互联网上得到该分享链接的用户均可访问，请谨慎分享，注意数据风险。"
        type="info"
        showIcon
        style={{ marginTop: 8 }}
      />
    </ModalForm>
  );
};

export default ShareDesktopModal;
