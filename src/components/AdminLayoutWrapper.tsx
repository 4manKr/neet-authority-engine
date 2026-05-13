'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    // Hide all public chrome (header, footer, sticky CTAs) on admin pages
    return <div className="admin-wrapper">{children}</div>;
  }

  return <>{children}</>;
}
