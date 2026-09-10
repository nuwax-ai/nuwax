import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { SyncOutlined } from '@ant-design/icons';
import { Button, Input, message, Space, Spin } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiUserAppDbCredentialGen,
  apiUserAppDbCredentialGet,
  apiUserAppDbCredentialSave,
  type UserAppDbCredentialInfo,
  UserAppDbEnvEnum,
} from '../../services/appDb';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevDatabaseConfigPanelProps {
  /** 应用 ID，用于查询数据库配置 */
  appId: number;
  /** 当前开发或线上环境 */
  env: UserAppDbEnvEnum;
}

/** 数据库配置表单值，接口中的 null 已统一转换为空字符串 */
interface DatabaseConfigFormValue {
  username: string;
  password: string;
}

/**
 * 将接口返回的可空字段转换为受控输入框所需的字符串。
 *
 * @param value 接口返回的数据库配置
 * @returns 可安全编辑的表单值
 */
const normalizeDatabaseConfig = (
  value?: UserAppDbCredentialInfo | null,
): DatabaseConfigFormValue => ({
  username: value?.username ?? '',
  password: value?.password ?? '',
});

/**
 * 数据库配置面板。
 * 根据当前应用与环境查询、编辑数据库账号密码，并支持随机生成和保存。
 * 密码默认隐藏，组件不会将其写入日志或浏览器持久化存储。
 *
 * @param props.appId 应用 ID
 * @param props.env 当前环境
 * @returns 数据库配置面板
 */
const AppDevDatabaseConfigPanel: React.FC<AppDevDatabaseConfigPanelProps> = ({
  appId,
  env,
}) => {
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfigFormValue>(
    () => normalizeDatabaseConfig(),
  );
  const [generating, setGenerating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // 查询数据库账号密码（解密返回明文，未设置返回 null
  const { loading } = useRequest(
    () => apiUserAppDbCredentialGet(appId as number, env),
    {
      refreshDeps: [appId, env],
      onSuccess: (result: UserAppDbCredentialInfo) => {
        setDatabaseConfig(normalizeDatabaseConfig(result));
      },
    },
  );

  /** 随机生成账号密码，仅回填表单，保存后才会生效 */
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const response = await apiUserAppDbCredentialGen(
        appId,
        'username-password',
      );
      if (response.code && response.code !== SUCCESS_CODE) {
        throw new Error(response.message);
      }
      if (response.data) {
        setDatabaseConfig(normalizeDatabaseConfig(response.data));
      }
    } finally {
      setGenerating(false);
    }
  }, [appId]);

  /** 保存当前环境的数据库账号密码 */
  const handleSave = useCallback(async () => {
    if (!databaseConfig.username || !databaseConfig.password) {
      return;
    }
    setSaving(true);
    try {
      const response = await apiUserAppDbCredentialSave({
        id: appId,
        env,
        username: databaseConfig.username.trim(),
        password: databaseConfig.password,
      });
      if (response.code && response.code !== SUCCESS_CODE) {
        throw new Error(response.message);
      }
      if (response.data) {
        setDatabaseConfig(normalizeDatabaseConfig(response.data));
      }
      message.success(dict('PC.Pages.AppDevPro.databaseConfigSaveSuccess'));
    } finally {
      setSaving(false);
    }
  }, [appId, databaseConfig, env]);

  if (loading) {
    return (
      <div className={cx(styles.container, styles.center)}>
        <Spin />
      </div>
    );
  }

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.content)}>
        <h3 className={cx(styles.title)}>
          {dict('PC.Pages.AppDevPro.databaseConfig')}
        </h3>
        <p className={cx(styles.description)}>
          {dict('PC.Pages.AppDevPro.databaseConfigDesc')}
        </p>

        <div className={cx(styles.field)}>
          <label className={cx(styles.label)}>
            {dict('PC.Pages.AppDevPro.databaseUsername')}
          </label>
          <div className={cx(styles['value-row'])}>
            <Input
              name="database-config-account-value"
              autoComplete="off"
              value={databaseConfig.username}
              onChange={(event) =>
                setDatabaseConfig((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className={cx(styles.field)}>
          <label className={cx(styles.label)}>
            {dict('PC.Pages.AppDevPro.databasePassword')}
          </label>
          <div className={cx(styles['value-row'])}>
            <Input.Password
              name="database-config-password-value"
              autoComplete="new-password"
              value={databaseConfig.password}
              visibilityToggle
              onChange={(event) =>
                setDatabaseConfig((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <Space className={cx(styles.actions)}>
          <Button
            icon={<SyncOutlined />}
            loading={generating}
            disabled={saving}
            onClick={handleGenerate}
          >
            {dict('PC.Pages.AppDevPro.databaseConfigGenerate')}
          </Button>
          <Button
            type="primary"
            loading={saving}
            disabled={
              generating ||
              !databaseConfig.username.trim() ||
              !databaseConfig.password
            }
            onClick={handleSave}
          >
            {dict('PC.Pages.AppDevPro.databaseConfigSave')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default AppDevDatabaseConfigPanel;
