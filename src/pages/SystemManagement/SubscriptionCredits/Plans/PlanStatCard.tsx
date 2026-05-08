import React from 'react';

interface PlanStatCardProps {
  title: string;
  value: React.ReactNode;
}

const PlanStatCard: React.FC<PlanStatCardProps> = ({ title, value }) => {
  return (
    <div
      style={{
        borderRadius: 12,
        background: '#fff',
        padding: '18px 20px',
        border: '1px solid #f0f0f0',
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: '#8c8c8c',
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 34, fontWeight: 600, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
};

export default PlanStatCard;
