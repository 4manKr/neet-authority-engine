'use client';

import React, { useEffect, useState } from 'react';

export default function LeadsManagementPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sourceFilter, setSourceFilter] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (sourceFilter) params.set('source', sourceFilter);

    const res = await fetch(`/api/admin/leads?${params}`);
    const data = await res.json();
    if (data.success) {
      setLeads(data.data);
      setTotalPages(data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [page, sourceFilter]);

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'NEET Rank', 'Category', 'Source', 'State', 'Date'];
    const rows = leads.map(l => [l.name, l.email, l.phone, l.neetRank || '', l.category || '', l.source, l.state || '', new Date(l.createdAt).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Leads</h1>
        <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
          📥 Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Sources</option>
          <option value="rank-predictor">Rank Predictor</option>
          <option value="free-counselling">Free Counselling</option>
          <option value="book-consultation">Book Consultation</option>
          <option value="blog-pdf">Blog PDF</option>
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Name', 'Email', 'Phone', 'NEET Rank', 'Category', 'Source', 'State', 'Date'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td></tr>
                ))
              ) : leads.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No leads found</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white">{lead.name}</td>
                  <td className="px-4 py-3 text-gray-300">{lead.email}</td>
                  <td className="px-4 py-3 text-gray-300">{lead.phone}</td>
                  <td className="px-4 py-3 text-gray-300">{lead.neetRank || '-'}</td>
                  <td className="px-4 py-3 text-gray-300">{lead.category || '-'}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded-full">{lead.source}</span></td>
                  <td className="px-4 py-3 text-gray-300">{lead.state || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
