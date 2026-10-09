import { apiI18nLangList, saveUserLang } from '@/services/i18n';
import { normalizeLang } from '@/services/i18nLangPolicy';
import {
  dict,
  fetchAndApplyLangMap,
  getCurrentLang,
  markLangUserSet,
} from '@/services/i18nRuntime';
import { UserService } from '@/services/userService';
import { I18nLangDto } from '@/types/interfaces/i18n';
import { CheckOutlined } from '@ant-design/icons';
import { Button, message, Modal, Select } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const { Option } = Select;

/**
 * 语言切换面板组件
 * 支持从后端动态获取语言列表并进行切换保存
 */
const LanguageSwitchPanel: React.FC = () => {
  const [languages, setLanguages] = useState<I18nLangDto[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>();
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  // 初始化获取开启状态的语言列表
  useEffect(() => {
    const fetchLangs = async () => {
      setFetching(true);
      try {
        const res = await apiI18nLangList();
        if (res.success && res.data) {
          // 只显示状态为 1 (启用) 的语言
          const enabledLangs = res.data.filter((item) => item.status === 1);
          setLanguages(enabledLangs);

          // 初值优先当前运行语言（后端 isDefault 是租户默认，未必是用户当前语种）
          const currentLangItem = enabledLangs.find(
            (item) =>
              normalizeLang(item.lang) === normalizeLang(getCurrentLang()),
          );
          const initialLang =
            currentLangItem ?? res.data.find((item) => item.isDefault === 1);
          if (initialLang) {
            setSelectedLang(initialLang.lang);
          }
        }
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      } finally {
        setFetching(false);
      }
    };
    fetchLangs();
  }, []);

  // 保存并更新语言
  const handleSave = () => {
    if (!selectedLang) return;

    Modal.confirm({
      title: dict('PC.Pages.Setting.confirmTitle'),
      content: dict('PC.Pages.Setting.confirmContent'),
      centered: true,
      okText: dict('PC.Common.Global.confirm'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: async () => {
        setSaving(true);
        try {
          // 用户显式选择：置标记，此后以缓存语种为准（不再被产品默认/账号侧语种覆盖）
          markLangUserSet();
          // 更新本地运行时字典并应用
          const applied = await fetchAndApplyLangMap(selectedLang, 'PC');
          if (applied) {
            // 持久化到账号（user/update）：i18n/query 只查词典不写用户偏好，
            // 不持久化则刷新后账号侧旧语种（如残留 en-US）会与本地选择打架
            try {
              await saveUserLang(selectedLang);
            } catch {
              // 后端持久化失败不阻断本地切换（本地显式选择已生效）
            }
            // 清除本地用户信息缓存，确保刷新后从服务端获取最新的语种配置
            UserService.clearUserInfo();
            message.success(dict('PC.Pages.Setting.saveSuccess'));
            // 刷新页面
            window.location.reload();
          } else {
            message.warning(dict('PC.Common.Global.syncFailed'));
          }
        } catch (error) {
          console.error('Failed to change language:', error);
          message.error(dict('PC.Common.Global.error'));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.title)}>
        {dict('PC.Pages.Setting.languageTitle')}
      </div>
      <div className={cx(styles.content, 'scroll-container')}>
        <div className={cx(styles.configItem)}>
          <div className={cx(styles.label)}>
            {dict('PC.Pages.Setting.language')}
          </div>
          <div className={cx(styles.actionRow)}>
            <Select
              loading={fetching}
              value={selectedLang}
              onChange={setSelectedLang}
              placeholder={dict('PC.Pages.Setting.selectLanguage')}
              optionLabelProp="label"
            >
              {languages.map((item) => (
                <Option key={item.lang} value={item.lang} label={item.name}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{item.name}</span>
                    {item.isDefault === 1 && (
                      <CheckOutlined style={{ color: '#1890ff' }} />
                    )}
                  </div>
                </Option>
              ))}
            </Select>
            <Button type="primary" loading={saving} onClick={handleSave}>
              {dict('PC.Pages.Setting.saveButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitchPanel;
