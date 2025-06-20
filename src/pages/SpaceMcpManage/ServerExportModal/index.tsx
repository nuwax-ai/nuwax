import Loading from '@/components/Loading';
import { apiMcpServerConfigExport } from '@/services/mcp';
import { Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 服务导出弹窗组件属性
export interface ServerExportModalProps {
  mcpId: number;
  name: string; // 服务名称
  open: boolean;
  onCancel: () => void;
}

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
  // const [config, setConfig] = useState<string>('');

  // MCP服务导出
  const { run: runMcpConfig } = useRequest(apiMcpServerConfigExport, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: string) => {
      console.log(result);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    if (open && mcpId) {
      setLoading(true);
      runMcpConfig(mcpId);
    }
  }, [open, mcpId]);

  return (
    <Modal
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
      {loading ? (
        <Loading />
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex-1 flex flex-col content-around overflow-hide">
            <h3 className="text-ellipsis">{name}</h3>
            <p className="text-ellipsis">导出服务配置</p>
          </div>
          <div className="flex flex-col items-center"></div>
        </div>
      )}
    </Modal>
  );
};

export default ServerExportModal;
