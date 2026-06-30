import LabelStar from '@/components/LabelStar';
import PluginConfigTitle from '@/components/PluginConfigTitle';
import { ICON_ADD_TR } from '@/constants/images.constants';
import { dataTypes } from '@/pages/Antv-X6/params';
import { dict } from '@/services/i18nRuntime';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import { CascaderChange, CascaderValue } from '@/utils';
import { DeleteOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Cascader, Checkbox, Input, Table } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from '../../index.less';

const cx = classNames.bind(styles);

export interface PluginOutputTableProps {
  outputConfigArgs: BindConfigWithSub[];
  outputExpandedRowKeys: React.Key[];
  onOutputValue: (key: string, field: string, value: any) => void;
  onOutputAddChild: (key: string) => void;
  onOutputDel: (key: string) => void;
  onOutputConfigAdd: () => void;
  onAutoResolve: () => void;
}

const PluginOutputTable: React.FC<PluginOutputTableProps> = ({
  outputConfigArgs,
  outputExpandedRowKeys,
  onOutputValue,
  onOutputAddChild,
  onOutputDel,
  onOutputConfigAdd,
  onAutoResolve,
}) => {
  const displayRender = (labels: string[]) => labels[labels.length - 1];

  const outputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: <LabelStar label={dict('PC.Pages.SpacePluginTool.paramName')} />,
      dataIndex: 'name',
      key: 'name',
      width: 430,
      className: 'flex items-center',
      render: (value, record) => (
        <Input
          placeholder={dict('PC.Pages.SpacePluginTool.inputParamName')}
          value={value}
          onChange={(e) => onOutputValue(record.key, 'name', e.target.value)}
        />
      ),
    },
    {
      title: (
        <LabelStar label={dict('PC.Pages.SpacePluginTool.paramDescription')} />
      ),
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => (
        <Input
          placeholder={dict('PC.Pages.SpacePluginTool.inputParamDescription')}
          onChange={(e) =>
            onOutputValue(record.key, 'description', e.target.value)
          }
          value={value}
        />
      ),
    },
    {
      title: <LabelStar label={dict('PC.Pages.SpacePluginTool.paramType')} />,
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (value, record) => (
        <Cascader
          allowClear={false}
          rootClassName={styles.select}
          options={dataTypes}
          expandTrigger="hover"
          displayRender={displayRender}
          defaultValue={CascaderValue(value)}
          onChange={(val) => {
            onOutputValue(record.key, 'dataType', CascaderChange(val));
          }}
          placeholder={dict('PC.Pages.SpacePluginTool.selectDataType')}
        />
      ),
    },
    {
      title: dict('PC.Pages.SpacePluginTool.enable'),
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            onOutputValue(record.key, 'enable', e.target.checked)
          }
        />
      ),
    },
    {
      title: dict('PC.Pages.SpacePluginTool.action'),
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, record) => {
        return (
          <div className="flex items-center content-end gap-4">
            {(DataTypeEnum.Object === record.dataType ||
              DataTypeEnum.Array_Object === record.dataType) && (
              <Button
                type="text"
                onClick={() => onOutputAddChild(record.key)}
                icon={<ICON_ADD_TR />}
              />
            )}
            <Button
              type="text"
              onClick={() => onOutputDel(record.key)}
              icon={<DeleteOutlined />}
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PluginConfigTitle
        title={dict('PC.Pages.SpacePluginTool.outputConfig')}
        onClick={onOutputConfigAdd}
        extra={
          <Button onClick={onAutoResolve}>
            {dict('PC.Pages.SpacePluginTool.autoAnalysis')}
          </Button>
        }
      />
      <Table<BindConfigWithSub>
        className={cx(styles['table-wrap'], 'overflow-hide')}
        columns={outputColumns}
        dataSource={outputConfigArgs}
        pagination={false}
        expandable={{
          childrenColumnName: 'subArgs',
          defaultExpandAllRows: true,
          expandedRowKeys: outputExpandedRowKeys,
          expandIcon: () => null,
        }}
      />
    </>
  );
};

export default PluginOutputTable;
