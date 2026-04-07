import { apiI18nLangList } from '@/services/i18n';
import { dict, fetchAndApplyLangMap } from '@/services/i18nRuntime';
import { I18nLangDto } from '@/types/interfaces/i18n';
import { Button, message, Modal, Select, Tag } from 'antd';
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

          // 默认选中后端返回的默认语言
          const defaultLang = res.data.find((item) => item.isDefault === 1);
          if (defaultLang) {
            setSelectedLang(defaultLang.lang);
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

  // 监听当前系统语言变化，同步内部状态
  // useEffect(() => {
  //   setSelectedLang(getCurrentLang());
  // }, [getCurrentLang()]);

  // 保存并更新语言
  const handleSave = () => {
    if (!selectedLang) return;

    // 判断当前选中的语言是否已经是默认语言
    const target = languages.find((item) => item.lang === selectedLang);
    if (target?.isDefault === 1) {
      message.info(dict('PC.Pages.Setting.alreadyDefault'));
      return;
    }

    Modal.confirm({
      title: dict('PC.Pages.Setting.confirmTitle'),
      content: dict('PC.Pages.Setting.confirmContent'),
      centered: true,
      okText: dict('PC.Common.Global.confirm'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: async () => {
        setSaving(true);
        try {
          // 调用 i18n/query 接口（通过 fetchAndApplyLangMap）更新本地运行时字典并应用
          const applied = await fetchAndApplyLangMap(selectedLang, 'PC');
          if (applied) {
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
            >
              {languages.map((item) => (
                <Option key={item.lang} value={item.lang}>
                  <div className={cx(styles.langOption)}>
                    <span>{`${item.name} ${item.lang}`}</span>
                    {item.isDefault === 1 && (
                      <Tag
                        color="blue"
                        bordered={false}
                        style={{ marginLeft: 8 }}
                      >
                        {dict('PC.Pages.Setting.defaultTag')}
                      </Tag>
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
