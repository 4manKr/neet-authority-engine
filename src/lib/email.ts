export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const from = process.env.EMAIL_FROM || 'NEET Blog AI <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email send failed (${res.status}): ${err.slice(0, 300)}`);
  }
}

export function buildApprovalEmail(
  siteUrl: string,
  blogs: Array<{ title: string; excerpt: string; category: string; token: string }>,
  date: string,
): string {
  const blogRows = blogs
    .map(
      (b, i) => `
      <div style="margin-bottom:28px;padding:20px 24px;background:#f8faff;border-radius:10px;border-left:4px solid #2563eb;">
        <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Blog ${i + 1} · ${b.category}</p>
        <h2 style="margin:0 0 8px;font-size:17px;color:#111827;line-height:1.4;">${b.title}</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">${b.excerpt}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <a href="${siteUrl}/blog/preview/${b.token}"
             style="display:inline-block;padding:9px 18px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:7px;font-size:13px;font-weight:600;">
            👁 Read Preview
          </a>
          <a href="${siteUrl}/api/blog/approve?token=${b.token}"
             style="display:inline-block;padding:9px 18px;background:#16a34a;color:#fff;text-decoration:none;border-radius:7px;font-size:13px;font-weight:600;">
            ✅ Approve &amp; Publish
          </a>
          <a href="${siteUrl}/api/blog/reject?token=${b.token}"
             style="display:inline-block;padding:9px 18px;background:#f1f5f9;color:#64748b;text-decoration:none;border-radius:7px;font-size:13px;font-weight:600;border:1px solid #e2e8f0;">
            ✕ Reject
          </a>
        </div>
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:28px 32px;">
      <p style="margin:0;font-size:12px;color:#93c5fd;text-transform:uppercase;letter-spacing:.08em;">Daily AI Blog Digest</p>
      <h1 style="margin:6px 0 0;font-size:22px;color:#fff;font-weight:700;">${blogs.length} blogs ready for review</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">${date}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:14px;color:#374151;">
        AI generated these blogs from today&apos;s trending NEET / medical news.
        Preview each one and click <strong>Approve &amp; Publish</strong> to generate images and go live.
      </p>
      ${blogRows}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        NEETCounselling.info · Automated Content Pipeline<br>
        These links expire once a blog is approved or rejected.
      </p>
    </div>
  </div>
</body>
</html>`;
}
