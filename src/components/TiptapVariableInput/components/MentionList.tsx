/*
 * MentionList Component
 * @ mentions 下拉列表组件
 */

import { List, theme } from 'antd';
import React from 'react';
import type { MentionItem } from '../types';

interface MentionListProps {
  items: MentionItem[];
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
}

/**
 * Mentions 下拉列表组件
 */
const MentionList: React.FC<MentionListProps> = ({
  items,
  selectedIndex,
  onSelect,
}) => {
  const { token } = theme.useToken();

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: token.paddingSM,
          color: token.colorTextTertiary,
          textAlign: 'center',
        }}
      >
        未找到匹配项
      </div>
    );
  }

  return (
    <List
      size="small"
      dataSource={items}
      style={{
        maxHeight: `${(token.controlHeight || 32) * 7.5}px`, // 约 240px，基于 controlHeight
        overflowY: 'auto',
      }}
      renderItem={(item, index) => (
        <List.Item
          style={{
            cursor: 'pointer',
            backgroundColor:
              index === selectedIndex ? token.colorInfoBg : 'transparent',
            padding: `${token.paddingXXS}px ${token.paddingSM}px`,
          }}
          onClick={() => onSelect(item)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = token.colorFillSecondary;
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: token.marginSM,
            }}
          >
            <span style={{ color: token.colorInfo }}>@</span>
            <span>{item.label}</span>
            {item.type && (
              <span
                style={{
                  fontSize: token.fontSizeSM,
                  color: token.colorTextTertiary,
                  marginLeft: 'auto',
                }}
              >
                {item.type}
              </span>
            )}
          </div>
        </List.Item>
      )}
    />
  );
};

export default MentionList;
