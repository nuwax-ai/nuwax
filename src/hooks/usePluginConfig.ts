import {
  PLUGIN_INPUT_CONFIG,
  PLUGIN_OUTPUT_CONFIG,
} from '@/constants/space.contants';
import { apiPluginConfigHistoryList } from '@/services/plugin';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { PluginInfo } from '@/types/interfaces/plugin';
import type { HistoryData } from '@/types/interfaces/space';
import cloneDeep from 'lodash/cloneDeep';
import { useState } from 'react';
import { useMatch, useRequest } from 'umi';

const usePluginConfig = () => {
  const match = useMatch('/space/:spaceId/plugin/:pluginId');
  const matchCode = useMatch('/space/:spaceId/plugin/:pluginId/cloud-tool');
  const { pluginId } = match?.params || matchCode?.params;
  // 修改插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);
  // 插件信息
  const [pluginInfo, setPluginInfo] = useState<PluginInfo>();
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  // 出参配置 - 展开的行，控制属性
  const [outputExpandedRowKeys, setOutputExpandedRowKeys] = useState<string[]>(
    [],
  );
  // 历史版本数据
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  // 入参配置
  const [inputConfigArgs, setInputConfigArgs] = useState<BindConfigWithSub[]>(
    [],
  );
  // 出参配置
  const [outputConfigArgs, setOutputConfigArgs] = useState<BindConfigWithSub[]>(
    [],
  );

  // 查询插件历史配置信息接口
  const { run: runHistory } = useRequest(apiPluginConfigHistoryList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: HistoryData[]) => {
      setHistoryData(result);
    },
  });

  // 入参配置 - changeValue
  const handleInputValue = (
    index: number,
    record: BindConfigWithSub,
    attr: string,
    value: string | boolean,
  ) => {
    const _inputConfigArgs = cloneDeep(inputConfigArgs);
    // 第一级
    if (_inputConfigArgs[index]?.key === record.key) {
      _inputConfigArgs[index][attr] = value;
    } else {
      // 子级
      const f_index = _inputConfigArgs.findIndex((item) => {
        const childIndex = item.children?.findIndex(
          (childItem) => childItem?.key === record.key,
        );
        return childIndex > -1;
      });
      _inputConfigArgs[f_index].children[index][attr] = value;
    }
    setInputConfigArgs(_inputConfigArgs);
  };

  // 出参配置 - changeValue
  const handleOutputValue = (
    index: number,
    record: BindConfigWithSub,
    attr: string,
    value: string | boolean,
  ) => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    // 第一级
    if (_outputConfigArgs[index]?.key === record.key) {
      _outputConfigArgs[index][attr] = value;
    } else {
      // 子级
      const f_index = _outputConfigArgs.findIndex((item) => {
        const childIndex = item.children?.findIndex(
          (childItem) => childItem?.key === record.key,
        );
        return childIndex > -1;
      });
      _outputConfigArgs[f_index].children[index][attr] = value;
    }
    setOutputConfigArgs(_outputConfigArgs);
  };

  // 入参配置 - 新增参数
  const handleInputAddChild = (index: number) => {
    const _inputConfigArgs = cloneDeep(inputConfigArgs);
    if (!_inputConfigArgs[index]?.children) {
      _inputConfigArgs[index].children = [];
    }
    _inputConfigArgs[index].children.push({
      key: Math.random(),
      ...PLUGIN_INPUT_CONFIG,
    });
    setInputConfigArgs(_inputConfigArgs);
    // 设置默认展开行
    const _expandedRowKeys = [...expandedRowKeys];
    if (!_expandedRowKeys.includes(_inputConfigArgs[index].key)) {
      _expandedRowKeys.push(_inputConfigArgs[index].key as string);
      setExpandedRowKeys(_expandedRowKeys);
    }
  };

  // 出参配置 - 新增参数
  const handleOutputAddChild = (index: number) => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    if (!_outputConfigArgs[index]?.children) {
      _outputConfigArgs[index].children = [];
    }
    _outputConfigArgs[index].children.push({
      key: Math.random(),
      ...PLUGIN_OUTPUT_CONFIG,
    });
    setOutputConfigArgs(_outputConfigArgs);
    // 设置默认展开行
    const _outputExpandedRowKeys = [...outputExpandedRowKeys];
    if (!_outputExpandedRowKeys.includes(_outputConfigArgs[index].key)) {
      _outputExpandedRowKeys.push(_outputConfigArgs[index].key as string);
      setOutputExpandedRowKeys(_outputExpandedRowKeys);
    }
  };

  // 出参配置删除操作
  const handleInputDel = (index: number, record: BindConfigWithSub) => {
    const _inputConfigArgs = cloneDeep(inputConfigArgs);
    // 第一级
    if (_inputConfigArgs[index]?.key === record.key) {
      _inputConfigArgs.splice(index, 1);
    } else {
      // 子级
      const f_index = _inputConfigArgs.findIndex((item) => {
        const childIndex = item.children?.findIndex(
          (childItem) => childItem?.key === record.key,
        );
        return childIndex > -1;
      });
      _inputConfigArgs[f_index].children.splice(index, 1);
    }
    setInputConfigArgs(_inputConfigArgs);
  };

  // 出参配置删除操作
  const handleOutputDel = (index: number, record: BindConfigWithSub) => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    // 第一级
    if (_outputConfigArgs[index]?.key === record.key) {
      _outputConfigArgs.splice(index, 1);
    } else {
      // 子级
      const f_index = _outputConfigArgs.findIndex((item) => {
        const childIndex = item.children?.findIndex(
          (childItem) => childItem?.key === record.key,
        );
        return childIndex > -1;
      });
      _outputConfigArgs[f_index].children.splice(index, 1);
    }
    setOutputConfigArgs(_outputConfigArgs);
  };

  // 修改插件，更新信息
  const handleConfirmUpdate = (info: PluginInfo) => {
    const { icon, name, description } = info;
    const _pluginInfo = cloneDeep(pluginInfo);
    _pluginInfo.icon = icon;
    _pluginInfo.name = name;
    _pluginInfo.description = description;
    setPluginInfo(_pluginInfo);
    setOpenPlugin(false);
  };

  // 入参配置新增操作
  const handleInputConfigAdd = () => {
    const _inputConfigArgs = cloneDeep(inputConfigArgs);
    _inputConfigArgs.push({
      key: Math.random(),
      ...PLUGIN_INPUT_CONFIG,
    });
    setInputConfigArgs(_inputConfigArgs);
  };

  // 出参配置新增操作
  const handleOutputConfigAdd = () => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    _outputConfigArgs.push({
      key: Math.random(),
      ...PLUGIN_OUTPUT_CONFIG,
    });
    setOutputConfigArgs(_outputConfigArgs);
  };

  return {
    runHistory,
    pluginId,
    pluginInfo,
    setPluginInfo,
    openPlugin,
    setOpenPlugin,
    historyData,
    inputConfigArgs,
    setInputConfigArgs,
    outputConfigArgs,
    setOutputConfigArgs,
    expandedRowKeys,
    setExpandedRowKeys,
    outputExpandedRowKeys,
    setOutputExpandedRowKeys,
    handleInputValue,
    handleOutputValue,
    handleInputAddChild,
    handleOutputAddChild,
    handleInputDel,
    handleOutputDel,
    handleConfirmUpdate,
    handleInputConfigAdd,
    handleOutputConfigAdd,
  };
};

export default usePluginConfig;
