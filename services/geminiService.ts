// Integrated backend calls to Vercel functions + Supabase
import { Submission } from '../types';

function initData(): string {
  // Telegram injects WebApp.initData
  return (window as any)?.Telegram?.WebApp?.initData || '';
}

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'x-tg-initdata': initData(),
      ...(opts.headers || {}),
      ...(opts.body && typeof opts.body === 'string' ? { 'content-type': 'application/json' } : {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Request signed upload URL and upload a Blob/file */
async function upload(kind: 'video'|'doc', file: Blob, filename: string): Promise<string> {
  const r = await api('/api/upload-url', { method: 'POST', body: JSON.stringify({ kind, filename }) });
  const put = await fetch(r.uploadUrl, { method: 'PUT', body: file });
  if (!put.ok) throw new Error('upload failed');
  return r.path as string;
}

export const submitVerification = async (
  userName: string,
  imageData: string,
  videoBlob: Blob | null,
  passportImageData: string
): Promise<Submission> => {
  // Upsert me (also sets role if admin)
  await api('/api/auth-me', { method: 'POST' });

  // Convert base64 data URLs to Blob
  async function dataUrlToBlob(dataUrl: string) {
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  const docBlob = await dataUrlToBlob(passportImageData);
  const faceBlob = await dataUrlToBlob(imageData);
  // Prefer video for 'video'; fallback to face image if no video
  const video = videoBlob ?? faceBlob;

  const videoPath = await upload('video', video, 'selfie.mp4');
  const docPath = await upload('doc', docBlob, 'document.png');

  await api('/api/submit', { method: 'POST', body: JSON.stringify({ videoPath, docPath }) });

  // Return a local Submission shape for UI harmony
  return {
    id: Date.now().toString(),
    userName,
    imageData,
    passportImageData,
    timestamp: new Date().toISOString(),
  };
};

export const getSubmissions = async (): Promise<Submission[]> => {
  const r = await api('/api/me-verifications');
  return (r.items || []).map((it: any) => ({
    id: it.id,
    userName: String(it.user_tg_id),
    imageData: it.video_path, // storage key; no preview image here
    passportImageData: it.doc_path,
    timestamp: it.created_at,
  }));
};

export const clearSubmissions = async (): Promise<void> => {
  // For safety, do nothing destructive in prod. Admin can reject from /admin.
  return;
};
