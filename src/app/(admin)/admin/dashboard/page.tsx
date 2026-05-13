'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  totalLeads: number;
  totalSubscribers: number;
  recentBlogs: any[];
  recentLeads: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => { if (data.success) setStats(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Blogs', value: stats.totalBlogs, icon: '📝', color: 'bg-blue-600' },
    { label: 'Published', value: stats.publishedBlogs, icon: '✅', color: 'bg-green-600' },
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', color: 'bg-purple-600' },
    { label: 'Total Leads', value: stats.totalLeads, icon: '👥', color: 'bg-amber-600' },
    { label: 'Subscribers', value: stats.totalSubscribers, icon: '📧', color: 'bg-pink-600' },
    { label: 'Drafts', value: stats.draftBlogs, icon: '📋', color: 'bg-gray-600' },
  ] : [];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-800 rounded-lg w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-gray-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/admin/blogs/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + New Blog
          </Link>
          <Link href="/admin/ai-generate" className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
            🤖 AI Generate
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{card.icon}</span>
              <span className={`w-2 h-2 rounded-full ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Blogs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Blogs</h2>
          <div className="space-y-3">
            {stats?.recentBlogs?.map((blog: any) => (
              <div key={blog._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{blog.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  blog.status === 'published' ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {blog.status}
                </span>
              </div>
            ))}
            {(!stats?.recentBlogs || stats.recentBlogs.length === 0) && (
              <p className="text-gray-500 text-sm py-4 text-center">No blogs yet</p>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Leads</h2>
          <div className="space-y-3">
            {stats?.recentLeads?.map((lead: any) => (
              <div key={lead._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-white">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400">
                  {lead.source}
                </span>
              </div>
            ))}
            {(!stats?.recentLeads || stats.recentLeads.length === 0) && (
              <p className="text-gray-500 text-sm py-4 text-center">No leads yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
