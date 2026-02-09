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
      message.success('添加成功');
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
      message.success('修改成功');
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

  // 处理提交（新增或修改）
  const handleSubmit = useCallback(() => {
    if (!newDomain.trim()) {
      message.warning('请输入域名');
      return;
    }
    // 常规域名格式验证
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain.trim())) {
      message.warning('请输入有效的域名格式');
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
        title: '移除域名绑定',
        icon: <ExclamationCircleFilled />,
        content: (
          <div>
            确定要移除域名{' '}
            <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              {domain.domain}
            </span>{' '}
            的绑定吗？
            <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
              移除后，用户将无法通过该域名访问此项目。需重新绑定并解析。
            </div>
          </div>
        ),
        okText: '确认移除',
        okType: 'danger',
        cancelText: '取消',
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
        title="域名绑定管理"
        open={open}
        onCancel={onCancel}
        width={600}
        footer={null}
      >
        <div className={cx(styles['domain-binding-modal'])}>
          {/* CNAME 配置提示区域 */}
          <div className={cx(styles['cname-section'])}>
            <div className={cx(styles['cname-title'])}>
              请将域名解析到以下 CNAME 地址（二选一）
            </div>
            <div className={cx(styles['cname-item'])}>
              <span className={cx(styles['cname-tag'], styles['cn-tag'])}>
                中国用户
              </span>
              <div className={cx(styles['cname-info'])}>
                <div className={cx(styles['cname-value'])}>
                  cn-cname.nuwax.com
                </div>
                <div className={cx(styles['cname-desc'])}>
                  对中国用户提供服务，需有 ICP 备案
                </div>
              </div>
            </div>
            <div className={cx(styles['cname-item'])}>
              <span className={cx(styles['cname-tag'], styles['en-tag'])}>
                海外用户
              </span>
              <div className={cx(styles['cname-info'])}>
                <div className={cx(styles['cname-value'])}>
                  en-cname.nuwax.com
                </div>
                <div className={cx(styles['cname-desc'])}>
                  对海外用户提供服务，请遵守你所服务国家或地区的法律法规
                </div>
              </div>
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
            添加新域名
          </Button>
        </div>
      </Modal>

      {/* 新增/修改域名弹窗 */}
      <Modal
        title={editingDomain ? '修改域名' : '添加新域名'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <div style={{ padding: '20px 0' }}>
          <Input
            placeholder="请输入域名，如 example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onPressEnter={handleSubmit}
          />
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            请确保域名已完成 CNAME 解析
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DomainBindingModal;
