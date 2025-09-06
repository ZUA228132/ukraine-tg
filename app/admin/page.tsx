'use client';
import { useEffect, useMemo, useState } from 'react';

function useInitData() {
  return useMemo(() => (typeof window !== 'undefined' ? (window as any)?.Telegram?.WebApp?.initData || '' : ''), []);
}
async function api(path: string, initData: string, opts: RequestInit = {}) {
  const res = await fetch(path, { ...opts, headers: { 'x-tg-initdata': initData, 'content-type': 'application/json', ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function AdminPage() {
  const initData = useInitData();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { if (initData) api('/api/admin/verifications?status=pending', initData).then(r=>setItems(r.items)); }, [initData]);
  async function review(id: string, action: 'approve'|'reject') {
    await api('/api/admin/review', initData, { method: 'POST', body: JSON.stringify({ id, action }) });
    setItems((s)=>s.filter(x=>x.id!==id));
  }
  async function openSigned(path: string) {
    const r = await api('/api/admin/download-url', initData, { method: 'POST', body: JSON.stringify({ path }) });
    window.open(r.url, '_blank');
  }
  return (
    <main className="p-6 max-w-3xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Admin Moderation</h1>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="border border-white/20 p-3 rounded">
            <div className="text-xs opacity-70">{new Date(it.created_at).toLocaleString()}</div>
            <div>User: {it.user_tg_id}</div>
            <div className="break-all">Video: <button className="underline" onClick={()=>openSigned(it.video_path)}>{it.video_path}</button></div>
            <div className="break-all">Doc: <button className="underline" onClick={()=>openSigned(it.doc_path)}>{it.doc_path}</button></div>
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => review(it.id, 'approve')}>Approve</button>
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => review(it.id, 'reject')}>Reject</button>
            </div>
          </li>
        ))}
        {items.length === 0 && <div className="text-sm opacity-70">No pending items.</div>}
      </ul>
    </main>
  );
}
