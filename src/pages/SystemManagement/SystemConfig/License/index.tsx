import WorkspaceLayout from '@/components/WorkspaceLayout';
import useLicense from '@/hooks/useLicense';
import { dict } from '@/services/i18nRuntime';
import { MAX_LICENSE_FILE_BYTES } from '@/services/license';
import { UserService } from '@/services/userService';
import type {
  LicenseErrorKind,
  LicenseFeature,
  LicenseState,
} from '@/types/interfaces/license';
import { canExecuteLicenseFeature } from '@/utils/license';
import { UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  message,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const colors: Record<LicenseState, string> = {
  NOT_INSTALLED: 'default',
  VALID: 'green',
  EXPIRED: 'orange',
  INVALID: 'red',
};
// 领域枚举包含大写/下划线，错误类别包含连字符；翻译键末段须为 camelCase。
const stateKeys: Record<LicenseState, string> = {
  NOT_INSTALLED: 'notInstalled',
  VALID: 'valid',
  EXPIRED: 'expired',
  INVALID: 'invalid',
};
const errorKeys: Record<LicenseErrorKind, string> = {
  unavailable: 'unavailable',
  unauthenticated: 'unauthenticated',
  forbidden: 'forbidden',
  network: 'network',
  'invalid-response': 'invalidResponse',
};
const timeOf = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleString()
    : dict('PC.Common.Global.emptyPlaceholder');
};

export default function License() {
  const { hasPermission } = useModel('menuModel');
  const { userInfo } = useModel('userInfo');
  const account = userInfo || UserService.getUserInfoFromStorage();
  const accountKey = `${account?.tenantId || ''}:${account?.id || ''}`;
  const canQuery = hasPermission('license_query');
  const { state, controller } = useLicense({ accountKey, enabled: canQuery });
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<RcFile>();
  useEffect(() => {
    setOpen(false);
    setFile(undefined);
  }, [accountKey]);
  const snapshot = state.snapshot;
  const busy = state.status === 'loading';
  const canImport =
    canQuery &&
    hasPermission('license_import') &&
    state.providerAvailable &&
    state.importAvailable &&
    snapshot?.canImport === true &&
    !['forbidden', 'unauthenticated', 'unavailable'].includes(state.status);

  const importFile = async () => {
    if (!file || !canImport || busy) return;
    if (await controller.importLicense(file)) {
      message.success(dict('PC.Pages.License.importSuccess'));
      setOpen(false);
      setFile(undefined);
    }
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.License.title')}
      rightSlot={
        <Space>
          <Button
            disabled={!canQuery || state.operation === 'import'}
            loading={state.operation === 'read'}
            onClick={() => void controller.reload()}
          >
            {dict('PC.Common.Global.refresh')}
          </Button>
          {hasPermission('license_import') && (
            <Button disabled={!canImport || busy} onClick={() => setOpen(true)}>
              {dict('PC.Pages.License.importAction')}
            </Button>
          )}
        </Space>
      }
    >
      <div className={styles.container}>
        {!canQuery ? (
          <Alert
            showIcon
            type="error"
            message={dict('PC.Pages.License.noAccess')}
          />
        ) : (
          <>
            {state.error && (
              <Alert
                showIcon
                type="error"
                message={dict(
                  `PC.Pages.License.error.${errorKeys[state.error.kind]}`,
                )}
                description={
                  snapshot ? dict('PC.Pages.License.staleSnapshot') : undefined
                }
                action={
                  <Button onClick={() => void controller.reload()}>
                    {dict('PC.Pages.License.retry')}
                  </Button>
                }
              />
            )}
            {busy && (
              <Space role="status">
                <Spin />
                <span>{dict('PC.Pages.License.loading')}</span>
              </Space>
            )}
            {snapshot && (
              <>
                <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
                  <Descriptions.Item label={dict('PC.Pages.License.state')}>
                    <Tag color={colors[snapshot.state]}>
                      {dict(
                        `PC.Pages.License.state.${stateKeys[snapshot.state]}`,
                      )}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={dict('PC.Pages.License.subject')}>
                    {snapshot.subject || '--'}
                  </Descriptions.Item>
                  <Descriptions.Item label={dict('PC.Pages.License.maskedId')}>
                    {snapshot.maskedId || '--'}
                  </Descriptions.Item>
                  <Descriptions.Item label={dict('PC.Pages.License.validFrom')}>
                    {timeOf(snapshot.validFrom)}
                  </Descriptions.Item>
                  <Descriptions.Item label={dict('PC.Pages.License.expiresAt')}>
                    {timeOf(snapshot.expiresAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label={dict('PC.Pages.License.updatedAt')}>
                    {timeOf(snapshot.updatedAt)}
                  </Descriptions.Item>
                </Descriptions>
                <Typography.Title level={5}>
                  {dict('PC.Pages.License.features')}
                </Typography.Title>
                <Table<LicenseFeature>
                  rowKey="code"
                  pagination={false}
                  dataSource={[...snapshot.features]}
                  locale={{
                    emptyText: (
                      <Empty
                        description={dict('PC.Pages.License.noFeatures')}
                      />
                    ),
                  }}
                  columns={[
                    {
                      title: dict('PC.Pages.License.featureName'),
                      dataIndex: 'name',
                    },
                    {
                      title: dict('PC.Pages.License.featureState'),
                      render: (_, feature) => (
                        <Tag
                          color={
                            canExecuteLicenseFeature(state, feature.code)
                              ? 'green'
                              : 'default'
                          }
                        >
                          {dict(
                            canExecuteLicenseFeature(state, feature.code)
                              ? 'PC.Pages.License.featureEnabled'
                              : 'PC.Pages.License.featureUnavailable',
                          )}
                        </Tag>
                      ),
                    },
                    {
                      title: dict('PC.Pages.License.reason'),
                      dataIndex: 'reason',
                    },
                  ]}
                />
              </>
            )}
          </>
        )}
      </div>
      <Modal
        open={open}
        title={dict('PC.Pages.License.importAction')}
        onCancel={() => !busy && setOpen(false)}
        onOk={() => void importFile()}
        okText={dict('PC.Pages.License.confirmImport')}
        okButtonProps={{ disabled: !file || !canImport }}
        confirmLoading={state.operation === 'import'}
        closable={!busy}
        maskClosable={!busy}
        cancelButtonProps={{ disabled: busy }}
      >
        <Space direction="vertical" className={styles.importForm}>
          <Typography.Paragraph>
            {dict('PC.Pages.License.importHint')}
          </Typography.Paragraph>
          <Upload
            maxCount={1}
            disabled={busy}
            fileList={
              file
                ? [{ uid: file.uid, name: file.name, originFileObj: file }]
                : []
            }
            beforeUpload={(value) => {
              if (!value.size || value.size > MAX_LICENSE_FILE_BYTES) {
                message.error(dict('PC.Pages.License.fileInvalid'));
                return Upload.LIST_IGNORE;
              }
              setFile(value);
              return false;
            }}
            onRemove={() => {
              setFile(undefined);
              return true;
            }}
          >
            <Button icon={<UploadOutlined />}>
              {dict('PC.Pages.License.selectFile')}
            </Button>
          </Upload>
          {state.error && (
            <Alert
              type="error"
              showIcon
              message={dict(
                `PC.Pages.License.error.${errorKeys[state.error.kind]}`,
              )}
            />
          )}
        </Space>
      </Modal>
    </WorkspaceLayout>
  );
}
