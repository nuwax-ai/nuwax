/*
 * MentionList Component
 * @ mentions 下拉列表组件
 */

import { List } from 'antd';
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
  if (items.length === 0) {
    return (
      <div style={{ padding: '8px', color: '#999', textAlign: 'center' }}>
        未找到匹配项
      </div>
    );
  }

  return (
    <List
      size="small"
      dataSource={items}
      style={{
        maxHeight: '240px',
        overflowY: 'auto',
      }}
      renderItem={(item, index) => (
        <List.Item
          style={{
            cursor: 'pointer',
            backgroundColor:
              index === selectedIndex ? '#f0f0f0' : 'transparent',
            padding: '4px 8px',
          }}
          onClick={() => onSelect(item)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#1890ff' }}>@</span>
            <span>{item.label}</span>
            {item.type && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#999',
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
