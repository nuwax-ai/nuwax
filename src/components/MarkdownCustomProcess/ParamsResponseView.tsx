/**
 * 通用工具「参数 / 结果」内联展开区（会话渲染升级）。
 *
 * 通用工具不命中终端/Diff/Plan/OpenUI 专属卡时,展开详情此前只能进
 * 「查看详情」弹窗;本区块把 result.input(参数)/result.data(结果)
 * 以行内 section 直出——字符串预格式化直出,对象/数组 JSON 美化,
 * 均带复制按钮。空值整段隐藏,由外层控制展开/收起。
 */
import CopyIconButton from '@/components/base/CopyIconButton';
import { dict } from '@/services/i18nRuntime';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 对象/数组的可读文本(JSON 美化);字符串原样返回 */
const toDisplayText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(value);
  }
};

interface DetailSectionProps {
  title: string;
  value: unknown;
}

/** 单个 section:标题行(复制)+ 内容(mono 预格式化,限高滚动) */
const DetailSection: React.FC<DetailSectionProps> = ({ title, value }) => {
  const text = toDisplayText(value);
  if (!text.trim()) return null;

  return (
    <div className={cx(styles['detail-section'])}>
      <div className={cx(styles['detail-section-header'])}>
        <span className={cx(styles['detail-section-title'])}>{title}</span>
        <CopyIconButton
          text={text}
          buttonType="text"
          className={cx(styles['detail-section-copy'])}
        />
      </div>
      <pre className={cx(styles['detail-section-body'])}>{text}</pre>
    </div>
  );
};

export interface ParamsResponseViewProps {
  params: Record<string, any> | null | undefined;
  response: unknown;
}

const ParamsResponseView: React.FC<ParamsResponseViewProps> = ({
  params,
  response,
}) => {
  const [paramsOpen, setParamsOpen] = useState(true);
  const [responseOpen, setResponseOpen] = useState(true);

  const hasParams =
    !!params && !(typeof params === 'object' && !Object.keys(params).length);
  const hasResponse =
    response !== null &&
    response !== undefined &&
    !(typeof response === 'object' && !Object.keys(response as object).length);
  if (!hasParams && !hasResponse) return null;

  const renderSection = (
    key: string,
    title: string,
    value: unknown,
    open: boolean,
    onToggle: () => void,
  ) => (
    <div key={key} className={cx(styles['detail-block'])}>
      <button
        type="button"
        className={cx(styles['detail-block-toggle'])}
        onClick={onToggle}
        aria-expanded={open}
      >
        {open ? <CaretDownOutlined /> : <CaretRightOutlined />}
        <span>{title}</span>
      </button>
      {open && <DetailSection title={title} value={value} />}
    </div>
  );

  return (
    <div className={cx(styles['params-response-view'])}>
      {hasParams &&
        renderSection(
          'params',
          dict('PC.Components.MarkdownCustomProcess.paramsTitle'),
          params,
          paramsOpen,
          () => setParamsOpen((v) => !v),
        )}
      {hasResponse &&
        renderSection(
          'response',
          dict('PC.Components.MarkdownCustomProcess.responseTitle'),
          response,
          responseOpen,
          () => setResponseOpen((v) => !v),
        )}
    </div>
  );
};

export default ParamsResponseView;
