import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isUp: boolean;
    label?: string;
  };
  icon: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
}
