import {
  PLUGIN_INPUT_CONFIG,
  PLUGIN_OUTPUT_CONFIG,
} from '@/constants/space.constants';
import { DataTypeEnum, PublishStatusEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type {
  PluginHttpUpdateParams,
  PluginInfo,
} from '@/types/interfaces/plugin';
import {
  addChildNode,
  deleteNode,
  getActiveKeys,
  updateNodeField,
} from '@/utils/deepNode';
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
import React, { useState } from 'react';
import { useParams } from 'umi';
import { v4 as uuidv4 } from 'uuid';

const usePluginConfig = () => {
  const params = useParams();
  const pluginId = Number(params.pluginId);
  // 试运行弹窗
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  // 自动解析弹窗
  const [autoAnalysisOpen, setAutoAnalysisOpen] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  // 弹窗modal
  const [openModal, setOpenModal] = useState<boolean>(false);
  // 修改插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);
  // 插件信息
  const [pluginInfo, setPluginInfo] = useState<PluginInfo>();
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  // 出参配置 - 展开的行，控制属性
  const [outputExpandedRowKeys, setOutputExpandedRowKeys] = useState<
    React.Key[]
  >([]);
  // 入参配置
  const [inputConfigArgs, setInputConfigArgs] = useState<BindConfigWithSub[]>(
    [],
  );
  // 出参配置
  const [outputConfigArgs, setOutputConfigArgs] = useState<BindConfigWithSub[]>(
    [],
  );

  // 入参配置 - changeValue
  const handleInputValue = (
    key: React.Key,
    attr: string,
    value: string | number | boolean,
  ) => {
    const _inputConfigArgs = updateNodeField(inputConfigArgs, key, attr, value);
    setInputConfigArgs(_inputConfigArgs);
    // 数据类型
    if (attr === 'dataType') {
      // 设置默认展开行
      if (
        value === DataTypeEnum.Object ||
        value === DataTypeEnum.Array_Object
      ) {
        const _expandedRowKeys = [...expandedRowKeys, key];
        setExpandedRowKeys(_expandedRowKeys);
      } else if (expandedRowKeys.includes(key)) {
        const _expandedRowKeys = expandedRowKeys.filter((item) => item !== key);
        setExpandedRowKeys(_expandedRowKeys);
      }
    }
  };

  // 出参配置 - changeValue
  const handleOutputValue = (
    key: React.Key,
    attr: string,
    value: string | number | boolean,
  ) => {
    const _outputConfigArgs = updateNodeField(
      outputConfigArgs,
      key,
      attr,
      value,
    );
    setOutputConfigArgs(_outputConfigArgs);
    // 数据类型
    if (attr === 'dataType') {
      // 设置默认展开行
      if (
        value === DataTypeEnum.Object ||
        value === DataTypeEnum.Array_Object
      ) {
        const _outputExpandedRowKeys = [...outputExpandedRowKeys, key];
        setOutputExpandedRowKeys(_outputExpandedRowKeys);
      } else if (outputExpandedRowKeys.includes(key)) {
        const _outputExpandedRowKeys = outputExpandedRowKeys.filter(
          (item) => item !== key,
        );
        setOutputExpandedRowKeys(_outputExpandedRowKeys);
      }
    }
  };

  // 入参配置 - 新增参数
  const handleInputAddChild = (key: React.Key) => {
    const newNode = {
      key: uuidv4(),
      ...PLUGIN_INPUT_CONFIG,
    } as BindConfigWithSub;

    const _inputConfigArgs = addChildNode(inputConfigArgs, key, newNode);
    setInputConfigArgs(_inputConfigArgs);
    // 设置默认展开行
    const _expandedRowKeys = [...expandedRowKeys];
    if (!_expandedRowKeys.includes(key)) {
      _expandedRowKeys.push(key);
      setExpandedRowKeys(_expandedRowKeys);
    }
  };

  // 出参配置 - 新增参数
  const handleOutputAddChild = (key: React.Key) => {
    const newNode = {
      key: uuidv4(),
      ...PLUGIN_OUTPUT_CONFIG,
    } as BindConfigWithSub;

    const _outputConfigArgs = addChildNode(outputConfigArgs, key, newNode);
    setOutputConfigArgs(_outputConfigArgs);

    // 设置默认展开行
    const _outputExpandedRowKeys = [...outputExpandedRowKeys];
    if (!_outputExpandedRowKeys.includes(key)) {
      _outputExpandedRowKeys.push(key);
      setOutputExpandedRowKeys(_outputExpandedRowKeys);
    }
  };

  // 出参配置删除操作
  const handleInputDel = (key: React.Key) => {
    const _inputConfigArgs = deleteNode(inputConfigArgs, key);
    setInputConfigArgs(_inputConfigArgs);
  };

  // 出参配置删除操作
  const handleOutputDel = (key: React.Key) => {
    const _outputConfigArgs = deleteNode(outputConfigArgs, key);
    setOutputConfigArgs(_outputConfigArgs);
  };

  // 修改插件，更新信息
  const handleConfirmUpdate = (info: PluginHttpUpdateParams) => {
    const { icon, name, description } = info;
    const _pluginInfo = cloneDeep(pluginInfo) as PluginInfo;
    _pluginInfo.icon = icon;
    _pluginInfo.name = name;
    _pluginInfo.description = description;
    setPluginInfo(_pluginInfo);
    setOpenPlugin(false);
  };

  // 入参配置新增操作
  const handleInputConfigAdd = () => {
    const _inputConfigArgs = cloneDeep(inputConfigArgs) || [];
    _inputConfigArgs.push({
      key: uuidv4(),
      ...PLUGIN_INPUT_CONFIG,
    } as BindConfigWithSub);
    setInputConfigArgs(_inputConfigArgs);
  };

  // 出参配置新增操作
  const handleOutputConfigAdd = () => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs) || [];
    _outputConfigArgs.push({
      key: uuidv4(),
      ...PLUGIN_OUTPUT_CONFIG,
    } as BindConfigWithSub);
    setOutputConfigArgs(_outputConfigArgs);
  };

  // 设置出参配置以及展开key值
  const handleOutputConfigArgs = (list: BindConfigWithSub[]) => {
    // 默认展开的出参配置key
    const _outputExpandedRowKeys = getActiveKeys(list);
    setOutputExpandedRowKeys(_outputExpandedRowKeys);
    setOutputConfigArgs(list);
  };

  // 发布插件
  const handleConfirmPublishPlugin = () => {
    setOpenModal(false);
    // 同步发布时间和修改时间
    const time = moment().toISOString();
    // 更新插件配置信息
    const _pluginInfo = {
      ...pluginInfo,
      publishDate: time,
      modified: time,
      publishStatus: PublishStatusEnum.Published,
    } as PluginInfo;
    setPluginInfo(_pluginInfo);
  };

  return {
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
    setOutputConfigArgs,
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
  };
};

export default usePluginConfig;
