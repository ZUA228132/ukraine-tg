'use client';
import { useEffect, useMemo, useState } from 'react';

function useInitData() {
  return useMemo(() => (typeof window !== 'undefined' ? (window as any)?.Telegram?.WebApp?.initData || '' : ''), []);
}

async function api(path: string, initData: string, opts: RequestInit = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'x-tg-initdata': initData, 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function VerifyPage() {
  const initData = useInitData();
  const [me, setMe] = useState<any>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [docPath, setDocPath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (initData) api('/api/auth/me', initData, { method: 'POST' }).then(setMe).catch(e=>setErr(String(e))); }, [initData]);
  useEffect(() => { if (initData) api('/api/me/verifications', initData).then(r=>setItems(r.items)).catch(()=>{}); }, [initData, submitting]);

  async function requestUpload(kind: 'video'|'doc', file: File) {
    const r = await api('/api/upload-url', initData, { method: 'POST', body: JSON.stringify({ kind, filename: file.name }) });
    const put = await fetch(r.uploadUrl, { method: 'PUT', body: file });
    if (!put.ok) throw new Error('upload failed');
    return r.path as string;
  }

  async function onSubmit() {
    if (!videoPath || !docPath) return;
    setSubmitting(true);
    try {
      await api('/api/submit', initData, { method: 'POST', body: JSON.stringify({ videoPath, docPath }) });
      setVideoPath(null); setDocPath(null);
    } catch (e:any) { setErr(String(e)); } finally { setSubmitting(false); }
  }

  return (
    <main className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Verification</h1>
      {me && <div className="opacity-70 text-sm">Hello, {me.first_name}</div>}
      {err && <div className="p-3 rounded bg-red-900/40 border border-red-600 text-sm">{err}</div>}

      <section className="space-y-2">
        <label className="block font-semibold">Upload selfie video</label>
        <input className="block w-full" type="file" accept="video/*"
          onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const p = await requestUpload('video', f); setVideoPath(p); }} />
        {videoPath && <p className="text-sm">Uploaded: <code>{videoPath}</code></p>}
      </section>

      <section className="space-y-2">
        <label className="block font-semibold">Upload document</label>
        <input className="block w-full" type="file" accept="image/*,application/pdf"
          onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const p = await requestUpload('doc', f); setDocPath(p); }} />
        {docPath && <p className="text-sm">Uploaded: <code>{docPath}</code></p>}
      </section>

      <button disabled={!videoPath || !docPath || submitting} onClick={onSubmit}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-40">
        {submitting ? 'Submitting…' : 'Submit'}
      </button>

      <hr className="border-white/20" />

      <section>
        <h2 className="font-semibold mb-2">My submissions</h2>
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="border border-white/20 p-2 rounded">
              <div className="text-xs opacity-70">{new Date(it.created_at).toLocaleString()}</div>
              <div className="font-medium">{String(it.status).toUpperCase()}</div>
              {it.notes && <div className="text-sm">Notes: {it.notes}</div>}
            </li>
          ))}
          {items.length === 0 && <div className="text-sm opacity-70">No submissions yet.</div>}
        </ul>
      </section>
    </main>
  );
}
