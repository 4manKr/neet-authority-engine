'use client';

export default function PreviewError({ error }: { error: Error }) {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#fff1f2', minHeight: '100vh' }}>
      <h2 style={{ color: '#dc2626' }}>Preview Error</h2>
      <pre style={{ background: '#fee2e2', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {error?.message || 'Unknown error'}
      </pre>
      {error?.stack && (
        <pre style={{ background: '#f3f4f6', padding: 16, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 16 }}>
          {error.stack}
        </pre>
      )}
    </div>
  );
}
