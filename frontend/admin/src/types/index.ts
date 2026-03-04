import React from 'react';

export interface NavItem {
  label: string;
  href: string;
}

export interface SocialLink {
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
}