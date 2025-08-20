import copyImage from '@/assets/images/copy.png';
import Loading from '@/components/custom/Loading';
import TooltipIcon from '@/components/custom/TooltipIcon';
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
      title: '您确定要重新生成配置吗?',
      icon: <ExclamationCircleFilled />,
      content: name,
      okText: '确定',
      maskClosable: true,
      cancelText: '取消',
      onOk() {
        confirmRebuildConfig();
      },
    });
  };

  useEffect(() => {
    if (open && mcpId) {
      setLoading(true);
      runMcpConfig(mcpId);
    }
  }, [open, mcpId]);

  const handleCopy = () => {
    message.success('复制成功');
  };

  return (
    <Modal
      width={560}
      title={`${name}-服务导出管理`}
      classNames={{
        content: cx(styles.container),
        header: cx(styles.container),
        body: cx(styles.container),
      }}
      open={open}
      destroyOnClose
      footer={null}
      onCancel={onCancel}
    >
      <h5 className={cx(styles.title)}>配置服务</h5>
      <div className={cx(styles.desc, 'flex', 'items-center')}>
        <span>
          复制以下配置，可以在任意支持mcp的客户端中使用，若有需要你可以点击
        </span>
        <Button
          type="link"
          className={cx(styles['rebuild-config'])}
          onClick={handleRebuildConfig}
        >
          重新生成配置
        </Button>
      </div>
      <div className={cx(styles['config-box'], 'relative')}>
        {loading ? (
          <Loading className={styles['loading-box']} />
        ) : (
          <>
            <CopyToClipboard text={config} onCopy={handleCopy}>
              <TooltipIcon
                title="复制"
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
