import UploadAvatar from '@/components/UploadAvatar';
import { dict } from '@/services/i18nRuntime';
import type { CustomNameAndIconProps } from '@/types/interfaces/agentConfig';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 自定义页面名称与图标。
 * - 支持上传并预览页面图标
 * - 支持编辑页面名称
 * - 点击保存后复用父组件保存逻辑提交配置
 */
const CustomNameAndIcon: React.FC<CustomNameAndIconProps> = ({
  pageIcon,
  pageName,
  onChangePageInfo,
  onSaveSet,
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * 页面名称输入变化时，回写到父层 bindConfig。
   */
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChangePageInfo('pageName', event.target.value);
  };

  /**
   * 图标上传成功后，回写图标 URL 到父层 bindConfig。
   */
  const handleUploadSuccess = (url: string) => {
    onChangePageInfo('pageIcon', url);
  };

  /**
   * 保存当前配置，并展示按钮 loading 状态。
   */
  const handleSave = async () => {
    setLoading(true);
    await onSaveSet();
    setLoading(false);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div className={cx('flex-1')}>
        <h3 className={cx('mb-12')}>
          {dict('PC.Pages.AgentArrangePageSettingModal.customNameAndIcon')}
        </h3>
        <div className={cx(styles.formItem)}>
          <div className={cx(styles.label)}>
            {dict('PC.Pages.AgentArrangePageSettingModal.pageIcon')}
          </div>
          <UploadAvatar
            imageUrl={pageIcon || ''}
            onUploadSuccess={handleUploadSuccess}
            svgIconName="icons-common-plus"
          />
        </div>
        <div className={cx(styles.formItem)}>
          <div className={cx(styles.label)}>
            {dict('PC.Pages.AgentArrangePageSettingModal.pageName')}
          </div>
          <Input
            value={pageName || ''}
            maxLength={50}
            showCount
            placeholder={dict(
              'PC.Pages.AgentArrangePageSettingModal.pageNamePlaceholder',
            )}
            onChange={handleNameChange}
          />
        </div>
      </div>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave} loading={loading}>
          {dict('PC.Pages.EditAgent.save')}
        </Button>
      </footer>
    </div>
  );
};

export default CustomNameAndIcon;
