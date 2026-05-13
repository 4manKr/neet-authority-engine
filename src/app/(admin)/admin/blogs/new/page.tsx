'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlogEditorForm } from '@/components/admin/BlogEditorForm';

export default function NewBlogPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        router.push('/admin/blogs');
      } else {
        alert(result.error || 'Failed to create blog');
      }
    } catch {
      alert('Error creating blog');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Create New Blog Post</h1>
      <BlogEditorForm onSave={handleSave} saving={saving} />
    </div>
  );
}
