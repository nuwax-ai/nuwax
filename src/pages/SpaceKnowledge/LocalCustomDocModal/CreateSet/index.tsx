import ConditionRender from '@/components/ConditionRender';
import LabelStar from '@/components/LabelStar';
import SelectList from '@/components/custom/SelectList';
import { KNOWLEDGE_SEGMENT_IDENTIFIER_LIST } from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
import { KnowledgeSegmentIdentifierEnum } from '@/types/enums/library';
import type { CreateSetProps } from '@/types/interfaces/knowledge';
import { isNumber } from '@/utils/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建设置、分段设置
 */
const CreateSet: React.FC<CreateSetProps> = ({
  form,
  autoSegmentConfigFlag,
  onChoose,
}) => {
  const [segmentDelimiter, setSegmentDelimiter] =
    useState<KnowledgeSegmentIdentifierEnum>(
      KnowledgeSegmentIdentifierEnum.Line_Feed,
    );

  const handleChange = (value: React.Key) => {
    const _value = value as KnowledgeSegmentIdentifierEnum;
    setSegmentDelimiter(_value);
  };

  return (
    <>
      <div
        className={cx(
          styles['set-box'],
          'px-16',
          'py-16',
          'cursor-pointer',
          {
            [styles.active]: autoSegmentConfigFlag,
          },
          styles['mt-50'],
        )}
        onClick={() => onChoose(true)}
      >
        <h3>{dict('PC.Pages.SpaceKnowledge.CreateSet.autoSegmentClean')}</h3>
        <p>{dict('PC.Pages.SpaceKnowledge.CreateSet.autoSegmentCleanDesc')}</p>
      </div>
      <div
        className={cx(styles['set-box'], 'px-16', 'py-16', 'cursor-pointer', {
          [styles.active]: !autoSegmentConfigFlag,
        })}
        onClick={() => onChoose(false)}
      >
        <h3>{dict('PC.Pages.SpaceKnowledge.CreateSet.custom')}</h3>
        <p>{dict('PC.Pages.SpaceKnowledge.CreateSet.customDesc')}</p>
        <div
          className={cx({
            [styles['custom-set-hide']]: autoSegmentConfigFlag,
          })}
        >
          <div className={cx(styles['divider-horizontal'])} />
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              selectDelimiter: KnowledgeSegmentIdentifierEnum.Line_Feed,
              words: 800,
              overlaps: 10,
            }}
            requiredMark={customizeRequiredMark}
          >
            <Form.Item
              label={
                <LabelStar
                  label={dict(
                    'PC.Pages.SpaceKnowledge.CreateSet.segmentDelimiter',
                  )}
                />
              }
            >
              <Form.Item name="selectDelimiter" noStyle>
                <SelectList
                  className={cx({
                    [styles['mb-10']]:
                      segmentDelimiter ===
                      KnowledgeSegmentIdentifierEnum.Custom,
                  })}
                  value={segmentDelimiter}
                  onChange={handleChange}
                  options={KNOWLEDGE_SEGMENT_IDENTIFIER_LIST}
                />
              </Form.Item>
              <ConditionRender
                condition={
                  segmentDelimiter === KnowledgeSegmentIdentifierEnum.Custom
                }
              >
                <Form.Item
                  name="delimiter"
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: dict(
                        'PC.Pages.SpaceKnowledge.CreateSet.inputSegmentDelimiter',
                      ),
                    },
                  ]}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.SpaceKnowledge.CreateSet.segmentDelimiterPlaceholder',
                    )}
                  />
                </Form.Item>
              </ConditionRender>
            </Form.Item>
            <Form.Item
              name="words"
              label={dict('PC.Pages.SpaceKnowledge.CreateSet.segmentMaxLength')}
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Pages.SpaceKnowledge.CreateSet.inputRange100To5000',
                  ),
                },
                {
                  validator(_, value) {
                    if (
                      !value ||
                      (Number(value) >= 100 && Number(value) <= 5000)
                    ) {
                      return Promise.resolve();
                    }
                    if (value && !isNumber(value)) {
                      return Promise.reject(
                        new Error(
                          dict(
                            'PC.Pages.SpaceKnowledge.CreateSet.inputValidNumber',
                          ),
                        ),
                      );
                    }
                    return Promise.reject(
                      new Error(
                        dict(
                          'PC.Pages.SpaceKnowledge.CreateSet.segmentMaxLengthRange',
                        ),
                      ),
                    );
                  },
                },
              ]}
            >
              <Input
                placeholder={dict(
                  'PC.Pages.SpaceKnowledge.CreateSet.inputRange100To5000',
                )}
              />
            </Form.Item>
            <Form.Item
              name="overlaps"
              label={dict(
                'PC.Pages.SpaceKnowledge.CreateSet.segmentOverlapPercent',
              )}
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Pages.SpaceKnowledge.CreateSet.inputRange0To100',
                  ),
                },
                {
                  validator(_, value) {
                    if (
                      !value ||
                      (Number(value) >= 0 && Number(value) <= 100)
                    ) {
                      return Promise.resolve();
                    }
                    if (value && !isNumber(value)) {
                      return Promise.reject(
                        new Error(
                          dict(
                            'PC.Pages.SpaceKnowledge.CreateSet.inputValidNumber',
                          ),
                        ),
                      );
                    }
                    return Promise.reject(
                      new Error(
                        dict(
                          'PC.Pages.SpaceKnowledge.CreateSet.segmentOverlapRange',
                        ),
                      ),
                    );
                  },
                },
              ]}
            >
              <Input
                placeholder={dict(
                  'PC.Pages.SpaceKnowledge.CreateSet.inputRange0To100',
                )}
              />
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
};

export default CreateSet;
