import React from 'react';

export interface ResourceItem {
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export interface ResourceGridProps {
  resources: ResourceItem[];
}
