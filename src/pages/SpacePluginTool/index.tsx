import CreateNewPlugin from '@/components/CreateNewPlugin';
import PluginAutoAnalysis from '@/components/PluginAutoAnalysis';
import PluginTryRunModal from '@/components/PluginTryRunModal';
import PublishComponentModal from '@/components/PublishComponentModal';
import VersionHistory from '@/components/VersionHistory';
import usePluginConfig from '@/hooks/usePluginConfig';
import { dict } from '@/services/i18nRuntime';
import { apiPluginHttpUpdate, apiPluginInfo } from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  CreateUpdateModeEnum,
  HttpContentTypeEnum,
  HttpMethodEnum,
} from '@/types/enums/common';
import type { PluginInfo } from '@/types/interfaces/plugin';
import { getActiveKeys } from '@/utils/deepNode';
import { Form } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';
import { useLocation, useModel, useParams, useRequest } from 'umi';
import PluginChatSession from './components/PluginChatSession';
import PluginHeader from './components/PluginHeader';
import PluginInputTable from './components/PluginInputTable';
import PluginOutputTable from './components/PluginOutputTable';
import PluginRequestConfigForm from './components/PluginRequestConfigForm';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 工作空间-组件库-测试插件组件（基于已有服务http接口创建）
 */
const SpacePluginTool: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const conversationId =
    Number(searchParams.get('conversationId')) || undefined;
  const hasConversationId = !!searchParams.get('conversationId');

  const [form] = Form.useForm();

  const {
    isModalOpen,
    setIsModalOpen,
    autoAnalysisOpen,
    setAutoAnalysisOpen,
    visible,
    setVisible,
    openModal,
    setOpenModal,
    pluginId,
    pluginInfo,
    setPluginInfo,
    openPlugin,
    setOpenPlugin,
    inputConfigArgs,
    setInputConfigArgs,
    outputConfigArgs,
    expandedRowKeys,
    setExpandedRowKeys,
    outputExpandedRowKeys,
    handleInputValue,
    handleOutputValue,
    handleInputAddChild,
    handleOutputAddChild,
    handleInputDel,
    handleOutputDel,
    handleConfirmUpdate,
    handleInputConfigAdd,
    handleOutputConfigAdd,
    handleOutputConfigArgs,
    handleConfirmPublishPlugin,
    handleUpdateSuccess,
    isClickSaveBtnRef,
  } = usePluginConfig();

  // 查询插件信息
  const { run: runPluginInfo } = useRequest(apiPluginInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: PluginInfo) => {
      setPluginInfo(result);
      if (result.config) {
        const { method, url, contentType, timeout, inputArgs, outputArgs } =
          result.config;
        // 初始化form
        form.setFieldsValue({
          method: method || HttpMethodEnum.GET,
          url,
          contentType: contentType || HttpContentTypeEnum.OTHER,
          timeout: timeout || 10,
        });
        // 默认展开的入参配置key
        const _expandedRowKeys = getActiveKeys(inputArgs);
        setExpandedRowKeys(_expandedRowKeys);
        setInputConfigArgs(inputArgs);
        // 设置出参配置以及展开key值
        handleOutputConfigArgs(outputArgs);
      }
    },
  });

  // 更新HTTP插件配置接口
  const { run: runUpdate } = useRequest(apiPluginHttpUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      handleUpdateSuccess();
    },
  });

  useEffect(() => {
    runPluginInfo(pluginId);
  }, [pluginId]);

  const { isConversationActive } = useModel('conversationInfo');
  const prevActiveRef = useRef(false);

  // 每次聊天对话完毕后，主动更新最新的插件配置信息
  useEffect(() => {
    if (prevActiveRef.current && !isConversationActive) {
      runPluginInfo(pluginId);
    }
    prevActiveRef.current = isConversationActive;
  }, [isConversationActive, runPluginInfo, pluginId]);

  // 保存插件信息
  const handleSave = async () => {
    const values = await form.validateFields();
    runUpdate({
      id: pluginId,
      config: {
        ...values,
        inputArgs: inputConfigArgs,
        outputArgs: outputConfigArgs,
      },
    });
  };

  // 单独点击保存按钮，提示保存成功
  const handleSaveConfig = async () => {
    isClickSaveBtnRef.current = true;
    await handleSave();
  };

  // 试运行
  const handleTryRun = async () => {
    await handleSave();
    setIsModalOpen(true);
  };

  // 发布事件
  const handlePublish = async () => {
    await handleSave();
    setOpenModal(true);
  };

  // 自动解析
  const handleAutoResolve = async () => {
    // 插件http模式下， 先保存配置，否则自动解析可能会因为url地址未填写或者未保存报错
    await handleSave();
    setAutoAnalysisOpen(true);
  };

  return (
    <div className={cx(styles['page-container'])}>
      <PluginHeader
        pluginInfo={pluginInfo as PluginInfo}
        onEdit={() => setOpenPlugin(true)}
        onToggleHistory={() => setVisible(!visible)}
        onSave={handleSaveConfig}
        onTryRun={handleTryRun}
        onPublish={handlePublish}
      />
      <div className={cx(styles['layout-wrapper'])}>
        {/* 左侧：调试聊天会话区域 */}
        {hasConversationId && (
          <div className={cx(styles['chat-section'])}>
            <PluginChatSession
              conversationId={conversationId}
              pluginInfo={pluginInfo as PluginInfo}
            />
          </div>
        )}

        {/* 右侧：原有的插件详情和配置表单内容区域 */}
        <div
          className={cx(
            styles['detail-section'],
            !hasConversationId ? styles['no-chat'] : undefined,
          )}
        >
          <div className={cx('flex', 'h-full')}>
            <div
              className={cx(
                styles.container,
                'flex',
                'flex-col',
                'flex-1',
                'h-full',
              )}
            >
              <div className={cx(styles['main-container'], 'scroll-container')}>
                <h3 className={cx(styles.title, 'mb-12')}>
                  {dict('PC.Pages.SpacePluginTool.requestConfig')}
                </h3>
                <PluginRequestConfigForm form={form} />
                <PluginInputTable
                  inputConfigArgs={inputConfigArgs}
                  expandedRowKeys={expandedRowKeys}
                  onInputValue={handleInputValue}
                  onInputAddChild={handleInputAddChild}
                  onInputDel={handleInputDel}
                  onInputConfigAdd={handleInputConfigAdd}
                />
                <PluginOutputTable
                  outputConfigArgs={outputConfigArgs}
                  outputExpandedRowKeys={outputExpandedRowKeys}
                  onOutputValue={handleOutputValue}
                  onOutputAddChild={handleOutputAddChild}
                  onOutputDel={handleOutputDel}
                  onOutputConfigAdd={handleOutputConfigAdd}
                  onAutoResolve={handleAutoResolve}
                />
                {/*试运行弹窗*/}
                <PluginTryRunModal
                  inputConfigArgs={inputConfigArgs}
                  inputExpandedRowKeys={expandedRowKeys}
                  pluginId={pluginId}
                  pluginName={pluginInfo?.name as string}
                  open={isModalOpen}
                  onCancel={() => setIsModalOpen(false)}
                />
                {/*自动解析弹窗组件*/}
                <PluginAutoAnalysis
                  inputConfigArgs={inputConfigArgs}
                  inputExpandedRowKeys={expandedRowKeys}
                  pluginId={pluginId}
                  pluginName={pluginInfo?.name as string}
                  open={autoAnalysisOpen}
                  onCancel={() => setAutoAnalysisOpen(false)}
                  onConfirm={handleOutputConfigArgs}
                />
              </div>
            </div>
            {/*插件发布弹窗*/}
            <PublishComponentModal
              mode={AgentComponentTypeEnum.Plugin}
              targetId={pluginId}
              spaceId={spaceId}
              category={pluginInfo?.category}
              open={openModal}
              onlyShowTemplate={false}
              // 取消发布
              onCancel={() => setOpenModal(false)}
              onConfirm={handleConfirmPublishPlugin}
            />
            {/*版本历史*/}
            <VersionHistory
              headerClassName={cx(styles['version-history-header'])}
              targetId={pluginId}
              targetName={pluginInfo?.name}
              targetType={AgentComponentTypeEnum.Plugin}
              permissions={pluginInfo?.permissions || []}
              visible={visible}
              onClose={() => setVisible(false)}
            />
            {/*修改插件弹窗*/}
            <CreateNewPlugin
              open={openPlugin}
              id={pluginInfo?.id}
              icon={pluginInfo?.icon}
              name={pluginInfo?.name}
              description={pluginInfo?.description}
              mode={CreateUpdateModeEnum.Update}
              onCancel={() => setOpenPlugin(false)}
              onConfirm={handleConfirmUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpacePluginTool;
