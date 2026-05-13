'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BlogsManagementPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchBlogs = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await fetch(`/api/admin/blogs?${params}`);
    const data = await res.json();
    if (data.success) {
      setBlogs(data.data);
      setTotalPages(data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBlogs(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
    fetchBlogs();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Blog Posts</h1>
        <Link href="/admin/blogs/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + New Blog
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text" placeholder="Search blogs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <button type="submit" className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700">Search</button>
        </form>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-gray-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Category</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Views</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                <th className="text-right px-6 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td></tr>
                ))
              ) : blogs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No blogs found</td></tr>
              ) : blogs.map((blog) => (
                <tr key={blog._id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium truncate max-w-xs">{blog.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">/{blog.slug}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      blog.status === 'published' ? 'bg-green-900/50 text-green-400' :
                      blog.status === 'draft' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>{blog.status}</span>
                  </td>
                  <td className="px-4 py-4 text-gray-300 text-xs">{blog.category}</td>
                  <td className="px-4 py-4 text-gray-300">{blog.viewCount || 0}</td>
                  <td className="px-4 py-4 text-gray-500 text-xs">{new Date(blog.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/blogs/${blog._id}/edit`} className="text-blue-400 hover:text-blue-300 text-xs">Edit</Link>
                    <Link href={`/blog/${blog.slug}`} target="_blank" className="text-gray-400 hover:text-gray-300 text-xs">View</Link>
                    <button onClick={() => handleDelete(blog._id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-30">Previous</button>
          <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
