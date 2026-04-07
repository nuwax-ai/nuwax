import ParamsNameLabel from '@/components/ParamsNameLabel';
import { ARRAY_ITEM } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import useTryRun from '@/hooks/useTryRun';
import { dict } from '@/services/i18nRuntime';
import { apiPluginTest } from '@/services/plugin';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import type { PluginTryRunModalProps } from '@/types/interfaces/library';
import type { PluginTestResult } from '@/types/interfaces/plugin';
import { getNumbersOnly } from '@/utils/common';
import {
  CloseOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Input,
  message,
  Modal,
  Space,
  Table,
  TableColumnsType,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 试运行弹窗组件
const PluginTryRunModal: React.FC<PluginTryRunModalProps> = ({
  inputConfigArgs,
  inputExpandedRowKeys,
  pluginId,
  pluginName,
  open,
  onCancel,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  // 试运行结果
  const [result, setResult] = useState<string>('');
  const {
    handleInit,
    dataSource,
    handleDataSource,
    expandedRowKeys,
    handleInputValue,
    handleInputAddChild,
    handleInputDel,
  } = useTryRun();

  // 插件试运行接口
  const { run: runTest } = useRequest(apiPluginTest, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (res: PluginTestResult) => {
      setLoading(false);
      if (!res.success) {
        message.warning(res.error);
      } else {
        setResult(JSON.stringify(res.result, null, 2));
      }
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    handleInit(inputConfigArgs, inputExpandedRowKeys);
  }, [inputConfigArgs, inputExpandedRowKeys]);

  // 输入框值改变时触发, 如果是数字类型，需要过滤掉非数字字符，并转换为数字类型
  const handleChangeInputValue = (record: BindConfigWithSub, value: string) => {
    let _value: string | number = value;
    if (
      (record.dataType === DataTypeEnum.Integer ||
        record.dataType === DataTypeEnum.Number) &&
      value
    ) {
      _value =
        getNumbersOnly(value) === '' ? '' : Number(getNumbersOnly(value));
    }
    handleInputValue(record.key, 'bindValue', _value);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: dict('PC.Components.PluginTryRunModal.paramName'),
      dataIndex: 'name',
      key: 'name',
      className: 'flex',
      render: (_: string, record: BindConfigWithSub) => (
        <ParamsNameLabel
          require={record.require}
          paramName={record.name}
          paramType={record.dataType as DataTypeEnum}
        />
      ),
    },
    {
      title: dict('PC.Components.PluginTryRunModal.paramValue'),
      dataIndex: 'description',
      key: 'description',
      render: (_: string, record: BindConfigWithSub) => (
        <>
          {DataTypeEnum.Object === record.dataType ||
          DataTypeEnum.Array_Object === record.dataType ||
          record.dataType?.includes('Array') ? null : (
            <Input
              value={record.bindValue}
              onChange={(e) => handleChangeInputValue(record, e.target.value)}
              placeholder={dict(
                'PC.Components.PluginTryRunModal.pleaseInputParamValue',
              )}
            />
          )}
          <p className={cx(styles['param-desc'])}>{record.description}</p>
        </>
      ),
    },
    {
      title: dict('PC.Common.Global.operation'),
      key: 'action',
      width: 60,
      align: 'center',
      render: (_: null, record: BindConfigWithSub, index: number) => (
        <Space size="middle">
          {record.dataType?.includes('Array') ? (
            <ICON_ADD_TR
              className={cx('cursor-pointer')}
              onClick={() => handleInputAddChild(record)}
            />
          ) : record.name === ARRAY_ITEM && index !== 0 ? (
            // Array_Object时，第一项不能删除
            <DeleteOutlined onClick={() => handleInputDel(record.key)} />
          ) : null}
        </Space>
      ),
    },
  ];

  // 试运行
  const handleRunTest = () => {
    setResult('');
    setLoading(true);
    const params = handleDataSource(dataSource);
    runTest({
      pluginId,
      params,
    });
  };

  // 取消试运行
  const handleCancel = () => {
    setResult('');
    setLoading(false);
    onCancel();
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={handleCancel}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div
          className={cx(
            styles['inner-container'],
            'flex',
            'flex-col',
            'overflow-hide',
          )}
        >
          {/*header*/}
          <header
            className={cx(
              'flex',
              'content-between',
              'items-center',
              styles.header,
            )}
          >
            <h3>{dict('PC.Components.PluginTryRunModal.tryRun')}</h3>
            <CloseOutlined
              className={cx('cursor-pointer')}
              onClick={handleCancel}
            />
          </header>
          {/*内容区*/}
          <section
            className={cx('flex', 'flex-1', 'overflow-hide', styles.section)}
          >
            {/*左侧内容*/}
            <div className={cx('flex-1', 'flex', 'flex-col')}>
              <h3 className={cx(styles['p-title'])}>
                {pluginName}{' '}
                {dict('PC.Components.PluginTryRunModal.inputParams')}
              </h3>
              <Table<BindConfigWithSub>
                className={cx(styles['table-wrap'])}
                columns={inputColumns}
                dataSource={dataSource}
                pagination={false}
                virtual
                expandable={{
                  childrenColumnName: 'subArgs',
                  defaultExpandAllRows: true,
                  expandedRowKeys,
                  expandIcon: () => null,
                }}
                scroll={{
                  y: 450,
                }}
                footer={() => (
                  <div className={cx('text-right')}>
                    <Button
                      type="primary"
                      onClick={handleRunTest}
                      loading={loading}
                    >
                      {dict('PC.Components.PluginTryRunModal.run')}
                    </Button>
                  </div>
                )}
              />
            </div>
            {/*右侧内容*/}
            <div className={cx('flex-1', 'flex', 'flex-col', 'overflow-hide')}>
              <h3 className={cx(styles['p-title'])}>
                {pluginName}{' '}
                {dict('PC.Components.PluginTryRunModal.debugResult')}
              </h3>
              <div
                className={cx(
                  'flex-1',
                  'radius-6',
                  'overflow-hide',
                  styles['result-wrap'],
                )}
              >
                {loading ? (
                  <div
                    className={cx(
                      'h-full',
                      'flex',
                      'items-center',
                      'content-center',
                      styles['loading-box'],
                    )}
                  >
                    <LoadingOutlined />
                    <span>{dict('PC.Common.Global.loading')}</span>
                  </div>
                ) : result ? (
                  <div
                    className={cx(
                      'h-full',
                      'flex',
                      'flex-col',
                      'px-16',
                      'py-16',
                      'overflow-y',
                    )}
                  >
                    <pre>{result}</pre>
                  </div>
                ) : (
                  <div
                    className={cx(
                      'h-full',
                      'flex',
                      'items-center',
                      'content-center',
                    )}
                  >
                    {dict(
                      'PC.Components.PluginTryRunModal.debugResultPlaceholder',
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
          {/*footer*/}
          {/*<div*/}
          {/*  className={cx('flex', 'items-center', 'content-end', styles.footer)}*/}
          {/*>*/}
          {/*  <Checkbox>保存调试结果为工具使用示例</Checkbox>*/}
          {/*  <div className={cx(styles['divider-vertical'])} />*/}
          {/*  <Button type="primary" onClick={onCancel}>*/}
          {/*    完成*/}
          {/*  </Button>*/}
          {/*</div>*/}
        </div>
      )}
    ></Modal>
  );
};

export default PluginTryRunModal;
