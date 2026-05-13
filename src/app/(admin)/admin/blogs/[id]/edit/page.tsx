'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlogEditorForm } from '@/components/admin/BlogEditorForm';
import { use } from 'react';

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/blogs/${id}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setBlog(data.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        router.push('/admin/blogs');
      } else {
        alert(result.error || 'Failed to update blog');
      }
    } catch {
      alert('Error updating blog');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-gray-800 rounded-xl" /></div>;
  }

  if (!blog) {
    return <div className="p-8 text-red-400">Blog not found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Edit Blog Post</h1>
      <BlogEditorForm initialData={blog} onSave={handleSave} saving={saving} />
    </div>
  );
}
