import avatarImage from '@/assets/images/avatar.png';
import UploadAvatar from '@/components/UploadAvatar';
import { USER_INFO } from '@/constants/home.constants';
import { apiGetUserDynamicCode, apiUserUpdate } from '@/services/account';
import { apiI18nLangList, saveUserLang } from '@/services/i18n';
import { dict, getCurrentLang, setCurrentLang } from '@/services/i18nRuntime';
import type { I18nLangDto } from '@/types/interfaces/i18n';
import type {
  SetUserAccountInfo,
  UserUpdateParams,
} from '@/types/interfaces/login';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Button, Form, Input, message, Select, Tooltip } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 设置账号
 */
const SettingAccount: React.FC = () => {
  const [form] = Form.useForm();
  const { userInfo, setUserInfo } = useModel('userInfo');
  // 动态验证码相关状态
  const [dynamicCode, setDynamicCode] = useState<number | null>(null);
  const [expireTime, setExpireTime] = useState<Date | null>(null);
  const [language, setLanguage] = useState<string>('');

  // 更新用户信息
  const { run, loading } = useRequest(apiUserUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: UserUpdateParams[]) => {
      message.success(dict('PC.Toast.Global.savedSuccessfully'));
      const _userInfo = cloneDeep(userInfo);
      if (params[0]?.avatar) {
        _userInfo.avatar = params[0].avatar;
      } else {
        _userInfo.userName = form.getFieldValue('userName');
        _userInfo.nickName = form.getFieldValue('nickName');
      }
      setUserInfo(_userInfo);
      localStorage.setItem(USER_INFO, JSON.stringify(_userInfo));
    },
  });

  const { data: langList = [], loading: languageListLoading } = useRequest(
    apiI18nLangList,
    {
      onSuccess: (result: any) => {
        const items: I18nLangDto[] = Array.isArray(result)
          ? result
          : result?.data || [];
        if (!language) {
          const defaultLang =
            userInfo?.lang ||
            items.find((item) => item.isDefault === 1)?.lang ||
            getCurrentLang();
          setLanguage((defaultLang || '').toLowerCase());
        }
      },
    },
  );

  const { run: runSaveLanguage, loading: languageSaving } = useRequest(
    saveUserLang,
    {
      manual: true,
      onSuccess: () => {
        setCurrentLang(language);
        message.success(dict('PC.Toast.Global.languageSavedReload'));
        window.location.reload();
      },
    },
  );

  // 获取动态验证码
  const { run: runGetDynamicCode, loading: dynamicCodeLoading } = useRequest(
    apiGetUserDynamicCode,
    {
      manual: true,
      onSuccess: (code: number) => {
        setDynamicCode(code);
        // 设置过期时间：当前时间 + 5分钟
        const expireDate = new Date();
        expireDate.setMinutes(expireDate.getMinutes() + 5);
        setExpireTime(expireDate);
      },
    },
  );

  // 刷新验证码
  const handleRefreshCode = () => {
    runGetDynamicCode();
  };

  // 复制成功回调
  const handleCopy = () => {
    message.success(dict('PC.Toast.Global.copiedSuccessfully'));
  };

  // 格式化过期时间
  const formatExpireTime = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    form.setFieldsValue({
      userName: userInfo?.userName,
      nickName: userInfo?.nickName,
    });
    setLanguage((userInfo?.lang || getCurrentLang()).toLowerCase());
    // 初始化时获取动态验证码
    runGetDynamicCode();
  }, []);

  useEffect(() => {
    if (userInfo?.lang && userInfo.lang !== language) {
      setLanguage(userInfo.lang.toLowerCase());
    }
  }, [userInfo?.lang]);

  // 上传头像成功后更新头像
  const handleSuccessUpload = (url: string) => {
    if (url) {
      run({
        avatar: url,
      });
    }
  };

  const onSaveUsername: FormProps<SetUserAccountInfo>['onFinish'] = (
    values,
  ) => {
    run(values);
  };

  const languageItems: I18nLangDto[] = Array.isArray(langList)
    ? langList
    : (langList as any)?.data || [];

  const languageOptions = languageItems
    .filter((item) => item.status === 1)
    .sort((a, b) => a.sort - b.sort)
    .map((item) => ({
      label: item.name,
      value: item.lang.toLowerCase(),
    }));

  const handleSaveLanguage = () => {
    if (!language) return;
    runSaveLanguage(language);
  };

  return (
    <div className={cx(styles.container)}>
      <h3>{dict('PC.Pages.Setting.accountTitle')}</h3>
      <UploadAvatar
        imageUrl={userInfo?.avatar}
        className={cx(styles.avatar)}
        defaultImage={avatarImage as string}
        onUploadSuccess={handleSuccessUpload}
      />
      <Form
        form={form}
        layout="vertical"
        requiredMark={customizeRequiredNoStarMark}
        onFinish={onSaveUsername}
      >
        <Form.Item label={dict('PC.Pages.Setting.userName')}>
          <Form.Item
            noStyle
            name="userName"
            rules={[
              {
                required: true,
                message: dict('PC.Pages.Setting.inputUserName'),
              },
            ]}
          >
            <Input
              rootClassName={cx(styles.input)}
              placeholder={dict('PC.Pages.Setting.inputUserName')}
              showCount
              maxLength={50}
            />
          </Form.Item>
          <Form.Item noStyle>
            <Button type="primary" loading={loading} htmlType="submit">
              {dict('PC.Common.Global.save')}
            </Button>
          </Form.Item>
        </Form.Item>
        <Form.Item label={dict('PC.Pages.Setting.nickName')}>
          <Form.Item noStyle name="nickName">
            <Input
              rootClassName={cx(styles.input)}
              placeholder={dict('PC.Pages.Setting.inputNickName')}
              showCount
              maxLength={50}
            />
          </Form.Item>
          <Form.Item noStyle>
            <Button type="primary" loading={loading} htmlType="submit">
              {dict('PC.Common.Global.save')}
            </Button>
          </Form.Item>
        </Form.Item>
      </Form>
      <h4 className={cx(styles.name)}>{dict('PC.Pages.Setting.phone')}</h4>
      <span className={cx(styles.text, styles['mb-30'])}>
        {userInfo?.phone}
      </span>
      <h4 className={cx(styles.name)}>{dict('PC.Pages.Setting.email')}</h4>
      <span className={cx(styles.text, styles['mb-30'])}>
        {userInfo?.email || dict('PC.Pages.Setting.bindPending')}
      </span>
      <h4 className={cx(styles.name)}>
        {dict('PC.Pages.Setting.dynamicCode')}
        {expireTime && (
          <span className={cx(styles.expireTime)}>
            ({dict('PC.Pages.Setting.expiresAt', formatExpireTime(expireTime))})
          </span>
        )}
      </h4>
      <div className={cx('flex', 'items-center')}>
        <span className={cx(styles.text)}>{dynamicCode || '--'}</span>
        <CopyToClipboard
          text={dynamicCode ? String(dynamicCode) : ''}
          onCopy={handleCopy}
        >
          <Tooltip title={dict('PC.Common.Global.copy')}>
            <Button
              size="small"
              type="link"
              icon={<CopyOutlined />}
              className={cx(styles.btn, styles['ml-4'])}
            />
          </Tooltip>
        </CopyToClipboard>
        <Tooltip title={dict('PC.Common.Global.refresh')}>
          <Button
            size="small"
            type="link"
            icon={<ReloadOutlined />}
            loading={dynamicCodeLoading}
            onClick={handleRefreshCode}
            className={cx(styles.btn)}
          />
        </Tooltip>
      </div>
      <h4 className={cx(styles.name, styles['mt-30'])}>
        {dict('PC.Pages.Setting.language')}
      </h4>
      <div className={cx(styles['language-row'])}>
        <Select
          className={cx(styles['language-select'])}
          placeholder={dict('PC.Pages.Setting.selectLanguage')}
          options={languageOptions}
          value={language || undefined}
          onChange={(value) => setLanguage((value || '').toLowerCase())}
          loading={languageListLoading}
        />
        <Button
          type="primary"
          onClick={handleSaveLanguage}
          loading={languageSaving}
          disabled={!language}
        >
          {dict('PC.Common.Global.save')}
        </Button>
      </div>
    </div>
  );
};

export default SettingAccount;
