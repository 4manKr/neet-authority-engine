'use client';

import React, { useState } from 'react';

const STATES = ['Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Other'];

export function LeadForm({ source, showBudget = false }: { source: string; showBudget?: boolean }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', neetScore: '', state: '', budget: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, neetScore: form.neetScore ? Number(form.neetScore) : undefined, source }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You! 🎉</h3>
        <p className="text-gray-600">Our counsellor will contact you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-1">Register for Free Counselling</h3>
      <p className="text-sm text-gray-500 mb-4">Fill in your details and our expert will call you.</p>

      <input type="text" required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      
      <input type="tel" required placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      
      <input type="email" required placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      
      <input type="number" placeholder="NEET Score (optional)" value={form.neetScore} onChange={(e) => setForm({ ...form, neetScore: e.target.value })}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      
      <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
        <option value="">Select State (optional)</option>
        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {showBudget && (
        <select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
          <option value="">Annual Budget Range</option>
          <option value="under-5L">Under ₹5 Lakhs/year</option>
          <option value="5L-15L">₹5 - 15 Lakhs/year</option>
          <option value="15L-30L">₹15 - 30 Lakhs/year</option>
          <option value="above-30L">Above ₹30 Lakhs/year</option>
        </select>
      )}

      <button type="submit" disabled={status === 'loading'}
        className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-base">
        {status === 'loading' ? 'Submitting...' : '📞 Get Free Counselling'}
      </button>

      {status === 'error' && <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>}
      <p className="text-xs text-gray-400 text-center">We respect your privacy. No spam, ever.</p>
    </form>
  );
}
