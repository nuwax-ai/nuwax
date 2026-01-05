import {
  apiPageAddDomain,
  apiPageDeleteDomain,
  apiPageGetDomains,
} from '@/services/pageDev';
import type {
  DomainBindingModalProps,
  DomainInfo,
} from '@/types/interfaces/pageDev';
import {
  CloseOutlined,
  EditOutlined,
  GlobalOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Input, message, Modal, Segmented, Spin } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 域名绑定管理弹窗
 */
const DomainBindingModal: React.FC<DomainBindingModalProps> = ({
  open,
  projectId,
  onCancel,
  onSuccess,
}) => {
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  // CNAME类型切换：cn-中国用户, en-海外用户
  const [cnameType, setCnameType] = useState<'cn' | 'en'>('cn');

  // 查询域名列表
  const { run: runGetDomains } = useRequest(apiPageGetDomains, {
    manual: true,
    onSuccess: (result: DomainInfo[]) => {
      setDomains(result || []);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 添加域名
  const { run: runAddDomain } = useRequest(apiPageAddDomain, {
    manual: true,
    onSuccess: () => {
      message.success('添加成功');
      setNewDomain('');
      setShowAddInput(false);
      setAddLoading(false);
      // 重新查询列表
      runGetDomains(projectId);
      onSuccess?.();
    },
    onError: () => {
      setAddLoading(false);
    },
  });

  // 删除域名
  const { run: runDeleteDomain } = useRequest(apiPageDeleteDomain, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功');
      // 重新查询列表
      runGetDomains(projectId);
      onSuccess?.();
    },
  });

  // 打开时查询列表
  useEffect(() => {
    if (open && projectId) {
      setLoading(true);
      runGetDomains(projectId);
    }
  }, [open, projectId]);

  // 处理添加域名
  const handleAddDomain = useCallback(() => {
    if (!newDomain.trim()) {
      message.warning('请输入域名');
      return;
    }
    // 简单的域名格式验证
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain.trim())) {
      message.warning('请输入有效的域名格式');
      return;
    }
    setAddLoading(true);
    runAddDomain({ projectId, domain: newDomain.trim() });
  }, [newDomain, projectId, runAddDomain]);

  // 处理删除域名
  const handleDeleteDomain = useCallback(
    (domainId: number) => {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除该域名绑定吗？',
        onOk: () => {
          runDeleteDomain({ projectId, domainId });
        },
      });
    },
    [projectId, runDeleteDomain],
  );

  // 取消添加
  const handleCancelAdd = useCallback(() => {
    setShowAddInput(false);
    setNewDomain('');
  }, []);

  return (
    <Modal
      title="域名绑定管理"
      open={open}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="save" type="primary" onClick={onCancel}>
          保存更改
        </Button>,
      ]}
    >
      <div className={cx(styles['domain-binding-modal'])}>
        {/* CNAME 配置提示区域 */}
        <div className={cx(styles['cname-section'])}>
          <div className={cx(styles['cname-title'])}>
            请将域名解析到以下 CNAME 地址（二选一）
          </div>
          <Segmented
            className={cx(styles['cname-tabs'])}
            value={cnameType}
            onChange={(value) => setCnameType(value as 'cn' | 'en')}
            options={[
              { label: '中国用户', value: 'cn' },
              { label: '海外用户', value: 'en' },
            ]}
          />
          <div className={cx(styles['cname-content'])}>
            {cnameType === 'cn' ? (
              <>
                <div className={cx(styles['cname-value'])}>
                  cn-cname.nuwax.com
                </div>
                <div className={cx(styles['cname-desc'])}>
                  对中国用户提供服务，需有 ICP 备案
                </div>
              </>
            ) : (
              <>
                <div className={cx(styles['cname-value'])}>
                  en-cname.nuwax.com
                </div>
                <div className={cx(styles['cname-desc'])}>
                  对海外用户提供服务，请遵守你所服务国家或地区的法律法规
                </div>
              </>
            )}
          </div>
        </div>

        {/* 已绑定域名列表 */}
        <div className={cx(styles['domain-list-header'])}>
          <span className={cx(styles['header-title'])}>已绑定域名</span>
          <span className={cx(styles['domain-count'])}>
            {domains.length} 个域名
          </span>
        </div>

        <Spin spinning={loading}>
          <div className={cx(styles['domain-list'])}>
            {domains.map((domain) => (
              <div key={domain.id} className={cx(styles['domain-item'])}>
                <div className={cx(styles['domain-icon'])}>
                  <GlobalOutlined />
                </div>
                <div className={cx(styles['domain-info'])}>
                  <div className={cx(styles['domain-name'])}>
                    {domain.domain}
                  </div>
                  <div
                    className={cx(
                      styles['domain-status'],
                      styles[domain.status],
                    )}
                  >
                    <span className={cx(styles['status-dot'])} />
                    {domain.status === 'active' ? '已激活' : '待验证'}
                  </div>
                </div>
                <div className={cx(styles['domain-actions'])}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    disabled
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleDeleteDomain(domain.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Spin>

        {/* 添加新域名 */}
        {showAddInput ? (
          <div className={cx(styles['add-domain-input'])}>
            <Input
              className={cx(styles['domain-input'])}
              placeholder="请输入域名，如 example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onPressEnter={handleAddDomain}
            />
            <Button onClick={handleCancelAdd}>取消</Button>
            <Button
              type="primary"
              loading={addLoading}
              onClick={handleAddDomain}
            >
              确定
            </Button>
          </div>
        ) : (
          <Button
            className={cx(styles['add-domain-btn'])}
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setShowAddInput(true)}
          >
            添加新域名
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default DomainBindingModal;
