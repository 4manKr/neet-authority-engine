'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/blogs', label: 'Blogs', icon: '📝' },
  { href: '/admin/blogs/new', label: 'New Blog', icon: '➕' },
  { href: '/admin/ai-generate', label: 'AI Generate', icon: '🤖' },
  { href: '/admin/leads', label: 'Leads', icon: '👥' },
  { href: '/admin/media', label: 'Media', icon: '🖼️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Don't show sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-30">
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin/dashboard">
            <span className="text-xl font-black text-white tracking-tight">
              NEET<span className="text-blue-400">CMS</span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors">
            <span>🚪</span>
            Logout
          </button>
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 rounded-lg transition-colors mt-1">
            <span>🌐</span>
            View Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
