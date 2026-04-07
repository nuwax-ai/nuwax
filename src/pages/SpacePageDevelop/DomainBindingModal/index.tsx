import { dict } from '@/services/i18nRuntime';
import {
  apiCustomPageCreateDomain,
  apiCustomPageDeleteDomain,
  apiCustomPageGetDomainList,
  apiCustomPageUpdateDomain,
} from '@/services/pageDev';
import type {
  DomainBindingModalProps,
  DomainInfo,
} from '@/types/interfaces/pageDev';
import {
  CloseOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  GlobalOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Input, message, Modal, Spin } from 'antd';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainInfo | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // 查询域名列表
  const { run: runGetDomains } = useRequest(apiCustomPageGetDomainList, {
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
  const { run: runAddDomain } = useRequest(apiCustomPageCreateDomain, {
    manual: true,
    onSuccess: () => {
      message.success(
        dict('PC.Pages.SpacePageDevelop.DomainBindingModal.addSuccess'),
      );
      setNewDomain('');
      setIsModalOpen(false);
      setSubmitLoading(false);
      // 重新查询列表
      runGetDomains(projectId);
      onSuccess?.();
    },
    onError: () => {
      setSubmitLoading(false);
    },
  });

  // 修改域名
  const { run: runUpdateDomain } = useRequest(apiCustomPageUpdateDomain, {
    manual: true,
    onSuccess: () => {
      message.success(
        dict('PC.Pages.SpacePageDevelop.DomainBindingModal.modifySuccess'),
      );
      setNewDomain('');
      setEditingDomain(null);
      setIsModalOpen(false);
      setSubmitLoading(false);
      // 重新查询列表
      runGetDomains(projectId);
      onSuccess?.();
    },
    onError: () => {
      setSubmitLoading(false);
    },
  });

  // 删除域名
  const { run: runDeleteDomain } = useRequest(apiCustomPageDeleteDomain, {
    manual: true,
    onSuccess: () => {
      message.success(
        dict('PC.Pages.SpacePageDevelop.DomainBindingModal.deleteSuccess'),
      );
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

  // 处理提交（新增或修改）
  const handleSubmit = useCallback(() => {
    if (!newDomain.trim()) {
      message.warning(
        dict('PC.Pages.SpacePageDevelop.DomainBindingModal.pleaseEnterDomain'),
      );
      return;
    }
    // 常规域名格式验证
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain.trim())) {
      message.warning(
        dict(
          'PC.Pages.SpacePageDevelop.DomainBindingModal.invalidDomainFormat',
        ),
      );
      return;
    }
    setSubmitLoading(true);
    if (editingDomain) {
      runUpdateDomain({ id: editingDomain.id, domain: newDomain.trim() });
    } else {
      runAddDomain({ projectId, domain: newDomain.trim() });
    }
  }, [newDomain, projectId, editingDomain, runAddDomain, runUpdateDomain]);

  // 处理删除域名
  const handleDeleteDomain = useCallback(
    (domain: DomainInfo) => {
      Modal.confirm({
        title: dict(
          'PC.Pages.SpacePageDevelop.DomainBindingModal.removeDomainTitle',
        ),
        icon: <ExclamationCircleFilled />,
        content: (
          <div>
            {dict(
              'PC.Pages.SpacePageDevelop.DomainBindingModal.removeDomainContent',
            )}{' '}
            <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              {domain.domain}
            </span>{' '}
            <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
              {dict(
                'PC.Pages.SpacePageDevelop.DomainBindingModal.removeDomainHint',
              )}
            </div>
          </div>
        ),
        okText: dict(
          'PC.Pages.SpacePageDevelop.DomainBindingModal.confirmRemove',
        ),
        okType: 'danger',
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: () => {
          runDeleteDomain({ id: domain.id });
        },
      });
    },
    [runDeleteDomain],
  );

  // 打开新增弹窗
  const handleOpenAdd = useCallback(() => {
    setEditingDomain(null);
    setNewDomain('');
    setIsModalOpen(true);
  }, []);

  // 打开编辑弹窗
  const handleOpenEdit = useCallback((domain: DomainInfo) => {
    setEditingDomain(domain);
    setNewDomain(domain.domain);
    setIsModalOpen(true);
  }, []);

  // 取消操作
  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingDomain(null);
    setNewDomain('');
  }, []);

  return (
    <>
      <Modal
        title={dict('PC.Pages.SpacePageDevelop.DomainBindingModal.title')}
        open={open}
        onCancel={onCancel}
        width={600}
        footer={null}
      >
        <div className={cx(styles['domain-binding-modal'])}>
          {/* CNAME 配置提示区域 */}
          <div className={cx(styles['cname-section'])}>
            <div className={cx(styles['cname-title'])}>
              {dict('PC.Pages.SpacePageDevelop.DomainBindingModal.cnameTitle')}
            </div>
            <div className={cx(styles['cname-item'])}>
              {/* <span className={cx(styles['cname-tag'], styles['cn-tag'])}>
                中国用户
              </span> */}
              <div className={cx(styles['cname-info'])}>
                <div className={cx(styles['cname-value'])}>
                  {dict(
                    'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameCnValue',
                  )}
                </div>
                <div className={cx(styles['cname-desc'])}>
                  {dict(
                    'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameCnDesc',
                  )}
                </div>
              </div>
            </div>
            <div className={cx(styles['cname-item'])}>
              {/* <span className={cx(styles['cname-tag'], styles['en-tag'])}>
                海外用户
              </span> */}
              <div className={cx(styles['cname-info'])}>
                <div className={cx(styles['cname-value'])}>
                  {dict(
                    'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameEnValue',
                  )}
                </div>
                <div className={cx(styles['cname-desc'])}>
                  {dict(
                    'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameEnDesc',
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 已绑定域名列表 */}
          <div className={cx(styles['domain-list-header'])}>
            <span className={cx(styles['header-title'])}>
              {dict(
                'PC.Pages.SpacePageDevelop.DomainBindingModal.boundDomains',
              )}
            </span>
            <span className={cx(styles['domain-count'])}>
              {dict(
                'PC.Pages.SpacePageDevelop.DomainBindingModal.domainCount',
              ).replace('{0}', String(domains.length))}
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
                  </div>
                  <div className={cx(styles['domain-actions'])}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenEdit(domain)}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleDeleteDomain(domain)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Spin>

          {/* 添加新域名按钮 - 保持常在 */}
          <Button
            className={cx(styles['add-domain-btn'])}
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleOpenAdd}
          >
            {dict('PC.Pages.SpacePageDevelop.DomainBindingModal.addDomain')}
          </Button>
        </div>
      </Modal>

      {/* 新增/修改域名弹窗 */}
      <Modal
        title={
          editingDomain
            ? dict('PC.Pages.SpacePageDevelop.DomainBindingModal.editDomain')
            : dict('PC.Pages.SpacePageDevelop.DomainBindingModal.addDomain')
        }
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        destroyOnHidden
      >
        <div style={{ padding: '20px 0' }}>
          <Input
            placeholder={dict(
              'PC.Pages.SpacePageDevelop.DomainBindingModal.domainInputPlaceholder',
            )}
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onPressEnter={handleSubmit}
          />
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            {dict(
              'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameResolveHint',
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DomainBindingModal;
