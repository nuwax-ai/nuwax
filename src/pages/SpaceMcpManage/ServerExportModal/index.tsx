import copyImage from '@/assets/images/copy.png';
import Loading from '@/components/custom/Loading';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import {
  apiMcpServerConfigExport,
  apiMcpServerConfigRefresh,
} from '@/services/mcp';
import { ServerExportModalProps } from '@/types/interfaces/mcp';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const { confirm } = Modal;

/**
 * 服务导出弹窗
 */
const ServerExportModal: React.FC<ServerExportModalProps> = ({
  mcpId,
  name,
  open,
  onCancel,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<string>('');

  // 处理导出结果
  const handleSuccessResult = (result: string) => {
    try {
      if (result) {
        // 格式化json字符串
        const _result = JSON.parse(result);
        const configString = JSON.stringify(_result, null, 2);
        setConfig(configString);
      }
    } catch {
      setConfig(result);
    }
    setLoading(false);
  };

  // MCP服务导出
  const { run: runMcpConfig } = useRequest(apiMcpServerConfigExport, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: string) => {
      handleSuccessResult(result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // MCP服务重新生成配置
  const { run: runMcpReConfig } = useRequest(apiMcpServerConfigRefresh, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: string) => {
      handleSuccessResult(result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 确认重新生成配置
  const confirmRebuildConfig = () => {
    setLoading(true);
    runMcpReConfig(mcpId);
  };

  // 重新生成配置
  const handleRebuildConfig = () => {
    confirm({
      title: dict('PC.Pages.SpaceMcpManage.confirmRebuildConfig'),
      icon: <ExclamationCircleFilled />,
      content: name,
      okText: dict('PC.Common.Global.confirm'),
      maskClosable: true,
      cancelText: dict('PC.Common.Global.cancel'),
      onOk() {
        confirmRebuildConfig();
      },
    });
  };

  useEffect(() => {
    if (open && mcpId) {
      setLoading(true);
      runMcpConfig(mcpId);
    } else {
      setLoading(false);
      setConfig('');
    }
  }, [open, mcpId]);

  const handleCopy = () => {
    message.success(dict('PC.Toast.Global.copiedSuccessfully'));
  };

  return (
    <Modal
      width={560}
      title={`${name}-${dict('PC.Pages.SpaceMcpManage.serviceExportTitle')}`}
      classNames={{
        content: cx(styles.container),
        header: cx(styles.container),
        body: cx(styles.container),
      }}
      open={open}
      destroyOnHidden
      footer={null}
      onCancel={onCancel}
    >
      <h5 className={cx(styles.title)}>
        {dict('PC.Pages.SpaceMcpManage.configService')}
      </h5>
      <div className={cx(styles.desc, 'flex', 'items-center')}>
        <span>{dict('PC.Pages.SpaceMcpManage.configCopyTip')}</span>
        <Button
          type="link"
          className={cx(styles['rebuild-config'])}
          onClick={handleRebuildConfig}
        >
          {dict('PC.Pages.SpaceMcpManage.rebuildConfig')}
        </Button>
      </div>
      <div className={cx(styles['config-box'], 'relative')}>
        {loading ? (
          <Loading className={styles['loading-box']} />
        ) : (
          <>
            <CopyToClipboard text={config} onCopy={handleCopy}>
              <TooltipIcon
                title={dict('PC.Common.Global.copy')}
                icon={
                  <img className={styles['copy-img']} src={copyImage} alt="" />
                }
                className={styles['copy-box']}
              />
            </CopyToClipboard>
            <pre>{config}</pre>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ServerExportModal;
