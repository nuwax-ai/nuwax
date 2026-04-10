import { apiI18nLangList } from '@/services/i18n';
import { dict, fetchAndApplyLangMap } from '@/services/i18nRuntime';
import { I18nLangDto } from '@/types/interfaces/i18n';
import { CheckOutlined, GlobalOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps, message } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

/**
 * 登录页专用语言切换组件
 * 悬浮在右上角，点击后直接切换并刷新页面
 */
const LoginLangSwitcher: React.FC = () => {
  const [languages, setLanguages] = useState<I18nLangDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>();

  // 获取启用的语言列表
  useEffect(() => {
    const fetchLangs = async () => {
      try {
        const res = await apiI18nLangList();
        if (res.success && res.data) {
          const enabledLangs = res.data.filter((item) => item.status === 1);
          setLanguages(enabledLangs);

          // 默认选中后端返回的默认语言
          const defaultLang = enabledLangs.find((item) => item.isDefault === 1);
          if (defaultLang) {
            setSelectedLang(defaultLang.lang);
          }
        }
      } catch (error) {
        console.error('[LoginLangSwitcher] Failed to fetch languages:', error);
      }
    };
    fetchLangs();
  }, []);

  const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === selectedLang) return;

    setLoading(true);
    const hide = message.loading(dict('PC.Common.Global.processing'), 0);
    try {
      const applied = await fetchAndApplyLangMap(key, 'PC');
      if (applied) {
        // 切换成功后刷新页面
        window.location.reload();
      } else {
        message.warning(dict('PC.Common.Global.syncFailed'));
        hide();
      }
    } catch (error) {
      console.error('[LoginLangSwitcher] Failed to change language:', error);
      message.error(dict('PC.Common.Global.error'));
      hide();
    } finally {
      setLoading(false);
    }
  };

  const menuItems: MenuProps['items'] = languages.map((item) => ({
    key: item.lang,
    label: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: 100,
        }}
      >
        <span>{item.name}</span>
        {item.lang === selectedLang && (
          <CheckOutlined style={{ color: '#1890ff', marginLeft: 8 }} />
        )}
      </div>
    ),
    disabled: loading,
  }));

  // 如果尚未获取到语言列表、或只有一种语言（切换无意义），则不渲染该组件
  if (!selectedLang || languages.length <= 1) {
    return null;
  }

  // 获取当前展示的语言名称
  const currentLangName =
    languages.find((l) => l.lang === selectedLang)?.name || 'Language';

  return (
    <div className={styles.switcherContainer}>
      <Dropdown
        menu={{
          items: menuItems,
          onClick: handleMenuClick,
          selectedKeys: [selectedLang],
        }}
        placement="bottomRight"
        trigger={['click']}
        overlayClassName="login-lang-dropdown"
      >
        <div className={styles.trigger}>
          <GlobalOutlined style={{ fontSize: 16 }} />
          <span>{currentLangName}</span>
        </div>
      </Dropdown>
    </div>
  );
};

export default LoginLangSwitcher;
