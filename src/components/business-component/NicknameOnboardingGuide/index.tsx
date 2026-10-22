import avatarImage from '@/assets/images/avatar.png';
import UploadAvatar from '@/components/UploadAvatar';
import { apiUserUpdate } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import { UserService } from '@/services/userService';
import type { UserInfo, UserUpdateParams } from '@/types/interfaces/login';
import { Alert, Button, Form, Input, message, Modal } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
import {
  isOnboardingSkippedThisSession,
  markOnboardingDoneThisSession,
  NICKNAME_MAX_LENGTH,
  shouldShowNicknameOnboarding,
  validateNickname,
} from './policy';
import styles from './index.less';

/**
 * 默认名用户首登昵称/头像引导弹窗（规划 7.3）
 *
 * 挂载在全局布局层（layouts/index），条件满足才渲染：
 * - 用户名仍是注册默认名形态（user+数字 id）且昵称为空；
 * - 非必填、可跳过、不拦主流程：跳过/完成后本会话（sessionStorage 级）
 *   不再触发；完成设置后判定条件不再满足，永久不再触发。
 *
 * 数据链路复用个人资料页（SettingAccount）同款：
 * - 昵称/头像保存：apiUserUpdate（POST /api/user/update）；
 * - 头像上传：UploadAvatar 组件（上传成功返回 url，随保存一并提交）。
 */
const NicknameOnboardingGuide: React.FC = () => {
  const { userInfo, getUserInfo, setUserInfo } = useModel('userInfo');
  const { runTenantConfig } = useModel('tenantConfigInfo');
  const [form] = Form.useForm<{ nickName: string }>();
  const [open, setOpen] = useState(false);
  // 上传成功待随保存一并提交的头像 url（可不上传直接保存昵称）
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  // 保存失败时的弹窗内错误反馈（请求层对业务失败已有全局 toast，这里补确定性提示）
  const [saveError, setSaveError] = useState(false);
  // 引导每次挂载周期只自动弹一次，防止模型状态刷新引起重复弹
  const triggeredRef = useRef(false);

  // 布局层挂载时 userInfo 模型可能尚未装载（取决于先挂的页面是否拉过），
  // 兜底拉一次；UserService 优先读本地缓存，常规路径零额外请求
  useEffect(() => {
    if (userInfo) return;
    void getUserInfo();
  }, [userInfo, getUserInfo]);

  // 触发判定：默认名 + 空昵称 + 本会话未跳过
  useEffect(() => {
    if (triggeredRef.current) return;
    if (!userInfo) return;
    if (!shouldShowNicknameOnboarding(userInfo)) return;
    if (isOnboardingSkippedThisSession(userInfo.id)) return;
    triggeredRef.current = true;
    setOpen(true);
  }, [userInfo]);

  /** 跳过（含右上角 X / Esc 关闭）：本会话不再弹 */
  const handleSkip = useCallback(() => {
    markOnboardingDoneThisSession(userInfo?.id);
    setOpen(false);
  }, [userInfo]);

  /** 昵称校验：非空去首尾空格 + 50 字上限（兜底绕过输入框截断的场景） */
  const validateNickName = useCallback(
    (_rule: unknown, value: string) => {
      const error = validateNickname(value);
      if (error === 'required') {
        return Promise.reject(
          new Error(
            dict('PC.Components.NicknameOnboardingGuide.nickNameRequired'),
          ),
        );
      }
      if (error === 'tooLong') {
        return Promise.reject(
          new Error(
            dict('PC.Components.NicknameOnboardingGuide.nickNameTooLong'),
          ),
        );
      }
      return Promise.resolve();
    },
    [],
  );

  /** 保存：校验通过才提交；成功关窗并同步本地用户信息，失败保留弹窗可重试 */
  const handleSave = useCallback(async () => {
    setSaveError(false);
    let values: { nickName?: string };
    try {
      values = await form.validateFields();
    } catch {
      // 表单校验失败：antd 已在字段下方提示，不发请求
      return;
    }
    const nickName = String(values.nickName ?? '').trim();
    const params: UserUpdateParams = avatarUrl
      ? { nickName, avatar: avatarUrl }
      : { nickName };
    setSaving(true);
    try {
      await apiUserUpdate(params);
      message.success(dict('PC.Toast.Global.savedSuccessfully'));
      // 同步 userInfo 模型与本地缓存，侧栏用户名/首页问候语即时生效
      setUserInfo((prev: UserInfo | null) =>
        prev
          ? {
              ...prev,
              nickName,
              ...(avatarUrl ? { avatar: avatarUrl } : {}),
            }
          : prev,
      );
      const cached = UserService.getUserInfoFromStorage();
      if (cached) {
        UserService.saveUserInfoToStorage({
          ...cached,
          nickName,
          ...(avatarUrl ? { avatar: avatarUrl } : {}),
        });
      }
      // 完成即视为本会话已处理（此后空昵称条件也不再满足，双保险）
      markOnboardingDoneThisSession(userInfo?.id);
      setOpen(false);
      // 首页问候语由租户配置生成，昵称保存成功后同步刷新（同 SettingAccount）
      runTenantConfig();
    } catch {
      // 业务失败请求层已全局提示；弹窗内再给确定性反馈，不关窗、可重试
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [avatarUrl, form, runTenantConfig, setUserInfo, userInfo]);

  // 条件不满足时零渲染，不进布局树
  if (!open) return null;

  return (
    <Modal
      open
      centered
      title={dict('PC.Components.NicknameOnboardingGuide.title')}
      onCancel={handleSkip}
      // 误点遮罩不当作跳过（引导非必填但也不应被误触吞掉），显式走按钮/关闭键
      maskClosable={false}
      // 与设置弹窗同层：钉死 1000 基线，避免 antd 弹层 zIndex 爬升越过客户端壳层
      zIndex={1000}
      footer={[
        <Button key="skip" onClick={handleSkip}>
          {dict('PC.Components.NicknameOnboardingGuide.skip')}
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={saving}
          onClick={() => {
            void handleSave();
          }}
        >
          {dict('PC.Common.Global.save')}
        </Button>,
      ]}
    >
      <p className={styles.description}>
        {dict('PC.Components.NicknameOnboardingGuide.description')}
      </p>
      <div className={styles['avatar-row']}>
        <span className={styles['avatar-label']}>
          {dict('PC.Components.NicknameOnboardingGuide.avatarLabel')}
        </span>
        <UploadAvatar
          imageUrl={avatarUrl || userInfo?.avatar}
          className={styles.avatar}
          defaultImage={avatarImage as string}
          onUploadSuccess={(url) => {
            if (url) setAvatarUrl(url);
          }}
        />
      </div>
      <Form form={form} layout="vertical">
        <Form.Item
          label={dict('PC.Components.NicknameOnboardingGuide.nickNameLabel')}
          name="nickName"
          rules={[{ validator: validateNickName }]}
        >
          <Input
            placeholder={dict(
              'PC.Components.NicknameOnboardingGuide.nickNamePlaceholder',
            )}
            maxLength={NICKNAME_MAX_LENGTH}
            showCount
            autoFocus
          />
        </Form.Item>
      </Form>
      {saveError && (
        <Alert
          type="error"
          showIcon
          message={dict('PC.Components.NicknameOnboardingGuide.saveFailed')}
        />
      )}
    </Modal>
  );
};

export default NicknameOnboardingGuide;
